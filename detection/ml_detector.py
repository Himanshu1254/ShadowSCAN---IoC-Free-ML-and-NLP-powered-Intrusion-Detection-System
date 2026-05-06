import os
import joblib
import numpy as np

from sklearn.ensemble import IsolationForest


MODEL_PATH = "models/anomaly_model.pkl"


class MLDetector:
    def __init__(self):

        self.model = IsolationForest(
            n_estimators=150,
            contamination=0.15,
            random_state=42
        )

        self.trained = False
        self.training_buffer = []

        # 🔥 LOAD EXISTING MODEL IF AVAILABLE
        self.load_model()

    # --------------------------------------------------

    def extract_features(self, session):

        return [
            session.get("packet_count", 0),
            session.get("byte_count", 0),
            session.get("duration", 0),
            session.get("flow_count", 0),
            session.get("src_port", 0),
            session.get("dst_port", 0),
        ]

    # --------------------------------------------------

    def add_to_training(self, session):

        self.training_buffer.append(
            self.extract_features(session)
        )

    # --------------------------------------------------

    def train(self):

        if len(self.training_buffer) < 25:
            print("[ML] Waiting for enough training samples...")
            return False

        print("[ML] Training anomaly detection model...")

        X = np.array(self.training_buffer)

        self.model.fit(X)

        self.trained = True

        self.save_model()

        print("[ML] Model trained and saved successfully")

        return True

    # --------------------------------------------------

    def predict(self, session):

        if not self.trained:
            return {
                "anomaly": False,
                "score": 0.0,
                "reason": "Model not trained"
            }

        features = np.array([
            self.extract_features(session)
        ])

        score = self.model.decision_function(features)[0]

        prediction = self.model.predict(features)[0]

        return {
            "anomaly": prediction == -1,
            "score": float(score),
            "reason": self.generate_reason(session)
        }

    # --------------------------------------------------

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

    # --------------------------------------------------

    def save_model(self):

        os.makedirs("models", exist_ok=True)

        joblib.dump(self.model, MODEL_PATH)

    # --------------------------------------------------

    def load_model(self):

        if os.path.exists(MODEL_PATH):

            try:
                self.model = joblib.load(MODEL_PATH)

                self.trained = True

                print("[ML] Existing model loaded successfully")

            except Exception as e:

                print("[ML] Failed to load saved model")

                print(e)

        else:

            print("[ML] No saved model found")