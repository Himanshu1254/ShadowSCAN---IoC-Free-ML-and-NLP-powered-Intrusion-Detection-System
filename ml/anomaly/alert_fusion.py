class AlertFusion:
    def fuse(self, sessions):
        alerts = []

        for s in sessions:
            try:
                alerts.append({
                    "type": "Suspicious Activity",
                    "src_ip": s.get("src_ip", "unknown"),
                    "dst_ip": s.get("dst_ip", "unknown"),
                    "protocol": s.get("protocol", "unknown"),
                    "severity": "low",
                    "description": "Live traffic detected (demo mode)"
                })
            except Exception:
                continue

        return alerts