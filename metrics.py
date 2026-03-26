_metrics = {
    "packets": 0,
    "flows": 0,
    "sessions": 0,
    "alerts_24h": 0,
}

def set_counts(packets: int, flows: int, sessions: int, alerts: int):
    _metrics["packets"] = packets
    _metrics["flows"] = flows
    _metrics["sessions"] = sessions
    _metrics["alerts_24h"] = alerts

def snapshot():
    return _metrics
