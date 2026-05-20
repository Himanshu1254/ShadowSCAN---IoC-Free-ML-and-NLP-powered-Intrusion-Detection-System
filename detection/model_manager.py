import joblib
import numpy as np
import pandas as pd

from detection.feature_engineering import FeatureEngineer


class ModelManager:

    def __init__(self):

        self.feature_engineer = FeatureEngineer()

        self.rf_model = None
        self.xgb_model = None

        # --------------------------------------------------

        try:

            self.rf_model = joblib.load("models/random_forest_model.pkl")

            print("[MODEL] RandomForest loaded")

        except Exception as e:

            print("[MODEL] RF load failed")

            print(e)

        # --------------------------------------------------

        try:

            self.xgb_model = joblib.load("models/xgboost_model.pkl")

            print("[MODEL] XGBoost loaded")

        except Exception as e:

            print("[MODEL] XGB load failed")

            print(e)

    # --------------------------------------------------
    # FEATURE EXTRACTION
    # --------------------------------------------------

    def extract_features(self, session):

        raw_features = self.feature_engineer.extract(session)

        cleaned = []

        for value in raw_features:

            try:

                cleaned.append(float(value))

            except:

                cleaned.append(0.0)

        columns = [
            "packet_count",
            "byte_count",
            "duration",
            "flow_count",
            "dst_port",
            "bytes_per_second",
            "packets_per_second",
            "avg_packet_size",
            "flow_density",
            "burst_score",
            "port_is_common",
        ]

        df = pd.DataFrame([cleaned], columns=columns)

        # FORCE NUMERIC TYPES
        for col in df.columns:

            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        return df

    # --------------------------------------------------
    # RANDOM FOREST
    # --------------------------------------------------

    def predict_rf(self, session):

        try:

            if self.rf_model is None:

                return None

            X = self.extract_features(session)

            # FIXED: Safely extract string prediction instead of casting to int
            raw_pred = self.rf_model.predict(X)[0]
            pred = str(raw_pred)
            is_attack = pred.lower() != "benign" and pred != "0"

            prob = self.rf_model.predict_proba(X)

            confidence = float(np.max(prob))

            return {
                "prediction": pred,
                "is_attack": is_attack,
                "confidence": confidence,
                "model": "RandomForest",
            }

        except Exception as e:

            print("[RF ERROR]")

            print(e)

            return None

    # --------------------------------------------------
    # XGBOOST
    # --------------------------------------------------

    def predict_xgb(self, session):

        try:

            if self.xgb_model is None:

                return None

            X = self.extract_features(session)

            # FIXED: Safely extract string prediction instead of casting to int
            raw_pred = self.xgb_model.predict(X)[0]
            pred = str(raw_pred)
            is_attack = pred.lower() != "benign" and pred != "0"

            prob = self.xgb_model.predict_proba(X)

            confidence = float(np.max(prob))

            return {
                "prediction": pred,
                "is_attack": is_attack,
                "confidence": confidence,
                "model": "XGBoost",
            }

        except Exception as e:

            print("[XGB ERROR]")

            print(e)

            return None
