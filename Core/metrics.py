import threading

_metrics_lock = threading.Lock()

_metrics = {
    "packets": 0,
    "flows": 0,
    "sessions": 0,
    "alerts_24h": 0,
}

def set_counts(packets: int, flows: int, sessions: int, alerts: int):
    with _metrics_lock:
        _metrics["packets"] = packets
        _metrics["flows"] = flows
        _metrics["sessions"] = sessions
        _metrics["alerts_24h"] = alerts

def snapshot():
    with _metrics_lock:
        return _metrics.copy()
