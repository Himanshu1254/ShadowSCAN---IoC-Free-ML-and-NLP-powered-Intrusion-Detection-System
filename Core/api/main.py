from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
import shutil
import os
import requests

# --- NIDS IMPORTS ---
from NIDS.engine.pipeline import Pipeline
from NIDS.engine.runtime_state import state
from Core.metrics import set_counts, snapshot
from Core.shadow_logging.log_analyzer import LogAnalyzer

# --- INTELLIGENCE MODULES ---
from Core.shadow_logging.domain_resolver import DomainResolver
from Core.shadow_logging.geoip import GeoLocator

# --- HIDS IMPORTS ---
from HIDS.fim_scanner import start_fim_engine, fim_alerts
from HIDS.trackers.disk_tracker import get_disk_telemetry
from HIDS.trackers.service_tracker import get_active_services
from HIDS.trackers.gpu_tracker import get_gpu_telemetry
from HIDS.trackers.cpu_ram_tracker import get_cpu_ram_telemetry
from HIDS.fim_scanner import start_fim_engine, fim_alerts
from HIDS.process_scanner import get_suspicious_processes  # <-- NEW IMPORT


# -------------------------------------------------
# FastAPI App & Global Instantiations
# -------------------------------------------------

app = FastAPI(title="ShadowSCAN API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = Pipeline(mode="live", interface="Wi-Fi")
domain_resolver = DomainResolver()
geo_locator = GeoLocator()


# -------------------------------------------------
# OLLAMA COGNITIVE AI LOGIC (PAUSED/FALLBACK)
# -------------------------------------------------
# -------------------------------------------------
# OLLAMA COGNITIVE AI LOGIC & MEMORY CACHE
# -------------------------------------------------
ai_reasoning_cache = {}


def generate_ai_reasoning(
    attack_type: str, severity: str, src_ip: str, dst_port: int, protocol: str
) -> str:
    """Queries local Ollama instance and caches the heuristics to prevent server stutter."""
    if attack_type.lower() in ["benign", "normal"]:
        return "System telemetry indicates standard structural traffic layout. Regular operational baseline validated."

    # Create a unique mathematical signature for this specific threat vector
    threat_signature = f"{attack_type}_{src_ip}_{dst_port}_{protocol}"

    # If the AI has already analyzed this exact vector, return it from memory instantly
    if threat_signature in ai_reasoning_cache:
        return ai_reasoning_cache[threat_signature]

    url = "http://127.0.0.1:11434/api/generate"
    cyber_prompt = (
        f"You are an expert cybersecurity AI. Analyze this network threat alert in ONE short, professional sentence. "
        f"Threat: {attack_type}, Severity: {severity}, Source IP: {src_ip}, Target Port: {dst_port}, Protocol: {protocol}."
    )

    payload = {
        "model": "llama3",
        "prompt": cyber_prompt,
        "stream": False,
        "options": {"temperature": 0.2},
    }

    try:
        # Increased timeout to 2.5s to give the local LLM time to breathe on first load
        response = requests.post(url, json=payload, timeout=2.5)
        if response.status_code == 200:
            ai_text = response.json().get("response", "").strip()
            # Save to memory so we never have to wait for this calculation again
            ai_reasoning_cache[threat_signature] = ai_text
            return ai_text
    except Exception:
        pass

    fallback_text = f"Threat vector [{attack_type}] target signature detected on port {dst_port} utilizing {protocol} layer. High monitoring required."
    return fallback_text


# -------------------------------------------------
# Background Loop
# -------------------------------------------------
def pipeline_loop():
    print("\n[⚙️] BACKGROUND PIPELINE THREAD: INITIALIZED")
    while True:
        try:
            print("[⚙️] PIPELINE: Attempting to run Scapy sniffer...")
            result = pipeline.run_once()

            p_count = len(result.get("packets", []))
            print(f"[✅] PIPELINE: Sniff complete! Captured {p_count} packets.")

            state.update(result)

            set_counts(
                packets=p_count,
                flows=len(result.get("flows", [])),
                sessions=len(result.get("sessions", [])),
                alerts=len(result.get("alerts", [])),
            )
        except Exception as e:
            print(f"\n[🚨 CRITICAL] PIPELINE THREAD CRASHED: {e}\n")

        time.sleep(2)


@app.on_event("startup")
def start_engines():
    # Boot NIDS Pipeline Thread
    nids_thread = threading.Thread(target=pipeline_loop, daemon=True)
    nids_thread.start()

    # Boot HIDS FIM Engine Thread
    start_fim_engine()


# -------------------------------------------------
# NIDS API Endpoints
# -------------------------------------------------
@app.get("/overview/stats")
def overview_stats():
    return snapshot()


@app.get("/flows")
def get_flows():
    return state.flows


@app.get("/sessions")
def get_sessions():
    return state.sessions


@app.get("/test")
def test_pipeline():
    """Manual trigger for debugging the NIDS pipeline."""
    result = pipeline.run_once()
    return {
        "packets": len(result.get("packets", [])),
        "flows": len(result.get("flows", [])),
        "sessions": len(result.get("sessions", [])),
        "alerts": len(result.get("alerts", [])),
    }


@app.get("/alerts")
def get_alerts():
    """Intercepts anomalies and runs them through the local AI parser."""
    enriched_alerts = []
    raw_alerts = (
        state.alerts.slice(-100)
        if hasattr(state.alerts, "slice")
        else state.alerts[-100:]
    )

    for alert in raw_alerts:
        enriched = dict(alert)
        src_ip = enriched.get("src_ip", "")
        dst_ip = enriched.get("dst_ip", "")
        attack_type = enriched.get("attack_type", "Unknown Anomaly")
        severity = enriched.get("severity", "LOW")
        dst_port = enriched.get("dst_port", 0)
        protocol = enriched.get("protocol", "TCP")

        # Geolocation & Mapping Enrichment
        enriched["country"] = geo_locator.get_country(src_ip)
        enriched["dst_country"] = geo_locator.get_country(dst_ip)
        enriched["src_domain"] = domain_resolver.resolve(src_ip)
        enriched["dst_domain"] = domain_resolver.resolve(dst_ip)

        # Local Ollama / Fallback Heuristic Reasoning
        enriched["reason"] = generate_ai_reasoning(
            attack_type, severity, src_ip, dst_port, protocol
        )

        enriched_alerts.append(enriched)

    return enriched_alerts


@app.get("/intelligence/unverified")
def get_unverified_intel():
    return domain_resolver.get_all_unverified()


@app.post("/upload-log")
async def upload_log(file: UploadFile = File(...)):
    upload_dir = "Data/uploaded_logs"
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = file.filename if file.filename else "unnamed_upload.log"
    file_path = os.path.join(upload_dir, safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    analyzer = LogAnalyzer(file_path)
    return {"summary": analyzer.get_summary(), "report": analyzer.generate_nlp_report()}


@app.get("/health")
def health_check():
    model_exists = os.path.exists("models/anomaly_model.pkl")
    logging_active = os.path.exists("Data/captured_logs")
    return {
        "status": "online",
        "pipeline": "running",
        "ml_model": "loaded" if model_exists else "not_loaded",
        "logging": "active" if logging_active else "inactive",
        "alerts_active": len(state.alerts) > 0,
    }


# -------------------------------------------------
# HIDS API Endpoints
# -------------------------------------------------
@app.get("/hids/fim")
def get_fim_alerts():
    """Returns real-time File Integrity Monitoring alerts for the dashboard."""
    return fim_alerts


@app.get("/hids/processes")
def get_live_processes():
    """Returns a live snapshot of anomalous background processes."""
    return get_suspicious_processes()


# -------------------------------------------------
# HIDS HARDWARE & SERVICE ENDPOINTS
# -------------------------------------------------


@app.get("/hids/hardware/cpu_ram")
def api_get_cpu_ram():
    """Returns detailed CPU and RAM usage."""
    return get_cpu_ram_telemetry()


@app.get("/hids/hardware/disk")
def api_get_disk():
    """Returns overall and individual disk drive usage."""
    return get_disk_telemetry()


@app.get("/hids/hardware/gpu")
def api_get_gpu():
    """Returns NVIDIA GPU telemetry."""
    return get_gpu_telemetry()


@app.get("/hids/services")
def api_get_services():
    """Returns a list of actively running Windows services."""
    return get_active_services()
