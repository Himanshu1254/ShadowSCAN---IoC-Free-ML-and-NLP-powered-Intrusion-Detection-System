import sys
from pathlib import Path

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
from ml.anomaly.sequence_autoencoder import SequenceAutoencoderTrainer


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

    vocab_size = tokenizer.vocab_size()
    print("Vocab size:", vocab_size)

    trainer = SequenceAutoencoderTrainer(
        vocab_size=vocab_size,
        embed_dim=32,
        hidden_dim=64
    )

    trainer.train(token_id_sequences, epochs=30)

    print("\nReconstruction errors:")
    for i, seq in enumerate(token_id_sequences):
        err = trainer.reconstruction_error(seq)
        print(f"Sequence {i} | Error: {err:.6f}")


if __name__ == "__main__":
    main()
