import pandas as pd


class NLPAnalyzer:

    def analyze(self, file_path):

        try:

            df = pd.read_csv(file_path)

            if df.empty:

                return {
                    "summary": "No data found"
                }

            total_alerts = len(df)

            top_attack = (
                df["attack_type"]
                .value_counts()
                .idxmax()
            )

            top_ip = (
                df["src_ip"]
                .value_counts()
                .idxmax()
            )

            highest_severity = "LOW"

            if "HIGH" in df["severity"].values:
                highest_severity = "HIGH"

            elif "MEDIUM" in df["severity"].values:
                highest_severity = "MEDIUM"

            recommendations = []

            if top_attack == "Port Scan":
                recommendations.append(
                    "Investigate repeated connection attempts"
                )

            if top_attack == "Traffic Flood":
                recommendations.append(
                    "Possible DDoS-like behavior detected"
                )

            if highest_severity == "HIGH":
                recommendations.append(
                    "Immediate investigation recommended"
                )

            summary = (
                f"{total_alerts} alerts detected. "
                f"Most common attack: {top_attack}. "
                f"Top attacker IP: {top_ip}. "
                f"Highest severity: {highest_severity}."
            )

            return {

                "summary": summary,

                "stats": {
                    "total_alerts": int(total_alerts),
                    "top_attack": str(top_attack),
                    "top_ip": str(top_ip),
                    "highest_severity": highest_severity
                },

                "recommendations": recommendations
            }

        except Exception as e:

            return {
                "summary": "Analysis failed",
                "error": str(e)
            }