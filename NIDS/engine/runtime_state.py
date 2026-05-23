from Core.config.config_loader import load_detection_config

class RuntimeState:

    def __init__(self):

        self.config = load_detection_config()

        self.max_items = self.config.get(
            "max_runtime_items",
            200
        )

        self.alerts = []
        self.flows = []
        self.sessions = []

    # --------------------------------------------------

    def update(self, result):

        MAX_ITEMS = self.max_items

        # --------------------------------------------------
        # ALERT DEDUPLICATION
        # --------------------------------------------------

        existing_alerts = {
            (
                a.get("src_ip"),
                a.get("dst_ip"),
                a.get("attack_type")
            )

            for a in self.alerts
        }

        for alert in result.get("alerts", []):

            key = (
                alert.get("src_ip"),
                alert.get("dst_ip"),
                alert.get("attack_type")
            )

            if key not in existing_alerts:

                self.alerts.append(alert)

    # --------------------------------------------------

        self.flows.extend(
            result.get("flows", [])
        )

        self.sessions.extend(
            result.get("sessions", [])
        )

        # --------------------------------------------------
        # MEMORY CAPS
        # --------------------------------------------------

        self.alerts = self.alerts[-MAX_ITEMS:]

        self.flows = self.flows[-MAX_ITEMS:]

        self.sessions = self.sessions[-MAX_ITEMS:]


# 🔥 GLOBAL RUNTIME STATE INSTANCE
state = RuntimeState()