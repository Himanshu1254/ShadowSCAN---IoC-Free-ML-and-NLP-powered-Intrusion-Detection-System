class SessionScorer:
    """
    Feature-based, unsupervised, explainable session scorer (v1).
    """

    def score(self, sessions):
        scored = []

        for session in sessions:
            try:
                flows = session.get("flows", [])
                flow_count = session.get("flow_count", 0)

                if not flows:
                    continue

                # ---- Feature extraction ----
                packet_counts = [f["packet_count"] for f in flows]
                total_packets = sum(packet_counts)
                avg_packets = total_packets / max(flow_count, 1)

                # Directional imbalance
                if len(packet_counts) >= 2:
                    imbalance = abs(packet_counts[0] - packet_counts[-1]) / max(total_packets, 1)
                else:
                    imbalance = 0.0

                # ---- Normalized feature scores (0..1) ----
                flow_score = min(flow_count / 10.0, 1.0)
                volume_score = min(total_packets / 50.0, 1.0)
                imbalance_score = min(imbalance * 2.0, 1.0)
                spread_score = min(avg_packets / 20.0, 1.0)

                # ---- Weighted final score ----
                score = (
                    0.35 * flow_score +
                    0.35 * imbalance_score +
                    0.20 * volume_score +
                    0.10 * spread_score
                )

                scored.append({
                    **session,
                    "score": round(score, 3),
                    "features": {
                        "flow_count": flow_count,
                        "total_packets": total_packets,
                        "avg_packets_per_flow": round(avg_packets, 2),
                        "directional_imbalance": round(imbalance, 2),
                    },
                    "score_breakdown": {
                        "flow_score": round(flow_score, 2),
                        "imbalance_score": round(imbalance_score, 2),
                        "volume_score": round(volume_score, 2),
                        "spread_score": round(spread_score, 2),
                    },
                })

            except Exception:
                continue

        return scored
