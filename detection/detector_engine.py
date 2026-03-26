from detection.ml_detector import MLDetector
from detection.nlp_explainer import NLPExplainer


class DetectorEngine:
    def __init__(self):
        self.detector = MLDetector()
        self.explainer = NLPExplainer()
        self.training_done = False

    def classify_attack(self, session):
        flow = session.get("flow_count", 0)
        pkt = session.get("packet_count", 0)
        port = session.get("dst_port", 0)
        duration = session.get("duration", 1)

        if flow > 25:
            return "Port Scan", "Multiple ports targeted"

        if pkt > 700:
            return "Traffic Flood", "High packet volume"

        if duration < 0.5 and pkt > 150:
            return "Burst Traffic", "Packet burst detected"

        if flow > 8:
            return "Suspicious Activity", "Too many flows"

        if port not in [80, 443, 53] and flow < 5:
            return "Unusual Access", "Access to uncommon port"

        return "Normal", "No anomaly"

    def get_severity(self, attack):
        if attack in ["Port Scan", "Traffic Flood"]:
            return "HIGH"
        if attack in ["Burst Traffic", "Suspicious Activity"]:
            return "MEDIUM"
        return "LOW"

    def get_confidence(self, session, attack):
        flow = session.get("flow_count", 0)
        pkt = session.get("packet_count", 0)

        base = 30

        if attack == "Port Scan":
            base += flow * 2
        elif attack == "Traffic Flood":
            base += pkt / 10
        elif attack == "Burst Traffic":
            base += pkt / 20
        elif attack == "Suspicious Activity":
            base += flow * 1.5
        else:
            base += 5

        return f"{min(int(base), 100)}%"

    def process_sessions(self, sessions):
        alerts = []

        if not self.training_done:
            for s in sessions:
                self.detector.add_to_training(s)

            if self.detector.train():
                print("[ML] Model trained successfully")
                self.training_done = True

            return []

        for s in sessions:
            attack, reason = self.classify_attack(s)

            if attack == "Normal":
                continue

            explanation = self.explainer.explain({
                "attack_type": attack
            })

            alert = {
                "src_ip": s.get("src_ip"),
                "dst_ip": s.get("dst_ip"),
                "protocol": s.get("protocol"),

                "severity": self.get_severity(attack),
                "confidence": self.get_confidence(s, attack),

                "attack_type": attack,
                "reason": reason,
                "explanation": explanation,
            }

            alerts.append(alert)

        return alerts