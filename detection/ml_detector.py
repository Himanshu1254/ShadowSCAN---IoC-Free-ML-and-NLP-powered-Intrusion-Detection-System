import numpy as np
from sklearn.ensemble import IsolationForest


class MLDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=150,
            contamination=0.15,  # slightly aggressive
            random_state=42
        )
        self.trained = False
        self.training_buffer = []

    def extract_features(self, session):
        return [
            session.get("packet_count", 0),
            session.get("byte_count", 0),
            session.get("duration", 0),
            session.get("flow_count", 0),
            session.get("src_port", 0),
            session.get("dst_port", 0),
        ]

    def add_to_training(self, session):
        self.training_buffer.append(self.extract_features(session))

    def train(self):
        if len(self.training_buffer) < 25:
            return False

        X = np.array(self.training_buffer)
        self.model.fit(X)
        self.trained = True
        return True

    def predict(self, session):
        if not self.trained:
            return {"anomaly": False, "score": 0.0, "reason": "Training"}

        features = np.array([self.extract_features(session)])
        score = self.model.decision_function(features)[0]
        prediction = self.model.predict(features)[0]

        return {
            "anomaly": prediction == -1,
            "score": float(score),
            "reason": self.generate_reason(session)
        }

    def generate_reason(self, session):
        reasons = []

        if session.get("packet_count", 0) > 300:
            reasons.append("High packet volume")

        if session.get("flow_count", 0) > 10:
            reasons.append("Too many flows")

        if session.get("dst_port", 0) not in [80, 443, 53]:
            reasons.append("Unusual destination port")

        if session.get("duration", 0) < 0.5:
            reasons.append("Burst traffic")

        return ", ".join(reasons) if reasons else "Anomalous pattern"