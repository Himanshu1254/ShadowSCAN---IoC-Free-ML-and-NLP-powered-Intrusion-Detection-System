class HybridDecisionEngine:

    def decide(

        self,

        heuristic_attack,

        heuristic_reason,

        anomaly_result,

        rf_result,

        xgb_result

    ):

        # --------------------------------------------------
        # XGBOOST
        # --------------------------------------------------

        if (
            xgb_result is not None
            and xgb_result["prediction"] == 1
            and xgb_result["confidence"] > 0.90
        ):

            return {

                "attack":
                    "ML Attack Detected",

                "source":
                    "XGBoost",

                "confidence":
                    xgb_result["confidence"]
            }

        # --------------------------------------------------
        # RANDOM FOREST
        # --------------------------------------------------

        if (
            rf_result is not None
            and rf_result["prediction"] == 1
            and rf_result["confidence"] > 0.90
        ):

            return {

                "attack":
                    "ML Attack Detected",

                "source":
                    "RandomForest",

                "confidence":
                    rf_result["confidence"]
            }

        # --------------------------------------------------
        # HEURISTICS
        # --------------------------------------------------

        if heuristic_attack != "Normal":

            return {

                "attack":
                    heuristic_attack,

                "source":
                    "Heuristic Engine",

                "confidence":
                    0.80
            }

        # --------------------------------------------------
        # ANOMALY
        # --------------------------------------------------

        if anomaly_result.get("anomaly"):

            return {

                "attack":
                    "Unknown Anomaly",

                "source":
                    "IsolationForest",

                "confidence":
                    0.75
            }

        # --------------------------------------------------
        # NORMAL
        # --------------------------------------------------

        return {

            "attack":
                "Normal",

            "source":
                "None",

            "confidence":
                0.0
        }