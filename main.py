from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
import os

from engine.pipeline import Pipeline
from engine.runtime_state import state
from metrics import set_counts, snapshot

app = FastAPI()

# ✅ CORS (frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Initialize pipeline
pipeline = Pipeline(mode="live", interface="Wi-Fi")


# 🔥 MAIN BACKGROUND LOOP (FIXED + STABLE)
def pipeline_loop():

    while True:

        try:

            result = pipeline.run_once()

            state.update(result)

            set_counts(
                packets=len(result["packets"]),
                flows=len(result["flows"]),
                sessions=len(result["sessions"]),
                alerts=len(result["alerts"]),
            )

            print(f"📦 Packets: {len(result['packets'])}")
            print(f"🌊 Flows: {len(result['flows'])}")
            print(f"🧩 Sessions: {len(result['sessions'])}")
            print(f"🚨 Alerts: {len(result['alerts'])}")

        except Exception as e:

            print("❌ Pipeline runtime error")

            print(e)

        time.sleep(5)


# ✅ Start thread on app startup
@app.on_event("startup")
def start_pipeline():
    thread = threading.Thread(target=pipeline_loop, daemon=True)
    thread.start()


# ---------------- API ROUTES ---------------- #

@app.get("/")
def root():
    return {"status": "ShadowSCAN running"}


@app.get("/overview/stats")
def overview_stats():
    return snapshot()


@app.get("/alerts")
def get_alerts():
    return state.alerts


@app.get("/flows")
def get_flows():
    return state.flows


@app.get("/sessions")
def get_sessions():
    return state.sessions


# 🔥 DEBUG ROUTE (VERY USEFUL)
@app.get("/test")
def test_pipeline():
    result = pipeline.run_once()
    return {
        "packets": len(result["packets"]),
        "flows": len(result["flows"]),
        "sessions": len(result["sessions"]),
        "alerts": len(result["alerts"]),
    }

@app.get("/health")
def health_check():

    model_exists = os.path.exists(
        "models/anomaly_model.pkl"
    )

    logging_active = os.path.exists(
        "captured_logs"
    )

    return {
        "status": "online",

        "pipeline": "running",

        "ml_model": (
            "loaded"
            if model_exists
            else "not_loaded"
        ),

        "logging": (
            "active"
            if logging_active
            else "inactive"
        ),

        "alerts_active": len(state.alerts) > 0
    }