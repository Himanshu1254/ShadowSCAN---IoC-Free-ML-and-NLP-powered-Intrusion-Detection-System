from detection.ml_model import MLModel


class DetectorEngine:
    def __init__(self):
        self.ml = MLModel()
        self.trained = self.ml.load()

    # -------------------------------
    # RULE-BASED CLASSIFICATION
    # -------------------------------
    def classify_attack(self, session):
        flow_count = session.get("flow_count", 0)
        packet_count = session.get("packet_count", 0)
        dst_port = session.get("dst_port", 0)
        duration = session.get("duration", 0)

        # 🔥 Strong signals
        if flow_count > 30:
            return "Port Scan", "Multiple connection attempts to ports"

        if packet_count > 800:
            return "Traffic Flood", "Extremely high packet volume"

        if duration < 0.5 and packet_count > 200:
            return "Burst Traffic", "High packets in very short time"

        # 🔸 Medium signals
        if flow_count > 10:
            return "Suspicious Activity", "Unusual number of flows"

        # 🔹 Weak signal
        if dst_port not in [80, 443, 53]:
            return "Unusual Access", "Access to uncommon port"

        return "Normal", "No anomaly detected"

    # -------------------------------
    # SEVERITY MAPPING
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
    # DYNAMIC CONFIDENCE
    # -------------------------------
    def calculate_confidence(self, session, is_anomaly):
        packet_count = session.get("packet_count", 0)
        flow_count = session.get("flow_count", 0)
        duration = session.get("duration", 1)

        score = 30  # base confidence

        # Packet contribution
        score += min(packet_count / 20, 30)

        # Flow contribution
        score += min(flow_count * 2, 20)

        # Burst behavior
        if duration < 0.5 and packet_count > 100:
            score += 10

        # ML boost
        if is_anomaly:
            score += 10

        score = max(20, min(int(score), 95))

        return f"{score}%"

    # -------------------------------
    # MAIN PROCESS
    # -------------------------------
    def process(self, sessions):
        alerts = []

        # Train model once
        if not self.trained:
            print("[ML] Training model...")
            self.ml.train(sessions)
            self.trained = True
            return []

        for s in sessions:
            ml_result = self.ml.predict(s)

            attack_type, reason = self.classify_attack(s)

            # 🔥 HYBRID LOGIC
            if ml_result["anomaly"] or attack_type != "Normal":

                confidence = self.calculate_confidence(
                    s,
                    ml_result["anomaly"]
                )

                alerts.append({
                    "src_ip": s.get("src_ip"),
                    "dst_ip": s.get("dst_ip"),
                    "protocol": s.get("protocol"),

                    "severity": self.get_severity(attack_type),
                    "confidence": confidence,

                    "attack_type": (
                        "ML Anomaly"
                        if ml_result["anomaly"] and attack_type == "Normal"
                        else attack_type
                    ),

                    "reason": reason,
                })

        return alerts