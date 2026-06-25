import json


def load_detection_config():

    try:

        with open(
            "Core/config/detection_config.json",
            "r"
        ) as f:

            return json.load(f)

    except Exception as e:

        from Core.shadow_logging.logger import shadow_logger
        shadow_logger.log_error(f"[CONFIG ERROR] {e}")

        return {}