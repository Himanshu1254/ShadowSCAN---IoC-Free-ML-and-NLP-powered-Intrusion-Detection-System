import sys
from pathlib import Path
import numpy as np

# -------------------------------------------------
# Ensure project root is in PYTHONPATH
# -------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# -------------------------------------------------
# Imports
# -------------------------------------------------
from capture.pcap_reader import PCAPReader
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder
from nlp.tokenizer import NetworkTokenizer
from nlp.sequence_builder import SequenceBuilder
from nlp.embedding_trainer import EmbeddingTrainer
from ml.anomaly.embedding_distance import EmbeddingDistanceDetector
from ml.anomaly.sequence_autoencoder import SequenceAutoencoderTrainer
from ml.anomaly.alert_fusion import AlertFusionEngine


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
    embed_trainer = EmbeddingTrainer(vector_size=32)
    embed_trainer.train(token_id_sequences)

    sequence_embeddings = []
    for seq in token_id_sequences:
        vecs = [embed_trainer.get_vector(tok) for tok in seq]
        sequence_embeddings.append(sum(vecs) / len(vecs))

    # ---------------- EMBEDDING DISTANCE ----------------
    dist_detector = EmbeddingDistanceDetector(threshold_std=2.5)
    dist_detector.fit(sequence_embeddings)

    embed_scores = [
        dist_detector.score(e) for e in sequence_embeddings
    ]

    # ---------------- AUTOENCODER ----------------
    ae_trainer = SequenceAutoencoderTrainer(
        vocab_size=tokenizer.vocab_size(),
        embed_dim=32,
        hidden_dim=64
    )

    ae_trainer.train(token_id_sequences, epochs=20)

    ae_errors = [
        ae_trainer.reconstruction_error(seq)
        for seq in token_id_sequences
    ]

    # ---------------- ALERT FUSION ----------------
    fusion = AlertFusionEngine()
    stats = fusion.fit(embed_scores, ae_errors)

    print("\nBaseline fusion stats:")
    print(stats)
    print("=" * 60)

    for idx in range(len(token_id_sequences)):
        alert = fusion.fuse(
            embed_scores[idx],
            ae_errors[idx]
        )

        print(f"Sequence {idx}")
        print("  Alert:", alert["is_alert"])
        print("  Severity:", round(alert["severity"], 3))
        print("  Final score:", round(alert["final_score"], 3))
        print("  Components:", alert["components"])
        print("-" * 60)


if __name__ == "__main__":
    main()
