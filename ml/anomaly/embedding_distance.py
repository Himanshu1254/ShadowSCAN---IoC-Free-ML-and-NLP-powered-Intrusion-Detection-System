import numpy as np


class EmbeddingDistanceDetector:
    def __init__(self, threshold_std=3.0, epsilon=1e-6):
        """
        threshold_std: anomaly threshold in std deviations
        epsilon: numerical stability for low-variance data
        """
        self.threshold_std = threshold_std
        self.epsilon = epsilon
        self.centroid = None
        self.mean_distance = None
        self.std_distance = None

    # ---------------- TRAINING ----------------

    def fit(self, embeddings):
        """
        embeddings: list of numpy vectors
        """
        X = np.array(embeddings)

        self.centroid = X.mean(axis=0)

        distances = np.linalg.norm(X - self.centroid, axis=1)

        self.mean_distance = float(distances.mean())
        self.std_distance = float(max(distances.std(), self.epsilon))

        return {
            "mean_distance": self.mean_distance,
            "std_distance": self.std_distance,
            "threshold": self.mean_distance + self.threshold_std * self.std_distance
        }

    # ---------------- SCORING ----------------

    def score(self, embedding):
        if self.centroid is None:
            raise RuntimeError("Detector not fitted")

        return float(np.linalg.norm(embedding - self.centroid))

    def is_anomalous(self, embedding):
        score = self.score(embedding)
        threshold = self.mean_distance + self.threshold_std * self.std_distance

        return score > threshold, score, threshold

    # ---------------- EXPLAINABILITY ----------------

    def explain_sequence(self, token_embeddings, token_ids=None):
        """
        token_embeddings: list of vectors (per token)
        token_ids: optional list of token IDs

        Returns: ranked list of token contributions
        """
        explanations = []

        for idx, vec in enumerate(token_embeddings):
            contribution = float(np.linalg.norm(vec - self.centroid))

            explanations.append({
                "position": idx,
                "token_id": token_ids[idx] if token_ids else None,
                "contribution": contribution
            })

        explanations.sort(key=lambda x: x["contribution"], reverse=True)
        return explanations
