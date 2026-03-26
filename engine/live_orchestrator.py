from datetime import datetime
from typing import List, Dict, Any
import uuid

from metrics import inc_alerts


class LiveOrchestrator:
    def __init__(self, detector, correlator):
        self.detector = detector
        self.correlator = correlator
        self._alert_store: Dict[str, Dict[str, Any]] = {}

    def run(self, sessions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raw_alerts: List[Dict[str, Any]] = []

        for session in sessions:
            detections = self.detector.detect(session)

            for d in detections:
                alert_id = str(uuid.uuid4())

                alert = {
                    "alert_id": alert_id,
                    "time": datetime.utcnow().strftime("%H:%M:%S"),
                    "type": d.get("type", "Anomaly"),
                    "description": d.get(
                        "description", "Behavioral anomaly detected"
                    ),
                    "source": session.get("endpoints", "unknown"),
                    "severity": d.get("severity", "low"),
                    "is_alert": d.get("is_alert", True),

                    # drilldown
                    "detector": d.get("detector", "unspecified"),
                    "score": d.get("score"),
                    "threshold": d.get("threshold"),
                    "session": session,
                    "flows": session.get("flows_detail", []),
                }

                raw_alerts.append(alert)
                self._alert_store[alert_id] = alert

        final_alerts = self.correlator.correlate(raw_alerts)

        count = sum(1 for a in final_alerts if a.get("is_alert", True))
        if count:
            inc_alerts(count)

        return [
            {
                "alert_id": a["alert_id"],
                "time": a["time"],
                "type": a["type"],
                "description": a["description"],
                "source": a["source"],
                "severity": a["severity"],
            }
            for a in final_alerts
            if a.get("is_alert", True)
        ]

    def get_alert(self, alert_id: str):
        return self._alert_store.get(alert_id)
