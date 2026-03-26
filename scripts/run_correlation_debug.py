import sys
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from capture.pcap_reader import PCAPReader
from features.flow_builder import FlowBuilder
from features.session_builder import SessionBuilder
from nlp.tokenizer import NetworkTokenizer
from nlp.sequence_builder import SequenceBuilder
from nlp.embedding_trainer import EmbeddingTrainer
from ml.anomaly.embedding_distance import EmbeddingDistanceDetector
from ml.anomaly.sequence_autoencoder import SequenceAutoencoderTrainer
from ml.anomaly.alert_fusion import AlertFusionEngine
from correlation.alert_correlator import AlertCorrelator


def main():
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

    # ---------------- DISTANCE DETECTOR ----------------
    dist_detector = EmbeddingDistanceDetector(threshold_std=2.5)
    dist_detector.fit(sequence_embeddings)

    embed_scores = [dist_detector.score(e) for e in sequence_embeddings]

    # ---------------- AUTOENCODER ----------------
    ae_trainer = SequenceAutoencoderTrainer(
        vocab_size=tokenizer.vocab_size(),
        embed_dim=32,
        hidden_dim=64
    )
    ae_trainer.train(token_id_sequences, epochs=10)

    ae_errors = [ae_trainer.reconstruction_error(s) for s in token_id_sequences]

    # ---------------- FUSION ----------------
    fusion = AlertFusionEngine()
    fusion.fit(embed_scores, ae_errors)

    raw_alerts = []

    for i, seq in enumerate(sequences):
        fused = fusion.fuse(embed_scores[i], ae_errors[i])

        raw_alerts.append({
            "host": "192.168.170.8",
            "timestamp": seq["start_time"],
            "is_alert": fused["is_alert"],
            "severity": fused["severity"],
            "final_score": fused["final_score"],
            "evidence": fused
        })

    # ---------------- CORRELATION ----------------
    correlator = AlertCorrelator(window_minutes=10, min_events=1)
    correlated = correlator.correlate(raw_alerts)

    print("\nCORRELATED ALERTS")
    print("=" * 60)

    if not correlated:
        print("No correlated alerts (normal behavior)")
    else:
        for alert in correlated:
            print(alert)
            print("-" * 60)


if __name__ == "__main__":
    main()
