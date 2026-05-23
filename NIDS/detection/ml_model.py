import os
import joblib
import numpy as np
import pandas as pd
from loguru import logger

# --- ENTERPRISE ROOT PATH RESOLUTION ---
# Since Uvicorn boots from the root, we point directly to the master models folder.
RF_MODEL_PATH = "models/random_forest_model.pkl"
XGB_MODEL_PATH = "models/xgboost_model.pkl"
LABEL_ENCODER_PATH = "models/xgb_label_encoder.pkl"

# ---------------------------------------------------------
# FIXED: Updated to EXACTLY match the 11 features the models
# were trained on, resolving the feature_names mismatch error.
# ---------------------------------------------------------
FEATURE_COLUMNS = [
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


class MLDetector:
    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.label_encoder = None
        self.is_ready = False

        self.load_models()

    def load_models(self):
        try:
            if os.path.exists(RF_MODEL_PATH):
                self.rf_model = joblib.load(RF_MODEL_PATH)
                logger.success("[MODEL] RandomForest loaded")
                self.is_ready = True
            else:
                logger.error(
                    f"❌ [CRITICAL] RandomForest model completely missing from {RF_MODEL_PATH}"
                )

        except Exception as e:
            logger.error(f"[RF LOAD ERROR] {e}")

        try:
            if os.path.exists(XGB_MODEL_PATH):
                self.xgb_model = joblib.load(XGB_MODEL_PATH)
                logger.success("[MODEL] XGBoost loaded")
            else:
                logger.error(
                    f"❌ [CRITICAL] XGBoost model completely missing from {XGB_MODEL_PATH}"
                )

        except Exception as e:
            logger.error(f"[XGB LOAD ERROR] {e}")

        try:
            if os.path.exists(LABEL_ENCODER_PATH):
                self.label_encoder = joblib.load(LABEL_ENCODER_PATH)
                logger.success("[MODEL] LabelEncoder loaded")
            else:
                logger.error(
                    f"❌ [CRITICAL] LabelEncoder completely missing from {LABEL_ENCODER_PATH}"
                )

        except Exception as e:
            logger.error(f"[ENCODER LOAD ERROR] {e}")

    def prepare_features(self, flow_data: dict):
        try:
            row = {}

            for feature in FEATURE_COLUMNS:
                value = flow_data.get(feature, 0)

                if value is None:
                    value = 0

                try:
                    row[feature] = float(value)
                except Exception:
                    row[feature] = 0.0

            df = pd.DataFrame([row])

            # Ensure columns are exactly in the order the model expects
            df = df[FEATURE_COLUMNS]
            return df

        except Exception as e:
            logger.error(f"[FEATURE ERROR] {e}")
            return None

    def predict_random_forest(self, flow_data: dict):
        try:
            if self.rf_model is None:
                return None

            features = self.prepare_features(flow_data)

            if features is None:
                return None

            raw_prediction = self.rf_model.predict(features)[0]

            # FIXED: Safely process prediction to prevent `int('Benign')` crash
            prediction_str = str(raw_prediction)
            if prediction_str.isdigit() or (
                prediction_str.startswith("-") and prediction_str[1:].isdigit()
            ):
                prediction = int(raw_prediction)
                if self.label_encoder is not None:
                    try:
                        prediction = self.label_encoder.inverse_transform([prediction])[
                            0
                        ]
                    except Exception:
                        pass
            else:
                prediction = prediction_str

            return {
                "model": "RandomForest",
                "prediction": str(prediction),
                "is_attack": str(prediction).lower() != "benign",
            }

        except Exception as e:
            logger.error(f"[RF ERROR] {e}")
            return None

    def predict_xgboost(self, flow_data: dict):
        try:
            if self.xgb_model is None:
                return None

            features = self.prepare_features(flow_data)

            if features is None:
                return None

            raw_prediction = self.xgb_model.predict(features)[0]

            # FIXED: Safely process prediction
            prediction_str = str(raw_prediction)
            if prediction_str.isdigit() or (
                prediction_str.startswith("-") and prediction_str[1:].isdigit()
            ):
                prediction = int(raw_prediction)
                if self.label_encoder is not None:
                    try:
                        prediction = self.label_encoder.inverse_transform([prediction])[
                            0
                        ]
                    except Exception:
                        pass
            else:
                prediction = prediction_str

            return {
                "model": "XGBoost",
                "prediction": str(prediction),
                "is_attack": str(prediction).lower() != "benign",
            }

        except Exception as e:
            logger.error(f"[XGB ERROR] {e}")
            return None

    def detect(self, flow_data: dict):
        try:
            rf_result = self.predict_random_forest(flow_data)
            xgb_result = self.predict_xgboost(flow_data)

            final_prediction = "Benign"
            attack_votes = []

            if rf_result and rf_result["is_attack"]:
                attack_votes.append(rf_result["prediction"])

            if xgb_result and xgb_result["is_attack"]:
                attack_votes.append(xgb_result["prediction"])

            if len(attack_votes) > 0:
                final_prediction = max(
                    set(attack_votes),
                    key=attack_votes.count,
                )

            return {
                "attack_detected": final_prediction.lower() != "benign",
                "attack_type": final_prediction,
                "rf_result": rf_result,
                "xgb_result": xgb_result,
            }

        except Exception as e:
            logger.error(f"[DETECTION ERROR] {e}")

            return {
                "attack_detected": False,
                "attack_type": "Benign",
                "rf_result": None,
                "xgb_result": None,
            }

    def predict(self, flow_data: dict) -> dict:
        """
        FIXED: Returns the dictionary natively instead of 1 or 0.
        This prevents the `[DETECTION ERROR] 'int' object has no attribute 'get'`
        crash inside the HybridDecisionEngine.
        """
        return self.detect(flow_data)

    def load(self) -> bool:
        """Fallback bridge for DetectorEngine's self.trained = self.ml.load()"""
        return self.is_ready


# Singleton instantiation
ml_detector = MLDetector()

# Architectural Bridges
MLModel = MLDetector
