import psutil


def get_cpu_ram_telemetry():
    """
    Hooks into the host OS to return real-time CPU and RAM utilization percentages.
    """
    try:
        # Get overall CPU usage (0.1-second interval for accuracy without blocking)
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # Get RAM usage
        ram = psutil.virtual_memory()
        ram_percent = ram.percent

        return {"total_cpu": round(cpu_percent, 1), "total_ram": round(ram_percent, 1)}
    except Exception as e:
        from Core.shadow_logging.logger import shadow_logger
        shadow_logger.log_error(f"[HIDS ERROR] CPU/RAM Tracker Failed: {e}")
        return {"total_cpu": 0, "total_ram": 0}
