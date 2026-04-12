import os
import csv
import uuid
import json
from datetime import datetime


class SessionLogger:
    def __init__(self):
        self.config = self.load_config()

        if not self.config.get("enabled", True):
            self.disabled = True
            return

        self.disabled = False

        # Main logs folder
        self.base_dir = os.path.join(os.getcwd(), "captured_logs")
        os.makedirs(self.base_dir, exist_ok=True)

        # Interval logic
        interval = self.config.get("interval", "session")

        if interval == "hourly":
            timestamp = datetime.now().strftime("%Y-%m-%d_%H")
        elif interval == "daily":
            timestamp = datetime.now().strftime("%Y-%m-%d")
        else:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

        unique_id = str(uuid.uuid4())[:4]

        self.session_dir = os.path.join(
            self.base_dir,
            f"{timestamp}_session_{unique_id}_logs"
        )

        os.makedirs(self.session_dir, exist_ok=True)

        # File paths
        self.alerts_file = os.path.join(self.session_dir, "alerts.csv")
        self.sessions_file = os.path.join(self.session_dir, "sessions.csv")
        self.flows_file = os.path.join(self.session_dir, "flows.csv")

        self.init_files()

    def load_config(self):
        try:
            with open("config/logging_config.json", "r") as f:
                return json.load(f)
        except:
            return {"enabled": True, "interval": "session"}

    def init_files(self):
        with open(self.alerts_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp","src_ip","dst_ip","protocol",
                "severity","confidence","attack_type","reason"
            ])

        with open(self.sessions_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "session_id","src_ip","dst_ip",
                "src_port","dst_port","protocol",
                "packet_count","byte_count","flow_count"
            ])

        with open(self.flows_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "src_ip","dst_ip","src_port",
                "dst_port","protocol",
                "packet_count","byte_count"
            ])

    def log_alerts(self, alerts):
        if self.disabled:
            return

        with open(self.alerts_file, "a", newline="") as f:
            writer = csv.writer(f)

            for a in alerts:
                writer.writerow([
                    datetime.now().strftime("%H:%M:%S"),
                    a.get("src_ip"),
                    a.get("dst_ip"),
                    a.get("protocol"),
                    a.get("severity"),
                    a.get("confidence"),
                    a.get("attack_type"),
                    a.get("reason"),
                ])

    def log_sessions(self, sessions):
        if self.disabled:
            return

        with open(self.sessions_file, "a", newline="") as f:
            writer = csv.writer(f)

            for s in sessions:
                writer.writerow([
                    s.get("session_id"),
                    s.get("src_ip"),
                    s.get("dst_ip"),
                    s.get("src_port"),
                    s.get("dst_port"),
                    s.get("protocol"),
                    s.get("packet_count"),
                    s.get("byte_count"),
                    s.get("flow_count"),
                ])

    def log_flows(self, flows):
        if self.disabled:
            return

        with open(self.flows_file, "a", newline="") as f:
            writer = csv.writer(f)

            for fl in flows:
                writer.writerow([
                    fl.get("src_ip"),
                    fl.get("dst_ip"),
                    fl.get("src_port"),
                    fl.get("dst_port"),
                    fl.get("protocol"),
                    fl.get("packet_count"),
                    fl.get("byte_count"),
                ])