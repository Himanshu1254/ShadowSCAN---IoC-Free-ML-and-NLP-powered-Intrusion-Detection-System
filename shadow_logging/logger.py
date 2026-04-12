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

        # 🔥 FIXED BASE PATH (always project root)
        self.base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "captured_logs")
        )
        os.makedirs(self.base_dir, exist_ok=True)

        interval = self.config.get("interval", "hourly")

        # 🔥 SMART FOLDER REUSE
        self.session_dir = self.get_or_create_folder(interval)

        self.alerts_file = os.path.join(self.session_dir, "alerts.csv")
        self.sessions_file = os.path.join(self.session_dir, "sessions.csv")
        self.flows_file = os.path.join(self.session_dir, "flows.csv")

        # Create headers only once
        if not os.path.exists(self.alerts_file):
            self.init_files()

    def load_config(self):
        try:
            with open("config/logging_config.json", "r") as f:
                return json.load(f)
        except:
            return {"enabled": True, "interval": "hourly"}

    # 🔥 CORE LOGIC (IMPORTANT)
    def get_or_create_folder(self, interval):
        now = datetime.now()

        if interval == "hourly":
            key = now.strftime("%Y-%m-%d_%H")
        elif interval == "daily":
            key = now.strftime("%Y-%m-%d")
        else:
            key = now.strftime("%Y-%m-%d_%H-%M-%S")

        # Try reuse existing folder
        for folder in os.listdir(self.base_dir):
            if key in folder:
                return os.path.join(self.base_dir, folder)

        # Else create new
        unique_id = str(uuid.uuid4())[:4]
        folder_name = f"{key}_session_{unique_id}_logs"

        path = os.path.join(self.base_dir, folder_name)
        os.makedirs(path, exist_ok=True)

        return path

    def init_files(self):
        with open(self.alerts_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp","src_ip","dst_ip","protocol",
                "severity","confidence","attack_type","reason","country"
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
                    a.get("country"),
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