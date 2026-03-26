class RuntimeState:
    def __init__(self):
        self.packets = []
        self.flows = []
        self.sessions = []
        self.alerts = []

    def update(self, result):
        # Always update latest snapshots
        self.packets = result.get("packets", [])
        self.flows = result.get("flows", [])
        self.sessions = result.get("sessions", [])

        # 🔥 IMPORTANT: Append alerts instead of replacing
        new_alerts = result.get("alerts", [])

        for alert in new_alerts:
            # Prevent duplicates (simple check)
            if alert not in self.alerts:
                self.alerts.append(alert)

        # Optional: keep last 100 alerts only
        self.alerts = self.alerts[-100:]


# Global state instance
state = RuntimeState()