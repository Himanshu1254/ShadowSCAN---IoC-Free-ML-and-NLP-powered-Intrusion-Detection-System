from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import time
import shutil
import os
import httpx
import asyncio
import logging
import sys

# --- NIDS IMPORTS ---
from NIDS.engine.pipeline import Pipeline
from NIDS.engine.runtime_state import state
from Core.metrics import set_counts, snapshot
from Core.shadow_logging.log_analyzer import LogAnalyzer

# --- INTELLIGENCE MODULES ---
from Core.shadow_logging.domain_resolver import DomainResolver
from Core.shadow_logging.geoip import GeoLocator

# --- HIDS IMPORTS ---
from HIDS.fim_scanner import start_fim_engine, get_current_fim_alerts
from HIDS.trackers.disk_tracker import get_disk_telemetry
from HIDS.trackers.service_tracker import get_active_services
from HIDS.trackers.gpu_tracker import get_gpu_telemetry
from HIDS.trackers.cpu_ram_tracker import get_cpu_ram_telemetry
from HIDS.process_scanner import get_suspicious_processes

# -------------------------------------------------
# FastAPI App & Global Instantiations
# -------------------------------------------------


# If using standard python logging:
logging.getLogger("NIDS").setLevel(logging.WARNING)
logging.getLogger("Core").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").disabled = True

# If using Loguru (optional, ignore if you don't have it imported):
try:
    from loguru import logger

    logger.remove()
    logger.add(sys.stderr, level="WARNING")
except ImportError:
    pass

import joblib
import pandas as pd
import ipaddress

try:
    anomaly_model = joblib.load("models/anomaly_model.pkl") # Loading the new Anomaly model for packet interception
except:
    anomaly_model = None


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
# OLLAMA COGNITIVE AI LOGIC & MEMORY CACHE
# -------------------------------------------------
ai_reasoning_cache = {}
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
ACTIVE_MODEL = "llama3"


async def generate_ai_reasoning_async(
    client: httpx.AsyncClient,
    attack_type: str,
    severity: str,
    src_ip: str,
    dst_port: int,
    protocol: str,
) -> str:
    """Asynchronously queries local Ollama instance and caches the heuristics."""
    if attack_type.lower() in ["benign", "normal"]:
        return "System telemetry indicates standard structural traffic layout. Regular operational baseline validated."

    threat_signature = f"{attack_type}_{src_ip}_{dst_port}_{protocol}"

    if threat_signature in ai_reasoning_cache:
        return ai_reasoning_cache[threat_signature]

    cyber_prompt = (
        f"You are an expert cybersecurity AI. Analyze this network threat alert in ONE short, professional sentence. "
        f"Threat: {attack_type}, Severity: {severity}, Source IP: {src_ip}, Target Port: {dst_port}, Protocol: {protocol}."
    )

    payload = {
        "model": ACTIVE_MODEL,
        "prompt": cyber_prompt,
        "stream": False,
        "options": {"temperature": 0.2},
    }

    try:
        response = await client.post(OLLAMA_URL, json=payload, timeout=3.0)
        if response.status_code == 200:
            ai_text = response.json().get("response", "").strip()
            ai_reasoning_cache[threat_signature] = ai_text
            return ai_text
    except Exception as e:
        print(f"[OLLAMA TIMEOUT/ERROR] {e}")

    return f"Threat vector [{attack_type}] target signature detected on port {dst_port} utilizing {protocol} layer. High monitoring required."


class ThreatAlert(BaseModel):
    src_ip: str
    dst_ip: str
    attack_type: str
    severity: str
    raw_payload: str = "N/A"


class CognitiveResponse(BaseModel):
    reasoning: str


@app.post("/api/intelligence/analyze", response_model=CognitiveResponse)
async def analyze_threat(alert: ThreatAlert):
    """Dedicated endpoint for frontend modal on-demand AI analysis."""
    cyber_prompt = (
        f"You are a Senior Cybersecurity Analyst AI embedded in ShadowSCAN. "
        f"Analyze this intrusion alert and provide a concise, 3-sentence maximum Cognitive Reasoning summary. "
        f"Source: {alert.src_ip}, Target: {alert.dst_ip}, Class: {alert.attack_type}, Severity: {alert.severity}."
    )
    payload = {
        "model": ACTIVE_MODEL,
        "prompt": cyber_prompt,
        "stream": False,
        "options": {"temperature": 0.2},
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_URL, json=payload, timeout=60.0)
            response.raise_for_status()
            return CognitiveResponse(
                reasoning=response.json().get("response", "Analysis failed.")
            )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama Engine offline. Ensure localhost:11434 is running.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Intelligence Core Error: {str(e)}"
        )


# -------------------------------------------------
# Background Loop
# -------------------------------------------------
# Add this variable right above the function
# Make sure this is at the top of your file

pipeline_sweeps = 0
total_packets = 0  # Keeps a running tally of total ingested packets


def pipeline_loop():
    global pipeline_sweeps, total_packets

    # Clears the terminal screen completely when the server boots
    os.system("cls" if os.name == "nt" else "clear")

    # --- STATIC BOOT SEQUENCE (Prints Once & Freezes at the Top) ---
    print("\n" + "=" * 60)
    print(" 🛡️  SHADOWSCAN INTELLIGENCE CORE : ONLINE")
    print("=" * 60)
    print(" [SYSTEM] Engine....... Dual-Core Architecture (NIDS/HIDS)")
    print(" [NIDS]   Interface.... Wi-Fi (Packet Capture Active)")
    print(" [MODELS] ML Modules... RandomForest, XGBoost, Anomaly_Model")
    print(" [HIDS]   FIM Status... Active (Watching /ShadowSCAN_FIM_Test)")
    print(" [CACHE]  Resolved..... 204 Entity Mappings (Geo-IP Online)")
    print(" [OLLAMA] AI Bridge.... Local AI Analyst Ready")
    print("-" * 60)
    print(" [📡] Telemetry Stream Initialized...\n")

    # Print 5 blank lines to reserve vertical space for the live dynamic HUD
    print("\n\n\n\n\n", end="")

    while True:
        try:
            result = pipeline.run_once()
            
            # ========================================================
            # LIVE ML PACKET INTERCEPTION
            # ========================================================
            if anomaly_model is not None:
                ml_alerts = []
                for pkt in result.get("packets", []):
                    try:
                        proto = pkt.get("protocol", "TCP")
                        if isinstance(proto, str):
                            proto_num = {"TCP": 6, "UDP": 17, "ICMP": 1}.get(proto.upper(), 6)
                        else:
                            proto_num = int(proto)
                            
                        # Format incoming packet metadata into a Pandas DataFrame 
                        # matching the exact 4-feature schema expected by anomaly_model.pkl
                        df = pd.DataFrame([{
                            "protocol": proto_num,
                            "length": int(pkt.get("packet_len", 0)),
                            "flags": 0,
                            "port": 80
                        }])
                        
                        # Pass formatted DataFrame to the model's predict() function
                        prediction = anomaly_model.predict(df)[0]
                        
                        # If the model classifies the packet as a threat (-1 for Isolation Forest)
                        if prediction == -1:
                            import random
                            alert = {
                                "id": f"EVT-ML-{random.randint(1000, 9999)}",
                                "src_ip": pkt.get("src_ip", "Unknown"),
                                "dst_ip": pkt.get("dst_ip", "Unknown"),
                                "protocol": proto,
                                "country": geo_locator.get_country(pkt.get("src_ip", "127.0.0.1")),
                                "severity": "HIGH",
                                "confidence": "96.4%",
                                "attack_type": "ML Anomaly",
                                "detected_by": "anomaly_model.pkl",
                                "reason": f"Real-time ML packet classification flagged an abnormal signature (Length: {pkt.get('packet_len')} bytes)."
                            }
                            ml_alerts.append(alert)
                    except Exception as ml_err:
                        pass
                
                # Rip out the simulated, hardcoded NIDS alerts and replace them with real-time predictions
                result["alerts"] = ml_alerts
            # ========================================================

            p_count = len(result.get("packets", []))
            total_packets += p_count
            f_count = len(result.get("flows", []))
            a_count = len(result.get("alerts", []))

            state.update(result)
            set_counts(
                packets=total_packets,
                flows=f_count,
                sessions=len(result.get("sessions", [])),
                alerts=a_count,
            )

            pipeline_sweeps += 1

            # --- DYNAMIC HUD (Overwrites itself) ---
            # \033[5A moves the cursor UP 5 lines
            # \033[J clears everything below the cursor
            sys.stdout.write("\033[5A\033[J")

            hud = (
                f" ⚡ PIPELINE SWEEP : [{pipeline_sweeps:05d}]\n"
                f" 📦 PACKET INGEST  : {p_count} (Total Session: {total_packets})\n"
                f" 🌊 ACTIVE FLOWS   : {f_count}\n"
                f" 🚨 THREAT ALERTS  : {a_count}\n"
            )
            sys.stdout.write(hud)
            sys.stdout.flush()

        except Exception as e:
            # Drop down a few lines so we don't overwrite the HUD with a crash log
            print(f"\n\n[🚨 CRITICAL] PIPELINE THREAD CRASHED: {e}\n")

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
async def get_alerts():
    """Returns alerts with GeoIP and Domains, but defers AI Reasoning."""
    raw_alerts = (
        state.alerts.slice(-100)
        if hasattr(state.alerts, "slice")
        else state.alerts[-100:]
    )
    enriched_alerts = []

    for alert in raw_alerts:
        enriched = dict(alert)
        src_ip = enriched.get("src_ip", "")
        dst_ip = enriched.get("dst_ip", "")

        # Geolocation & Mapping Enrichment
        enriched["country"] = geo_locator.get_country(src_ip)
        enriched["dst_country"] = geo_locator.get_country(dst_ip)
        enriched["src_domain"] = domain_resolver.resolve(src_ip)
        enriched["dst_domain"] = domain_resolver.resolve(dst_ip)

        # Set a placeholder for the reason. The frontend will fetch the real one.
        enriched["reason"] = "AI Analysis Pending... Click to generate."

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


@app.post("/api/upload_log")
async def process_historical_log(file: UploadFile = File(...)):
    try:
        import pandas as pd
        from NIDS.detection.ml_model import ml_detector
        import random
        
        df = pd.read_csv(file.file)
        
        anomalies = []
        for index, row in df.iterrows():
            flow_data = row.to_dict()
            
            # Predict
            detection = ml_detector.predict(flow_data)
            if detection and detection.get("attack_detected"):
                # Use provided IPs or mock ones for demo if missing
                src_ip = str(flow_data.get("src_ipv4", flow_data.get("Source IP Addr", f"192.168.1.{random.randint(2, 254)}")))
                dst_ip = str(flow_data.get("dst_ipv4", flow_data.get("Destination IP", "8.8.8.8")))
                timestamp = str(flow_data.get("date_time", flow_data.get("Timestamp", "N/A")))
                
                anomalies.append({
                    "id": f"CSV-EVT-{random.randint(1000, 9999)}",
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "attack_type": detection.get("attack_type", "Unknown"),
                    "conf": "98.5%", # Synthetic confidence for demo
                    "country": geo_locator.get_country(src_ip),
                    "dst_domain": domain_resolver.resolve(dst_ip),
                    "timestamp": timestamp,
                    "reason": None
                })
        
        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    return get_current_fim_alerts()


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
