import psutil


def get_disk_telemetry():
    """Retrieves total aggregate disk usage and individual partition metrics."""
    disk_data = {"total_aggregate": {}, "individual_drives": []}

    total_size = 0
    total_used = 0
    total_free = 0

    # Iterate through all mounted physical drives
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)

            # Aggregate totals
            total_size += usage.total
            total_used += usage.used
            total_free += usage.free

            # Record individual drive metrics
            disk_data["individual_drives"].append(
                {
                    "device": partition.device,  # e.g., "C:\"
                    "mountpoint": partition.mountpoint,
                    "file_system": partition.fstype,  # e.g., "NTFS"
                    "size_gb": round(usage.total / (1024**3), 2),
                    "used_gb": round(usage.used / (1024**3), 2),
                    "free_gb": round(usage.free / (1024**3), 2),
                    "percent_used": usage.percent,
                }
            )
        except PermissionError:
            continue  # Skip drives that are locked by the OS

    # Calculate global percentages
    if total_size > 0:
        disk_data["total_aggregate"] = {
            "total_size_gb": round(total_size / (1024**3), 2),
            "total_used_gb": round(total_used / (1024**3), 2),
            "total_free_gb": round(total_free / (1024**3), 2),
            "global_percent_used": round((total_used / total_size) * 100, 2),
        }

    return disk_data
