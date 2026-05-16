class ExplainabilityEngine:

    def explain(self, session):

        reasons = []

        packet_count = session.get(
            "packet_count",
            0
        )

        flow_count = session.get(
            "flow_count",
            0
        )

        dst_port = session.get(
            "dst_port",
            0
        )

        duration = session.get(
            "duration",
            0
        )

        # --------------------------------------------------

        if packet_count > 500:

            reasons.append(
                "High packet volume"
            )

        if flow_count > 15:

            reasons.append(
                "Excessive flow generation"
            )

        if duration < 0.5:

            reasons.append(
                "Burst communication behavior"
            )

        if dst_port not in [

            80,
            443,
            53

        ]:

            reasons.append(
                "Unusual destination port"
            )

        # --------------------------------------------------

        if not reasons:

            reasons.append(
                "General anomalous behavior"
            )

        return reasons