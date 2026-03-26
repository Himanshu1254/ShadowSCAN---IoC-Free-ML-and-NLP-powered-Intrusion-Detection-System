import sys
from pathlib import Path

# -------------------------------------------------
# Ensure project root is in PYTHONPATH
# -------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# -------------------------------------------------
# Imports (now work correctly)
# -------------------------------------------------
from capture.pcap_reader import PCAPReader
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder
from nlp.tokenizer import NetworkTokenizer
from nlp.sequence_builder import SequenceBuilder
from nlp.embedding_trainer import EmbeddingTrainer
from ml.anomaly.embedding_distance import EmbeddingDistanceDetector


def main():
    # ---------------- PIPELINE ----------------
    packets = PCAPReader("data/raw/dns.cap").read()
    flows = FlowBuilder().build_flows(packets)
    sessions = SessionBuilder().build_sessions(flows)

    tokenizer = NetworkTokenizer()
    seq_builder = SequenceBuilder(window_seconds=300)

    sequences = seq_builder.build_sequences(
        sessions,
        tokenizer,
        local_ip="192.168.170.8"
    )

    token_id_sequences = [s["token_id_sequence"] for s in sequences]

    # ---------------- EMBEDDINGS ----------------
    trainer = EmbeddingTrainer(vector_size=32)
    trainer.train(token_id_sequences)

    sequence_embeddings = []
    token_embeddings_per_sequence = []

    for seq in token_id_sequences:
        vectors = [trainer.get_vector(tok) for tok in seq]
        token_embeddings_per_sequence.append(vectors)
        sequence_embeddings.append(sum(vectors) / len(vectors))

    # ---------------- DETECTOR ----------------
    detector = EmbeddingDistanceDetector(threshold_std=2.5)
    stats = detector.fit(sequence_embeddings)

    print("\nBaseline stats:")
    print(stats)
    print("=" * 60)

    # ---------------- SCORING + EXPLANATION ----------------
    for i, emb in enumerate(sequence_embeddings):
        is_anom, score, threshold = detector.is_anomalous(emb)

        print(f"Sequence {i}")
        print("  Score      :", round(float(score), 6))
        print("  Threshold  :", round(float(threshold), 6))
        print("  Anomalous  :", is_anom)

        explanations = detector.explain_sequence(
            token_embeddings_per_sequence[i],
            token_ids=token_id_sequences[i]
        )

        print("  Top contributing tokens:")
        for e in explanations[:3]:
            print("   ", e)

        print("-" * 60)


if __name__ == "__main__":
    main()
