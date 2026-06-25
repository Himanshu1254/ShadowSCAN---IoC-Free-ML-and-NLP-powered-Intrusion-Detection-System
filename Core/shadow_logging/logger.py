import os
import csv
import uuid
import json
import sys
from datetime import datetime
from loguru import logger

# --- Unified Loguru Configuration ---
logger.remove()
logger.add(sys.stderr, level="INFO", colorize=True, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")
logger.add("logs/system.log", rotation="50 MB", level="INFO")
logger.add("logs/threats.log", rotation="10 MB", level="WARNING", filter=lambda record: "ALERT" in record["extra"])
logger.add("logs/errors.log", rotation="10 MB", level="ERROR")
logger.add("logs/performance.log", rotation="10 MB", level="DEBUG", filter=lambda record: "PERF" in record["extra"])



class SessionLogger:

    def __init__(self):

        self.config = self.load_config()

        if not self.config.get("enabled", True):

            self.disabled = True
            return

        self.disabled = False

        # 🔥 PROJECT ROOT SAFE PATH
        self.base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "captured_logs")
        )

        os.makedirs(self.base_dir, exist_ok=True)

        interval = self.config.get("interval", "hourly")

        # 🔥 SMART SESSION REUSE
        self.session_dir = self.get_or_create_folder(interval)

        self.alerts_file = os.path.join(self.session_dir, "alerts.csv")

        self.sessions_file = os.path.join(self.session_dir, "sessions.csv")

        self.flows_file = os.path.join(self.session_dir, "flows.csv")

        # 🔥 INIT FILES ONLY ONCE
        if not os.path.exists(self.alerts_file):

            self.init_files()

        logger.success("Logger initialized")

    # --------------------------------------------------

    def load_config(self):

        try:

            with open("Core/config/logging_config.json", "r") as f:

                return json.load(f)

        except Exception as e:

            logger.error(f"[LOGGER CONFIG ERROR] {e}")

            return {"enabled": True, "interval": "hourly"}

    # --------------------------------------------------

    def get_or_create_folder(self, interval):

        now = datetime.now()

        if interval == "hourly":

            key = now.strftime("%Y-%m-%d_%H")

        elif interval == "daily":

            key = now.strftime("%Y-%m-%d")

        else:

            key = now.strftime("%Y-%m-%d_%H-%M-%S")

        # 🔥 REUSE EXISTING SESSION FOLDER
        try:

            for folder in os.listdir(self.base_dir):

                if key in folder:

                    return os.path.join(self.base_dir, folder)

        except Exception as e:

            logger.error(f"[LOGGER FOLDER SCAN ERROR] {e}")

        # 🔥 CREATE NEW SESSION FOLDER
        unique_id = str(uuid.uuid4())[:4]

        folder_name = f"{key}_session_{unique_id}_logs"

        path = os.path.join(self.base_dir, folder_name)

        os.makedirs(path, exist_ok=True)

        return path

    # --------------------------------------------------

    def init_files(self):

        try:

            with open(self.alerts_file, "w", newline="") as f:

                writer = csv.writer(f)

                writer.writerow(
                    [
                        "timestamp",
                        "src_ip",
                        "dst_ip",
                        "protocol",
                        "severity",
                        "confidence",
                        "attack_type",
                        "reason",
                        "country",
                    ]
                )

            with open(self.sessions_file, "w", newline="") as f:

                writer = csv.writer(f)

                writer.writerow(
                    [
                        "session_id",
                        "src_ip",
                        "dst_ip",
                        "src_port",
                        "dst_port",
                        "protocol",
                        "packet_count",
                        "byte_count",
                        "flow_count",
                    ]
                )

            with open(self.flows_file, "w", newline="") as f:

                writer = csv.writer(f)

                writer.writerow(
                    [
                        "src_ip",
                        "dst_ip",
                        "src_port",
                        "dst_port",
                        "protocol",
                        "packet_count",
                        "byte_count",
                    ]
                )

        except Exception as e:

            logger.error(f"[LOGGER INIT ERROR] {e}")

    # --------------------------------------------------

    def trim_large_file(self, file_path):

        try:

            if not os.path.exists(file_path):
                return

            size_mb = os.path.getsize(file_path) / (1024 * 1024)

            # 🔥 10MB LIMIT
            if size_mb < 10:
                return

            with open(file_path, "r") as f:
                lines = f.readlines()

            # 🔥 KEEP LAST 2000 LINES
            trimmed = lines[-2000:]

            with open(file_path, "w") as f:
                f.writelines(trimmed)

            logger.info(f"Trimmed {file_path}")

        except Exception as e:

            logger.error(f"[LOGGER TRIM ERROR] {e}")

    # --------------------------------------------------

    def log_alerts(self, alerts):

        if self.disabled:
            return

        try:

            self.trim_large_file(self.alerts_file)

            with open(self.alerts_file, "a", newline="") as f:

                writer = csv.writer(f)

                for a in alerts:

                    writer.writerow(
                        [
                            datetime.now().strftime("%H:%M:%S"),
                            a.get("src_ip"),
                            a.get("dst_ip"),
                            a.get("protocol"),
                            a.get("severity"),
                            a.get("confidence"),
                            a.get("attack_type"),
                            a.get("reason"),
                            a.get("country"),
                        ]
                    )

        except Exception as e:

            logger.error(f"[LOGGER ALERT ERROR] {e}")

    # --------------------------------------------------

    def log_sessions(self, sessions):

        if self.disabled:
            return

        try:

            self.trim_large_file(self.sessions_file)

            with open(self.sessions_file, "a", newline="") as f:

                writer = csv.writer(f)

                for s in sessions:

                    writer.writerow(
                        [
                            s.get("session_id"),
                            s.get("src_ip"),
                            s.get("dst_ip"),
                            s.get("src_port"),
                            s.get("dst_port"),
                            s.get("protocol"),
                            s.get("packet_count"),
                            s.get("byte_count"),
                            s.get("flow_count"),
                        ]
                    )

        except Exception as e:

            logger.error(f"[LOGGER SESSION ERROR] {e}")

    # --------------------------------------------------

    def log_flows(self, flows):

        if self.disabled:
            return

        try:

            self.trim_large_file(self.flows_file)

            with open(self.flows_file, "a", newline="") as f:

                writer = csv.writer(f)

                for fl in flows:

                    writer.writerow(
                        [
                            fl.get("src_ip"),
                            fl.get("dst_ip"),
                            fl.get("src_port"),
                            fl.get("dst_port"),
                            fl.get("protocol"),
                            fl.get("packet_count"),
                            fl.get("byte_count"),
                        ]
                    )

        except Exception as e:

            logger.error(f"[LOGGER FLOW ERROR] {e}")


class ShadowLogger:
    def __init__(self):
        self.csv_logger = SessionLogger()

    def log_pipeline(self, msg):
        logger.info(f"[PIPELINE] {msg}")

    def log_packet(self, packet):
        logger.debug(f"[PACKET] {packet.get('src_ip')} -> {packet.get('dst_ip')} | Proto: {packet.get('protocol')}")

    def log_alerts(self, alerts):
        self.csv_logger.log_alerts(alerts)
        for a in alerts:
            alert_logger = logger.bind(ALERT=True)
            alert_logger.warning(f"[THREAT DETECTED] {a.get('attack_type')} from {a.get('src_ip')} to {a.get('dst_ip')} | Severity: {a.get('severity')}")

    def log_performance(self, metrics):
        perf_logger = logger.bind(PERF=True)
        perf_logger.debug(f"[PERF] {metrics}")

    def log_error(self, msg):
        logger.error(msg)

    def log_exception(self, e):
        logger.exception(e)
        
    def log_flows(self, flows):
        self.csv_logger.log_flows(flows)
        
    def log_sessions(self, sessions):
        self.csv_logger.log_sessions(sessions)

shadow_logger = ShadowLogger()
