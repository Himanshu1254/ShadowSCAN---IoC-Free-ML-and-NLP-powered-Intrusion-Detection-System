import GPUtil


def get_gpu_telemetry():
    """Retrieves live metrics for dedicated NVIDIA GPUs."""
    gpu_data = []

    try:
        gpus = GPUtil.getGPUs()
        for gpu in gpus:
            gpu_data.append(
                {
                    "id": gpu.id,
                    "name": gpu.name,
                    "load_percent": round(gpu.load * 100, 2),
                    "memory_total_mb": gpu.memoryTotal,
                    "memory_used_mb": gpu.memoryUsed,
                    "memory_free_mb": gpu.memoryFree,
                    "temperature_c": gpu.temperature,
                }
            )
    except Exception as e:
        return {
            "error": "GPU tracking unavailable or non-NVIDIA card detected.",
            "details": str(e),
        }

    return gpu_data
