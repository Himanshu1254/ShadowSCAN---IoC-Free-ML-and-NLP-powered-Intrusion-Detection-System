import os
import joblib
import numpy as np

from sklearn.ensemble import IsolationForest
from config.config_loader import load_detection_config

class MLModel:

    def __init__(self):

        self.config = load_detection_config()

        self.ml_config = self.config.get(
            "ml",
            {}
        )

        self.model = None

        self.model_path = "models/anomaly_model.pkl"

    # --------------------------------------------------

    def train(self, sessions):

        print("[ML] Training anomaly model...")

        X = []

        for s in sessions:

            X.append([
                s.get("packet_count", 0),
                s.get("flow_count", 0),
                s.get("dst_port", 0),
                s.get("duration", 0)
            ])

        X = np.array(X)

        self.model = IsolationForest(
            contamination=0.1,
            random_state=42
        )

        self.model.fit(X)

        os.makedirs(
            "models",
            exist_ok=True
        )

        joblib.dump(
            self.model,
            self.model_path
        )

        print("[ML] Model trained and saved successfully")

    # --------------------------------------------------

    def load(self):

        if not os.path.exists(self.model_path):

            print("[ML] No saved model found")

            return False

        try:

            self.model = joblib.load(
                self.model_path
            )

            print("[ML] Existing model loaded successfully")

            return True

        except Exception as e:

            print("[ML] Failed to load model")

            print(e)

            return False

    # --------------------------------------------------

    def predict(self, session):

        if self.model is None:

            return {
                "anomaly": False
            }

        try:

            X = np.array([[
                session.get("packet_count", 0),
                session.get("flow_count", 0),
                session.get("dst_port", 0),
                session.get("duration", 0)
            ]])

            pred = self.model.predict(X)

            return {
                "anomaly": pred[0] == -1
            }

        except Exception as e:

            print("[ML] Prediction error")

            print(e)

            return {
                "anomaly": False
            }