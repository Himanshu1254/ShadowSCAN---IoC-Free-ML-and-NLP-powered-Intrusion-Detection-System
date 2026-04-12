import pandas as pd


class LogAnalyzer:
    def __init__(self, file_path):
        self.file_path = file_path
        self.df = pd.read_csv(file_path)

    def get_summary(self):
        total = len(self.df)

        attack_counts = self.df["attack_type"].value_counts().to_dict()
        severity_counts = self.df["severity"].value_counts().to_dict()

        summary = {
            "total_alerts": total,
            "attack_distribution": attack_counts,
            "severity_distribution": severity_counts
        }

        return summary

    def generate_nlp_report(self):
        summary = self.get_summary()

        report = f"""
ShadowSCAN Analysis Report:

Total Alerts Detected: {summary['total_alerts']}

Attack Distribution:
"""

        for attack, count in summary["attack_distribution"].items():
            report += f"- {attack}: {count}\n"

        report += "\nSeverity Distribution:\n"

        for sev, count in summary["severity_distribution"].items():
            report += f"- {sev}: {count}\n"

        report += "\nInsights:\n"

        if "Port Scan" in summary["attack_distribution"]:
            report += "- Potential scanning activity detected.\n"

        if "Traffic Flood" in summary["attack_distribution"]:
            report += "- Possible DoS-like behavior observed.\n"

        if "Unusual Access" in summary["attack_distribution"]:
            report += "- Non-standard port usage detected.\n"

        return report