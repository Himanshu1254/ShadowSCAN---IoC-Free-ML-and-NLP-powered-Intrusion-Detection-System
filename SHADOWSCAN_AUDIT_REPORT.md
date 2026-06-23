# 🛡️ ShadowSCAN System Audit Report

## 1. Codebase Health & Broken Links

### Missing Error Handling (FastAPI)
The vast majority of the `GET` endpoints in `Core/api/main.py` lack basic `try/except` blocks. If any of the underlying trackers or state mechanisms throw an exception (e.g., restricted file access, uninitialized lists), the FastAPI server will directly crash or return an unhandled 500 error to the UI.
Endpoints lacking `try/except` wrappers:
- `@app.get("/overview/stats")`
- `@app.get("/flows")`
- `@app.get("/sessions")`
- `@app.get("/alerts")`
- `@app.get("/test")`
- `@app.get("/intelligence/unverified")`
- `@app.post("/upload-log")`
- `@app.get("/health")`
- All `/hids/*` hardware and service tracking endpoints (`/hids/fim`, `/hids/processes`, `/hids/hardware/cpu_ram`, etc.)

### Broken Data Pipelines (React ↔ FastAPI Mismatch)
- **`ui/src/api/status.ts`**: The frontend defines a function `getSystemStatus()` that calls `apiGet("/status")`. The backend does not have a `/status` endpoint defined.
- **`ui/src/api/overview.ts`**: The frontend defines `fetchSystemStatus()` that calls `api.get("/overview/status")`. The backend does not have an `/overview/status` endpoint (it should point to `/overview/stats`).

### Unused/Orphaned Components
- The `/test` endpoint in `main.py` is an orphaned diagnostic endpoint that allows manual triggering of the pipeline but is never utilized by any React component.

## 2. Live Localhost Status
We performed a live ping of the presumed `http://localhost:8000` endpoints to verify the JSON data pipeline integrity. 

| Endpoint | Result | Notes |
| :--- | :--- | :--- |
| `GET /alerts` | **200 OK** | Fully operational; returns correctly formatted JSON. |
| `GET /hids/processes` | **200 OK** | Fully operational; returning snapshot of background processes. |
| `GET /overview/stats` | **200 OK** | Fully operational. |
| `GET /health` | **200 OK** | Fully operational. |
| `GET /api/alerts` | **404 ERROR** | Expected failure (The endpoint is explicitly defined as `/alerts` in `main.py`). |
| `GET /status` | **404 ERROR** | **CRITICAL PIPELINE BREAK**: The frontend is attempting to fetch this missing route. |
| `GET /overview/status`| **404 ERROR** | **CRITICAL PIPELINE BREAK**: The frontend is attempting to fetch this missing route. |

## 3. Capability Matrix

### Strengths (What works brilliantly)
- **Unified Engine Architecture:** The hybrid combination of NIDS (Network Intrusion Detection) and HIDS (Host Intrusion Detection) in a single asynchronous FastAPI backend is an excellent design choice.
- **AI Triage Mechanism:** The integration of a local Ollama instance (`/api/intelligence/analyze`) provides a significant value-add for cognitive threat reasoning.
- **Machine Learning Inference:** The real-time transformation of packet metadata into Pandas DataFrames and inference using a live Scikit-learn Anomaly model is implemented effectively.
- **Tiered Threat Simulation:** The implementation of Student/Personal/Enterprise tiered mocked alerts allows the system to seamlessly function as both an educational and enterprise product.

### Weaknesses (What is fundamentally lacking)
- **Brittleness:** Lack of global exception handlers and `try/except` statements in API routes.
- **Memory Leaks & Scalability:** Threat alerts, flows, and packets are appended to global states (`state.update(result)`, `state.alerts`, `state.flows`) entirely in-memory. If the system is left running for days in a high-throughput network, the backend will inevitably OOM (Out of Memory) crash.
- **Absence of Persistence:** There is no database integration (PostgreSQL, Redis, etc.). All ingested network traffic and generated ML insights are lost upon a server restart.

### Anticipated User Needs (Gap Analysis)
- **Student User:** Requires an interactive tutorial overlay or "glossary" tooltips explaining what NIDS/HIDS and ML models are directly in the UI.
- **Personal User:** Requires background service installation capabilities so the app can run on boot silently without an active terminal.
- **Enterprise User:** Missing essential enterprise SOC features including Role-Based Access Control (RBAC), Single Sign-On (SSO), data export capabilities (CSV/PDF reporting), SIEM integration (e.g., syslog forwarding to Splunk), and persistent long-term storage of incidents.

## 4. Immediate Remediation Plan

Execute the following fixes to patch the broken UI pipelines and add baseline error handling to the critical endpoints.

### Fix 1: Repair the Frontend API Mismatches
The frontend is calling incorrect routes. Modify the React API client files to point to `/overview/stats` and `/health`.

In `ui/src/api/status.ts`, change line 4:
```typescript
// BEFORE
return apiGet("/status")

// AFTER
return apiGet("/health")
```

In `ui/src/api/overview.ts`, change line 25:
```typescript
// BEFORE
const res = await api.get("/overview/status");

// AFTER
const res = await api.get("/overview/stats");
```

### Fix 2: Wrap Backend Endpoints in `try/except`
In `Core/api/main.py`, apply exception handling to the core metric endpoints to prevent fatal crashes if the pipeline engine fails.

```python
@app.get("/overview/stats")
def overview_stats():
    try:
        return snapshot()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/flows")
def get_flows():
    try:
        return state.flows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    try:
        model_exists = os.path.exists("models/anomaly_model.pkl")
        logging_active = os.path.exists("Data/captured_logs")
        return {
            "status": "online",
            "pipeline": "running",
            "ml_model": "loaded" if model_exists else "not_loaded",
            "logging": "active" if logging_active else "inactive",
            "alerts_active": len(state.alerts) > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```
