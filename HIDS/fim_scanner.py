import time
import hashlib
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Global list to hold HIDS alerts in memory
fim_alerts = []


class FIMTracker(FileSystemEventHandler):
    def calculate_sha256(self, filepath, retries=3, delay=0.1):
        """Generates a cryptographic hash, with micro-retries for Windows file locks."""
        hasher = hashlib.sha256()
        for attempt in range(retries):
            try:
                with open(filepath, "rb") as f:
                    buf = f.read(65536)
                    while len(buf) > 0:
                        hasher.update(buf)
                        buf = f.read(65536)
                return hasher.hexdigest()
            except PermissionError:
                if attempt < retries - 1:
                    time.sleep(delay)
                else:
                    return "[ACCESS DENIED - FILE LOCKED]"
            except FileNotFoundError:
                return "[FILE DELETED]"
            except Exception as e:
                return f"[ERROR] {e}"

    def log_event(self, action, filepath, file_hash=None):
        """Creates a standardized alert payload for the React dashboard AND the console."""
        alert = {
            "timestamp": time.strftime("%H:%M:%S"),
            "action": action,
            "filepath": filepath,
            "hash": file_hash or "N/A",
        }
        fim_alerts.append(alert)
        # Keep memory clean by only storing the last 50 FIM events
        if len(fim_alerts) > 50:
            fim_alerts.pop(0)

        # THE HACKERMAN TERMINAL LOG YOU WERE CRYING ABOUT
        print(
            f"[{alert['timestamp']}] 🚨 FIM EVENT -> {action}: {filepath} | HASH: {alert['hash']}"
        )

    def on_modified(self, event):
        if not event.is_directory:
            new_hash = self.calculate_sha256(event.src_path)
            self.log_event("MODIFIED", event.src_path, new_hash)

    def on_created(self, event):
        if not event.is_directory:
            new_hash = self.calculate_sha256(event.src_path)
            self.log_event("CREATED", event.src_path, new_hash)

    def on_deleted(self, event):
        if not event.is_directory:
            self.log_event("DELETED", event.src_path)


# --- THIS WAS THE MISSING LINK ---
def start_fim_engine(target_directory="./HIDS_TEST_FOLDER"):
    """Spins up the background FIM thread controlled by the FastAPI server."""
    if not os.path.exists(target_directory):
        os.makedirs(target_directory)

    event_handler = FIMTracker()
    observer = Observer()
    observer.schedule(event_handler, path=target_directory, recursive=True)
    observer.start()
    print(f"[🛡️] HIDS FIM Engine locked onto: {target_directory}")
