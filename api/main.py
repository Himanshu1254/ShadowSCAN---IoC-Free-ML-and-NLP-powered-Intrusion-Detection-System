from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import time

from engine.pipeline import Pipeline
from engine.runtime_state import state
from metrics import set_counts, snapshot

from fastapi import UploadFile, File
import shutil
import os
from shadow_logging.log_analyzer import LogAnalyzer


# -------------------------------------------------
# FastAPI App
# -------------------------------------------------

app = FastAPI(title="ShadowSCAN API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Pipeline (LIVE MODE)
# -------------------------------------------------

pipeline = Pipeline(mode="live")

# -------------------------------------------------
# Background Loop
# -------------------------------------------------

def pipeline_loop():
    while True:
        result = pipeline.run_once()
        state.update(result)

        set_counts(
            packets=len(result["packets"]),
            flows=len(result["flows"]),
            sessions=len(result["sessions"]),
            alerts=len(result["alerts"]),
        )

        time.sleep(5)


@app.on_event("startup")
def start_pipeline():
    thread = threading.Thread(target=pipeline_loop, daemon=True)
    thread.start()

# -------------------------------------------------
# API Endpoints
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


@app.get("/alerts")
def get_alerts():
    return state.alerts


@app.post("/upload-log")
async def upload_log(file: UploadFile = File(...)):
    upload_dir = "uploaded_logs"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analyzer = LogAnalyzer(file_path)

    return {
        "summary": analyzer.get_summary(),
        "report": analyzer.generate_nlp_report()
    }