import os
import time
import hashlib
import threading
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Global list to hold our live FIM alerts
fim_alerts = []

# Ensure the test folder is created directly inside the ShadowSCAN project root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MONITOR_DIR = os.path.join(BASE_DIR, "ShadowSCAN_FIM_Test")


def get_current_fim_alerts():
    """Safely returns the live list to FastAPI"""
    return list(fim_alerts)


def calculate_sha256(filepath, retries=5, delay=0.2):
    """Calculates the real SHA-256 cryptographic hash of a file with lock-handling."""
    sha256_hash = hashlib.sha256()
    
    for attempt in range(retries):
        try:
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except PermissionError:
            # File is locked by the OS or another process (e.g. still writing)
            time.sleep(delay)
        except FileNotFoundError:
            return "DELETED_DURING_SCAN"
        except Exception:
            break
            
    return "ACCESS_DENIED_OR_LOCKED"


class FIMEventHandler(FileSystemEventHandler):
    def _log_event(self, event_type, filepath):
        if os.path.isdir(filepath):
            return

        timestamp = datetime.now().strftime("%H:%M:%S")
        file_hash = "DELETED_NO_HASH"

        if event_type != "deleted":
            # The lock handling is now managed safely within calculate_sha256
            file_hash = calculate_sha256(filepath)

        alert = {
            "timestamp": timestamp,
            "event_type": event_type,
            "file_path": filepath,
            "hash": file_hash,
        }

        fim_alerts.insert(0, alert)
        if len(fim_alerts) > 50:
            fim_alerts.pop()

        # Pushes the alert to the terminal, safely dropping down a line
        print(f"\n[🚨 FIM TRIGGER] {event_type.upper()}: {os.path.basename(filepath)}")

    def on_created(self, event):
        self._log_event("created", event.src_path)

    def on_modified(self, event):
        self._log_event("modified", event.src_path)

    def on_deleted(self, event):
        self._log_event("deleted", event.src_path)


def run_fim_observer():
    os.makedirs(MONITOR_DIR, exist_ok=True)
    print(f"\n[*] FIM ENGINE ONLINE: Watching -> {MONITOR_DIR}")

    event_handler = FIMEventHandler()
    observer = Observer()
    observer.schedule(event_handler, MONITOR_DIR, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"[FIM CRASH] {e}")
        observer.stop()
    observer.join()


def start_fim_engine():
    # Properly spinning up as a background daemon thread
    fim_thread = threading.Thread(target=run_fim_observer, daemon=True)
    fim_thread.start()
