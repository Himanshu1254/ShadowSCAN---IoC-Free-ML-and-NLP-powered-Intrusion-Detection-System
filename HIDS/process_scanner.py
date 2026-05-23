import psutil
import time
import os
import json
from datetime import datetime


def log_audit_event(event_type, details):
    """The permanent historical vault."""
    os.makedirs("Data", exist_ok=True)
    log_file = "Data/hids_audit_log.json"

    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": event_type,
        "details": details,
    }

    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r") as f:
                logs = json.load(f)
        except Exception:
            pass

    logs.append(entry)

    with open(log_file, "w") as f:
        json.dump(logs[-500:], f, indent=4)


def get_suspicious_processes():
    process_list = []
    cpu_count = psutil.cpu_count(logical=True)
    whitelist = ["System Idle Process", "System", "Registry", "smss.exe"]

    total_cpu = psutil.cpu_percent(interval=0.1)
    total_ram = psutil.virtual_memory().percent

    # Notice we added 'username' to the psutil request
    for proc in psutil.process_iter(
        ["pid", "name", "exe", "cpu_percent", "memory_percent", "username"]
    ):
        try:
            info = proc.info
            name = info.get("name", "") or "UNKNOWN"
            exe_path = info.get("exe", "") or "[KERNEL RESTRICTED]"
            user = info.get("username", "") or "UNKNOWN"

            raw_cpu = info.get("cpu_percent", 0.0)
            cpu = (raw_cpu / cpu_count) if (raw_cpu and cpu_count) else 0.0
            mem = info.get("memory_percent", 0.0) or 0.0

            if name in whitelist or info["pid"] == 0:
                continue

            if name == "UNKNOWN" and cpu < 0.1 and mem < 0.1:
                continue

            # Privilege Logic: Identifies core Windows accounts or elevated states
            is_admin = False
            if user and ("SYSTEM" in user.upper() or "ADMINISTRATOR" in user.upper()):
                is_admin = True

            # Dynamic Heuristics
            status = "NORMAL"
            if cpu > 40.0:
                status = "FLAGGED - High CPU"
            elif name == "UNKNOWN":
                status = "FLAGGED - Ghost Thread"

            proc_data = {
                "pid": info["pid"],
                "name": name,
                "path": exe_path,
                "user": user.split("\\")[
                    -1
                ],  # Cleans up the formatting (e.g., DESKTOP\Himanshu -> Himanshu)
                "is_admin": is_admin,
                "cpu_usage": round(cpu, 2),
                "mem_usage": round(mem, 2),
                "status": status,
            }
            process_list.append(proc_data)

            # Still logs highly dangerous spikes to the JSON vault
            if cpu > 85.0 or name == "UNKNOWN":
                log_audit_event("ANOMALOUS_PROCESS", proc_data)

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Sorts everything by highest resource usage and returns the Top 25 processes
    sorted_processes = sorted(
        process_list, key=lambda x: x["cpu_usage"] + x["mem_usage"], reverse=True
    )[:25]

    return {
        "system_stats": {"total_cpu": total_cpu, "total_ram": total_ram},
        "processes": sorted_processes,
    }
