import joblib
import numpy as np
from sklearn.ensemble import IsolationForest


class MLModel:
    def __init__(self):
        self.model = None
        self.model_path = "models/anomaly_model.pkl"

    def train(self, sessions):
        X = []

        for s in sessions:
            X.append([
                s.get("packet_count", 0),
                s.get("flow_count", 0),
                s.get("dst_port", 0),
                s.get("duration", 0)
            ])

        X = np.array(X)

        self.model = IsolationForest(contamination=0.1)
        self.model.fit(X)

        joblib.dump(self.model, self.model_path)

    def load(self):
        try:
            self.model = joblib.load(self.model_path)
            return True
        except:
            return False

    def predict(self, session):
        if self.model is None:
            return {"anomaly": False}

        X = np.array([[
            session.get("packet_count", 0),
            session.get("flow_count", 0),
            session.get("dst_port", 0),
            session.get("duration", 0)
        ]])

        pred = self.model.predict(X)

        return {"anomaly": pred[0] == -1}