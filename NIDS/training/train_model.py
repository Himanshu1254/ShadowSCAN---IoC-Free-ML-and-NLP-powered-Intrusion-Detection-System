import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report


class DatasetTrainer:

    def __init__(self):

        self.model = IsolationForest(
            contamination=0.1,
            random_state=42
        )

    # --------------------------------------------------

    def load_dataset(self, path):

        df = pd.read_csv(path)

        return df

    # --------------------------------------------------

    def preprocess(self, df):

        # 🔥 BASIC FEATURE SET

        features = [

            "Flow Duration",

            "Total Fwd Packets",

            "Total Backward Packets",

            "Flow Bytes/s",

            "Flow Packets/s"
        ]

        X = df[features].fillna(0)

        # LABELS
        y = df["Label"].apply(
            lambda x:
            0 if x == "BENIGN" else 1
        )

        return X, y

    # --------------------------------------------------

    def train(self, dataset_path):

        print("[TRAINING] Loading dataset...")

        df = self.load_dataset(
            dataset_path
        )

        X, y = self.preprocess(df)

        print("[TRAINING] Training Isolation Forest...")

        self.model.fit(X)

        preds = self.model.predict(X)

        # CONVERT
        preds = [
            0 if p == 1 else 1
            for p in preds
        ]

        print("\n=== CLASSIFICATION REPORT ===\n")

        print(
            classification_report(
                y,
                preds
            )
        )

        # SAVE MODEL
        joblib.dump(
            self.model,
            "models/cicids_model.pkl"
        )

        print(
            "\n[TRAINING COMPLETE]"
        )


if __name__ == "__main__":

    trainer = DatasetTrainer()

    trainer.train(
        "datasets/cicids_sample.csv"
    )