import json


def load_detection_config():

    try:

        with open(
            "Core/config/detection_config.json",
            "r"
        ) as f:

            return json.load(f)

    except Exception as e:

        print("[CONFIG ERROR]")
        print(e)

        return {}