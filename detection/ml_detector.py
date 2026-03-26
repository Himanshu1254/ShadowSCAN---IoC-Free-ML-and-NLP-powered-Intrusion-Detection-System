import numpy as np
from sklearn.ensemble import IsolationForest


class MLDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.trained = False
        self.training_buffer = []

    def extract_features(self, session):
        """
        Convert session into numerical feature vector
        Modify keys if your session structure differs
        """

        return [
            session.get("packet_count", 0),
            session.get("byte_count", 0),
            session.get("duration", 0),
            session.get("src_port", 0),
            session.get("dst_port", 0),
            hash(session.get("protocol", "TCP")) % 10
        ]

    def add_to_training(self, session):
        features = self.extract_features(session)
        self.training_buffer.append(features)

    def train(self):
        if len(self.training_buffer) < 50:
            return False

        X = np.array(self.training_buffer)
        self.model.fit(X)
        self.trained = True
        return True

    def predict(self, session):
        if not self.trained:
            return {
                "anomaly": False,
                "score": 0.0,
                "reason": "Model not trained"
            }

        features = np.array([self.extract_features(session)])

        score = self.model.decision_function(features)[0]
        prediction = self.model.predict(features)[0]

        return {
            "anomaly": prediction == -1,
            "score": float(score),
            "reason": self.generate_reason(session, score)
        }

    def generate_reason(self, session, score):
        reasons = []

        if session.get("packet_count", 0) > 500:
            reasons.append("High packet count")

        if session.get("duration", 0) < 1:
            reasons.append("Very short burst traffic")

        if session.get("dst_port", 0) not in [80, 443, 53]:
            reasons.append("Unusual destination port")

        if not reasons:
            return "Anomalous pattern detected"

        return ", ".join(reasons)