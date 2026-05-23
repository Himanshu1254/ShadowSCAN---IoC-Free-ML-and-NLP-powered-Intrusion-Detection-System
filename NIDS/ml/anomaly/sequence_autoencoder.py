import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class SequenceAutoencoder(nn.Module):
    def __init__(self, vocab_size, embed_dim=32, hidden_dim=64):
        super().__init__()

        self.embedding = nn.Embedding(
            num_embeddings=vocab_size + 1,  # +1 for padding index 0
            embedding_dim=embed_dim,
            padding_idx=0
        )

        self.encoder = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            batch_first=True
        )

        self.decoder = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            batch_first=True
        )

        self.output = nn.Linear(hidden_dim, embed_dim)

    def forward(self, x):
        """
        x: (batch, seq_len) token IDs
        """
        emb = self.embedding(x)

        _, (h, _) = self.encoder(emb)

        # Repeat context for each timestep
        context = h.repeat(emb.size(1), 1, 1).permute(1, 0, 2)

        dec_out, _ = self.decoder(emb, (h, torch.zeros_like(h)))
        recon = self.output(dec_out)

        return emb, recon


class SequenceAutoencoderTrainer:
    def __init__(self, vocab_size, embed_dim=32, hidden_dim=64, lr=1e-3):
        self.model = SequenceAutoencoder(vocab_size, embed_dim, hidden_dim)
        self.loss_fn = nn.MSELoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)

    def train(self, sequences, epochs=30, batch_size=8):
        """
        sequences: list of token_id_sequence (list[int])
        """
        max_len = max(len(s) for s in sequences)

        padded = []
        for s in sequences:
            padded.append(s + [0] * (max_len - len(s)))

        X = torch.tensor(padded, dtype=torch.long)

        dataset = TensorDataset(X)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.model.train()

        for epoch in range(epochs):
            total_loss = 0.0
            for (batch,) in loader:
                emb, recon = self.model(batch)
                loss = self.loss_fn(recon, emb)

                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()

                total_loss += loss.item()

            if (epoch + 1) % 5 == 0:
                print(f"[AE] Epoch {epoch+1}/{epochs} | Loss: {total_loss:.6f}")

    def reconstruction_error(self, sequence):
        """
        sequence: list[int]
        """
        self.model.eval()

        with torch.no_grad():
            x = torch.tensor(sequence, dtype=torch.long).unsqueeze(0)
            emb, recon = self.model(x)
            error = torch.mean((emb - recon) ** 2).item()

        return error
