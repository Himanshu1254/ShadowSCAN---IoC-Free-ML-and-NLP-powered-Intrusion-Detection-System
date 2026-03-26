import json
import time


class AlertLogger:
    def __init__(self):
        self.file = "alerts_log.json"

    def log(self, alert):
        entry = {
            "timestamp": time.time(),
            "data": alert
        }

        with open(self.file, "a") as f:
            f.write(json.dumps(entry) + "\n")