from gensim.models import Word2Vec


class EmbeddingTrainer:
    def __init__(
        self,
        vector_size=64,
        window=5,
        min_count=1,
        workers=2,
        epochs=20
    ):
        self.vector_size = vector_size
        self.window = window
        self.min_count = min_count
        self.workers = workers
        self.epochs = epochs
        self.model = None

    def train(self, sequences):
        """
        sequences: list of token_id_sequence lists
        """
        # Convert token IDs to strings (Word2Vec expects strings)
        sentences = [[str(tok) for tok in seq] for seq in sequences]

        self.model = Word2Vec(
            sentences=sentences,
            vector_size=self.vector_size,
            window=self.window,
            min_count=self.min_count,
            workers=self.workers,
            sg=1  # Skip-gram (better for rare behaviors)
        )

        self.model.train(
            sentences,
            total_examples=len(sentences),
            epochs=self.epochs
        )

        return self.model

    def get_vector(self, token_id):
        if self.model is None:
            raise RuntimeError("Embedding model not trained")

        return self.model.wv[str(token_id)]

    def similarity(self, token_id_a, token_id_b):
        if self.model is None:
            raise RuntimeError("Embedding model not trained")

        return self.model.wv.similarity(str(token_id_a), str(token_id_b))

    def vocab_size(self):
        if self.model is None:
            return 0
        return len(self.model.wv)
