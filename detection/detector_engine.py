from detection.ml_model import MLModel
from config.config_loader import load_detection_config

class DetectorEngine:
    def __init__(self):

        self.config = load_detection_config()

        self.thresholds = self.config.get(
            "thresholds",
            {}
        )

        self.ml = MLModel()

        self.trained = self.ml.load()

    # -------------------------------
    # RULE-BASED CLASSIFICATION (IMPROVED)
    # -------------------------------
    def classify_attack(self, session):
        flow_count = session.get("flow_count", 0)
        packet_count = session.get("packet_count", 0)
        dst_port = session.get("dst_port", 0)
        duration = session.get("duration", 1)

        # 🔥 STRONG SIGNALS (clear attacks)
        if flow_count > 25:
            return "Port Scan", "Multiple rapid connection attempts"

        if packet_count > 700:
            return "Traffic Flood", "Very high packet volume detected"

        if duration < 0.5 and packet_count > 150:
            return "Burst Traffic", "Sudden spike in packets"

        # 🔸 MEDIUM SIGNALS (suspicious behavior)
        if flow_count > 10:
            return "Suspicious Activity", "Unusual number of flows"

        # 🔹 WEAK SIGNAL (only fallback)
        if dst_port not in [80, 443, 53] and packet_count > 20:
            return "Unusual Access", "Access to uncommon port"

        return "Normal", "No anomaly detected"

    # -------------------------------
    # SEVERITY MAPPING (BALANCED)
    # -------------------------------
    def get_severity(self, attack_type):
        if attack_type in ["Port Scan", "Traffic Flood"]:
            return "HIGH"
        if attack_type in ["Burst Traffic", "Suspicious Activity"]:
            return "MEDIUM"
        if attack_type == "Unusual Access":
            return "LOW"
        return "LOW"

    # -------------------------------
    # DYNAMIC CONFIDENCE (UNCHANGED)
    # -------------------------------
    def calculate_confidence(self, session, is_anomaly):
        packet_count = session.get("packet_count", 0)
        flow_count = session.get("flow_count", 0)
        duration = session.get("duration", 1)

        score = 30

        score += min(packet_count / 20, 30)
        score += min(flow_count * 2, 20)

        if duration < 0.5 and packet_count > 100:
            score += 10

        if is_anomaly:
            score += 10

        score = max(20, min(int(score), 95))

        return f"{score}%"

    # -------------------------------
    # MAIN PROCESS (SLIGHTLY IMPROVED)
    # -------------------------------
    def process(self, sessions):
        alerts = []

        # 🔥 TRAIN ONCE
        if not self.trained:
            print("[ML] Training model...")
            self.ml.train(sessions)
            self.trained = True
            return []

        for s in sessions:
            ml_result = self.ml.predict(s)

            attack_type, reason = self.classify_attack(s)

            # 🔥 HYBRID TRIGGER (balanced)
            if ml_result["anomaly"] or attack_type != "Normal":

                confidence = self.calculate_confidence(
                    s,
                    ml_result["anomaly"]
                )

                # 🔥 FINAL ATTACK TYPE DECISION
                final_attack = (
                    "ML Anomaly"
                    if ml_result["anomaly"] and attack_type == "Normal"
                    else attack_type
                )

                alerts.append({
                    "src_ip": s.get("src_ip"),
                    "dst_ip": s.get("dst_ip"),
                    "protocol": s.get("protocol"),

                    "severity": self.get_severity(final_attack),
                    "confidence": confidence,

                    "attack_type": final_attack,
                    "reason": reason,
                })

        return alerts