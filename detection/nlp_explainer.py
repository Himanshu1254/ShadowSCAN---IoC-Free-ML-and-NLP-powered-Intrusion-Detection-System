import random

class NLPExplainer:
    def explain(self, alert):
        attack = alert.get("attack_type", "Unknown")
        src = alert.get("src_ip", "Unknown")
        dst = alert.get("dst_ip", "Unknown")

        if attack == "Suspicious Activity":
            options = [
                f"{src} is making an unusual number of connections to {dst}.",
                f"Abnormal connection frequency detected from {src} targeting {dst}.",
                f"{src} shows behavior deviating from normal traffic patterns toward {dst}.",
            ]
            return random.choice(options)

        if attack == "Unusual Access":
            options = [
                f"{src} is communicating with {dst} using a non-standard port.",
                f"Traffic from {src} to {dst} is using uncommon service ports.",
                f"{src} is attempting unusual communication patterns with {dst}.",
            ]
            return random.choice(options)

        if attack == "Port Scan":
            return f"{src} is scanning multiple ports on {dst}, indicating reconnaissance."

        if attack == "Traffic Flood":
            return f"High traffic volume from {src} to {dst} suggests a possible flood attack."

        if attack == "Burst Traffic":
            return f"Sudden spike in packets from {src} to {dst} detected."

        return f"Anomalous behavior observed between {src} and {dst}."