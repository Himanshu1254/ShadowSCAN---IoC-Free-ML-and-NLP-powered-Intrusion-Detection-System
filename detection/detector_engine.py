from detection.ml_detector import MLDetector


class DetectorEngine:
    def __init__(self):
        self.detector = MLDetector()
        self.training_done = False

    def get_severity(self, score):
        if score < -0.25:
            return "HIGH"
        elif score < -0.15:
            return "MEDIUM"
        else:
            return "LOW"

    def get_confidence(self, score):
        confidence = min(abs(score) * 100, 100)
        return f"{confidence:.0f}%"

    def process_sessions(self, sessions):
        alerts = []

        # -----------------------
        # TRAINING PHASE
        # -----------------------
        if not self.training_done:
            for s in sessions:
                self.detector.add_to_training(s)

            if self.detector.train():
                print("[ML] Model trained successfully")
                self.training_done = True

            return []

        # -----------------------
        # DETECTION PHASE
        # -----------------------
        for s in sessions:
            result = self.detector.predict(s)

            if result["anomaly"]:
                score = result["score"]

                alert = {
                    "title": "Anomalous Network Activity",
                    "src_ip": s.get("src_ip"),
                    "dst_ip": s.get("dst_ip"),
                    "protocol": s.get("protocol"),
                    "packet_count": s.get("packet_count"),
                    "byte_count": s.get("byte_count"),

                    # 🔥 NEW FIELDS (UI WAS WAITING FOR THESE)
                    "severity": self.get_severity(score),
                    "confidence": self.get_confidence(score),
                    "reason": result.get("reason", "Anomalous pattern detected"),
                    "score": score,
                }

                alerts.append(alert)

        return alerts