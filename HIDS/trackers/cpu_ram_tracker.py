import psutil


def get_cpu_ram_telemetry():
    """Retrieves live CPU and RAM resource metrics."""

    # 1. Gather CPU Data
    cpu_total = psutil.cpu_percent(interval=0.1)
    cpu_cores = psutil.cpu_percent(
        interval=0.1, percpu=True
    )  # Gets usage for each individual core

    try:
        cpu_freq = psutil.cpu_freq()
        freq_current = round(cpu_freq.current, 2) if cpu_freq else "N/A"
    except Exception:
        freq_current = "N/A"  # Fallback if Windows restricts frequency reading

    # 2. Gather RAM Data
    virtual_mem = psutil.virtual_memory()

    # 3. Package it neatly into a dictionary
    telemetry = {
        "cpu": {
            "total_usage_percent": cpu_total,
            "core_usage_percents": cpu_cores,
            "current_frequency_mhz": freq_current,
            "logical_cores": psutil.cpu_count(logical=True),
            "physical_cores": psutil.cpu_count(logical=False),
        },
        "ram": {
            "total_gb": round(virtual_mem.total / (1024**3), 2),
            "used_gb": round(virtual_mem.used / (1024**3), 2),
            "free_gb": round(virtual_mem.available / (1024**3), 2),
            "percent_used": virtual_mem.percent,
        },
    }

    return telemetry
