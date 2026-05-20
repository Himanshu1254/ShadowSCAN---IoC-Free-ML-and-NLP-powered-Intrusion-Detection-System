class HybridDecisionEngine:

    def decide(
        self, heuristic_attack, heuristic_reason, anomaly_result, rf_result, xgb_result
    ):

        # --------------------------------------------------
        # XGBOOST
        # --------------------------------------------------

        if (
            xgb_result is not None
            and xgb_result.get("is_attack", False)
            and xgb_result.get("confidence", 0.0) > 0.90
        ):

            return {
                "attack": xgb_result.get("prediction", "ML Attack Detected"),
                "source": "XGBoost",
                "confidence": xgb_result["confidence"],
            }

        # --------------------------------------------------
        # RANDOM FOREST
        # --------------------------------------------------

        if (
            rf_result is not None
            and rf_result.get("is_attack", False)
            and rf_result.get("confidence", 0.0) > 0.90
        ):

            return {
                "attack": rf_result.get("prediction", "ML Attack Detected"),
                "source": "RandomForest",
                "confidence": rf_result["confidence"],
            }

        # --------------------------------------------------
        # HEURISTICS
        # --------------------------------------------------

        if heuristic_attack != "Normal":

            return {
                "attack": heuristic_attack,
                "source": "Heuristic Engine",
                "confidence": 0.80,
            }

        # --------------------------------------------------
        # ANOMALY / BASE ML
        # --------------------------------------------------

        # Handle the new structured format from ml_model.py
        if anomaly_result and isinstance(anomaly_result, dict):

            if anomaly_result.get("attack_detected"):

                return {
                    "attack": anomaly_result.get("attack_type", "Unknown Anomaly"),
                    "source": "Base ML Pipeline",
                    "confidence": 0.75,
                }

            # Legacy fallback for old dictionary structure
            if anomaly_result.get("anomaly"):
                return {
                    "attack": "Unknown Anomaly",
                    "source": "IsolationForest",
                    "confidence": 0.75,
                }

        # --------------------------------------------------
        # NORMAL
        # --------------------------------------------------

        return {"attack": "Normal", "source": "None", "confidence": 0.0}
