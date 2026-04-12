from detection.ml_model import MLModel


class DetectorEngine:
    def __init__(self):
        self.ml = MLModel()
        self.trained = self.ml.load()

    def process(self, sessions):
        alerts = []

        # Train if not trained
        if not self.trained:
            print("[ML] Training model...")
            self.ml.train(sessions)
            self.trained = True
            return []

        for s in sessions:
            ml_result = self.ml.predict(s)

            if ml_result["anomaly"]:
                alerts.append({
                    "src_ip": s.get("src_ip"),
                    "dst_ip": s.get("dst_ip"),
                    "protocol": s.get("protocol"),
                    "severity": "HIGH",
                    "confidence": "90%",
                    "attack_type": "ML Anomaly",
                    "reason": "Detected abnormal traffic pattern"
                })

        return alerts