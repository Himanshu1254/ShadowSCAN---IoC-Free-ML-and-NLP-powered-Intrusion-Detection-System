from collections import defaultdict
from datetime import datetime, timedelta


class AlertCorrelator:
    def __init__(
        self,
        window_minutes=10,
        min_events=1
    ):
        """
        window_minutes: time window for correlation
        min_events: minimum alerts to raise a correlated alert
        """
        self.window = timedelta(minutes=window_minutes)
        self.min_events = min_events

    def correlate(self, raw_alerts):
        """
        raw_alerts: list of dicts with keys:
            - host
            - is_alert
            - severity
            - final_score
            - timestamp (ISO format)
            - evidence (optional)

        Returns: list of correlated alert dicts
        """

        grouped = defaultdict(list)

        # ---------------- GROUP BY HOST ----------------
        for alert in raw_alerts:
            if not alert["is_alert"]:
                continue

            host = alert["host"]
            ts = datetime.fromisoformat(alert["timestamp"])
            grouped[host].append((ts, alert))

        correlated_alerts = []

        # ---------------- TIME WINDOW CORRELATION ----------------
        for host, events in grouped.items():
            events.sort(key=lambda x: x[0])

            bucket = []
            bucket_start = None

            for ts, alert in events:
                if bucket_start is None:
                    bucket_start = ts
                    bucket.append(alert)
                    continue

                if ts - bucket_start <= self.window:
                    bucket.append(alert)
                else:
                    correlated = self._build_alert(host, bucket)
                    if correlated:
                        correlated_alerts.append(correlated)

                    bucket = [alert]
                    bucket_start = ts

            # Final bucket
            correlated = self._build_alert(host, bucket)
            if correlated:
                correlated_alerts.append(correlated)

        return correlated_alerts

    def _build_alert(self, host, alerts):
        if len(alerts) < self.min_events:
            return None

        max_sev = max(a["severity"] for a in alerts)
        avg_score = sum(a["final_score"] for a in alerts) / len(alerts)

        return {
            "host": host,
            "severity": self._severity_label(max_sev),
            "confidence": round(min(avg_score / 3.0, 1.0), 3),
            "event_count": len(alerts),
            "first_seen": alerts[0]["timestamp"],
            "last_seen": alerts[-1]["timestamp"],
            "evidence": alerts
        }

    def _severity_label(self, severity_score):
        if severity_score >= 7:
            return "critical"
        elif severity_score >= 4:
            return "high"
        elif severity_score >= 2:
            return "medium"
        else:
            return "low"
