import psutil


def get_suspicious_processes():
    """
    Scans the host OS for active processes, sorts by resource usage,
    and formats them for the ShadowSCAN dashboard.
    """
    process_list = []

    try:
        # Iterate over all active PIDs. We use dict() for faster attribute access.
        for proc in psutil.process_iter(
            ["pid", "name", "username", "cpu_percent", "memory_percent", "exe"]
        ):
            try:
                pinfo = proc.info

                # Skip idle/system hidden processes that don't use measurable resources
                # psutil sometimes returns None for cpu/memory if it can't read it
                cpu_usage = pinfo.get("cpu_percent") or 0.0
                mem_usage = pinfo.get("memory_percent") or 0.0

                if cpu_usage == 0.0 and mem_usage < 0.1:
                    continue

                # Determine if the process is running with Admin/System privileges
                user = pinfo.get("username") or "Unknown"
                is_admin = (
                    True
                    if "SYSTEM" in user.upper() or "ADMIN" in user.upper()
                    else False
                )

                # Determine a basic status flag based on CPU usage
                status = "HIGH CPU" if cpu_usage > 30.0 else "NORMAL"

                process_list.append(
                    {
                        "pid": pinfo["pid"],
                        "name": pinfo["name"] or "Unknown Payload",
                        "path": pinfo["exe"] or "Restricted Ring-0 Memory",
                        "user": user,
                        "is_admin": is_admin,
                        "cpu_usage": round(cpu_usage, 1),
                        "mem_usage": round(mem_usage, 1),
                        "status": status,
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                # Ignore processes that close while we are reading them, or that we don't have permission to read
                pass

        # Sort by CPU usage descending and grab the top 25
        process_list = sorted(process_list, key=lambda x: x["cpu_usage"], reverse=True)[
            :25
        ]

        # We also pass the system stats here so the frontend can update the charts simultaneously
        sys_cpu = psutil.cpu_percent(interval=0.1)
        sys_ram = psutil.virtual_memory().percent

        return {
            "processes": process_list,
            "system_stats": {
                "total_cpu": round(sys_cpu, 1),
                "total_ram": round(sys_ram, 1),
            },
        }

    except Exception as e:
        print(f"[HIDS ERROR] Process Scanner Failed: {e}")
        return {"processes": [], "system_stats": {"total_cpu": 0, "total_ram": 0}}
