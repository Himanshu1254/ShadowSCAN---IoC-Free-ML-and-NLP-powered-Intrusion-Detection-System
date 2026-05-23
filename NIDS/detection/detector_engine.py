from NIDS.detection.ml_model import MLModel
from Core.config.config_loader import load_detection_config
from Core.notifications.windows_notifier import WindowsNotifier
from Core.shadow_logging.geoip import GeoLocator

# --- THE NEW LLM EXPLAINER ---
from Core.nlp.explainability import ThreatExplainer

# -----------------------------

from NIDS.detection.model_manager import ModelManager
from NIDS.detection.decision_engine import HybridDecisionEngine


class DetectorEngine:

    def __init__(self):

        self.config = load_detection_config()
        self.notifier = WindowsNotifier()
        self.thresholds = self.config.get("thresholds", {})
        self.ml = MLModel()
        self.model_manager = ModelManager()

        # Initialize Llama 3 AI Analyst
        self.explainer = ThreatExplainer(model_name="llama3")

        self.decision_engine = HybridDecisionEngine()
        self.geo = GeoLocator()

        # Safe architectural bridge check for load capability
        if hasattr(self.ml, "load"):
            self.trained = self.ml.load()
        else:
            self.trained = getattr(self.ml, "is_ready", True)

    # --------------------------------------------------
    # RULE ENGINE
    # --------------------------------------------------

    def classify_attack(self, session):

        flow_count = session.get("flow_count", 0)
        packet_count = session.get("packet_count", 0)
        dst_port = session.get("dst_port", 0)
        duration = session.get("duration", 1)

        if flow_count > 25:
            return ("Port Scan", "Multiple rapid connection attempts")

        if packet_count > 700:
            return ("Traffic Flood", "Very high packet volume detected")

        if duration < 0.5 and packet_count > 150:
            return ("Burst Traffic", "Sudden spike in packets")

        if flow_count > 10:
            return ("Suspicious Activity", "Unusual number of flows")

        if dst_port not in [80, 443, 53] and packet_count > 20:
            return ("Unusual Access", "Access to uncommon port")

        return ("Normal", "No anomaly detected")

    # --------------------------------------------------
    # SEVERITY
    # --------------------------------------------------

    def get_severity(self, attack_type):
        if not attack_type or attack_type == "Normal":
            return "LOW"

        # Explicit mediums
        if attack_type in ["Burst Traffic", "Suspicious Activity", "Unknown Anomaly"]:
            return "MEDIUM"

        # Dynamically map all verified multiclass attack categories as HIGH severity
        return "HIGH"

    # --------------------------------------------------
    # MAIN PROCESS
    # --------------------------------------------------

    def process(self, sessions):

        alerts = []

        # --------------------------------------------------

        if not self.trained:

            print("[ML] Training model...")
            if hasattr(self.ml, "train"):
                self.ml.train(sessions)

            self.trained = True
            return []

        # --------------------------------------------------

        for s in sessions:

            try:

                # --------------------------
                # IsolationForest / Base ML Engine
                # --------------------------
                ml_result = self.ml.predict(s)

                # --------------------------
                # Supervised Models
                # --------------------------
                rf_result = self.model_manager.predict_rf(s)
                xgb_result = self.model_manager.predict_xgb(s)

                # --------------------------
                # Heuristics
                # --------------------------
                attack_type, reason = self.classify_attack(s)

                # --------------------------
                # Hybrid Decision
                # --------------------------
                decision = self.decision_engine.decide(
                    heuristic_attack=attack_type,
                    heuristic_reason=reason,
                    anomaly_result=ml_result,
                    rf_result=rf_result,
                    xgb_result=xgb_result,
                )

                # --------------------------------------------------
                if decision["attack"] == "Normal":
                    continue

                # --------------------------------------------------
                # EXPLAINABILITY (LLAMA 3 AI PIPELINE)
                # --------------------------------------------------

                # We dynamically pass the flow features and the engine's decision to the LLM
                ai_reasoning = self.explainer.generate_reasoning(
                    features=s, prediction=decision["attack"]
                )

                # --------------------------------------------------
                # SAFE CONFIDENCE
                # --------------------------------------------------
                raw_confidence = decision.get("confidence", 0.0)

                if isinstance(raw_confidence, dict):
                    raw_confidence = 0.0
                if isinstance(raw_confidence, str):
                    raw_confidence = raw_confidence.replace("%", "")
                    raw_confidence = float(raw_confidence) / 100

                confidence = int(float(raw_confidence) * 100)

                # --------------------------------------------------
                country = self.geo.get_country(s.get("src_ip", ""))

                # --------------------------------------------------

                alert = {
                    "src_ip": s.get("src_ip"),
                    "dst_ip": s.get("dst_ip"),
                    "protocol": s.get("protocol"),
                    "country": country,
                    "severity": self.get_severity(decision["attack"]),
                    "confidence": f"{confidence}%",
                    "attack_type": decision["attack"],
                    "detected_by": decision["source"],
                    "reason": ai_reasoning,  # Linked directly to Llama 3 output
                }

                # --------------------------------------------------
                alerts.append(alert)

                # --------------------------------------------------
                # WINDOWS NOTIFICATIONS
                # --------------------------------------------------
                if alert["severity"] in ["HIGH", "MEDIUM"]:
                    self.notifier.send_alert(alert)

            except Exception as e:
                print("[DETECTION ERROR]")
                print(e)

        # --------------------------------------------------
        return alerts
