import psutil


def get_active_services():
    """Polls the Windows Service Control Manager for live background services."""
    service_list = []

    # psutil has a built-in wrapper for Windows Services
    for svc in psutil.win_service_iter():
        try:
            info = svc.as_dict()

            # We only want to track services that are actively running
            if info.get("status") == "running":
                service_list.append(
                    {
                        "service_name": info.get("name", "UNKNOWN"),
                        "display_name": info.get("display_name", "UNKNOWN"),
                        "status": info.get("status", "UNKNOWN"),
                        "executable_path": info.get(
                            "binpath", "[PATH RESTRICTED BY KERNEL]"
                        ),
                        "start_type": info.get("start_type", "N/A"),
                    }
                )
        except psutil.NoSuchProcess:
            continue
        except psutil.AccessDenied:
            continue
        except FileNotFoundError:
            # FIX: Bypasses ghost services with missing registry configurations
            continue
        except Exception:
            # FIX: Catch-all for any other corrupted Windows service files
            continue

    # Sort alphabetically by display name for easier UI rendering
    return sorted(service_list, key=lambda x: x.get("display_name", ""))
