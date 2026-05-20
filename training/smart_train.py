import os
import glob
import joblib

import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

ATTACK_MAPPING = {
    "BENIGN": "Benign",
    "DoS Hulk": "DDoS",
    "DoS GoldenEye": "DDoS",
    "DoS slowloris": "DDoS",
    "DoS Slowhttptest": "DDoS",
    "PortScan": "Port Scan",
    "FTP-Patator": "Brute Force",
    "SSH-Patator": "Brute Force",
    "Bot": "Botnet",
    "Web Attack \x96 Brute Force": "Web Attack",
    "Web Attack \x96 XSS": "Web Attack",
    "Web Attack \x96 Sql Injection": "Web Attack",
    "Infiltration": "Infiltration",
}

COMMON_PORTS = {80, 443, 53}

POSSIBLE_LABEL_COLUMNS = {"label", "class", "target", "attack", "outcome"}


class SmartDatasetTrainer:

    def __init__(self):
        self.dataset_dir = r"D:\Projects\ShadowScan Important"
        self.models_dir = "models"
        os.makedirs(self.models_dir, exist_ok=True)

    # --------------------------------------------------
    # FIND ALL DATASETS
    # --------------------------------------------------

    def find_datasets(self):
        csv_files = glob.glob(os.path.join(self.dataset_dir, "*.csv"))
        xlsx_files = glob.glob(os.path.join(self.dataset_dir, "*.xlsx"))
        return csv_files + xlsx_files

    # --------------------------------------------------
    # LOAD DATASET
    # --------------------------------------------------

    def load_dataset(self, file_path):
        print(f"\n[DATASET] Loading: {file_path}")

        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path, low_memory=False)
        else:
            df = pd.read_excel(file_path)

        print(f"[DATASET] Rows: {len(df)}")
        print("\n[COLUMNS]\n")
        print("\n".join(df.columns.tolist()))

        return df

    # --------------------------------------------------
    # CLEAN DATASET
    # --------------------------------------------------

    def clean_dataset(self, df):
        print("[CLEANING] Processing dataset...")

        df.columns = [str(c).strip() for c in df.columns]
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.dropna(inplace=True)
        df.drop_duplicates(inplace=True)

        print(f"[CLEANING] Final rows: {len(df)}")
        return df

    # --------------------------------------------------
    # LABEL DETECTION
    # --------------------------------------------------

    def detect_label_column(self, df):
        # Match by known label column names (case-insensitive)
        for col in df.columns:
            if col.strip().lower() in POSSIBLE_LABEL_COLUMNS:
                print(f"\n[LABEL COLUMN DETECTED] {col}")
                return col

        # Fallback: detect by known label values
        for col in df.columns:
            unique_vals = df[col].astype(str).str.upper().unique()
            if "BENIGN" in unique_vals or "NORMAL" in unique_vals:
                print(f"\n[LABEL COLUMN AUTO-DETECTED] {col}")
                return col

        raise Exception("Dataset label column missing")

    # --------------------------------------------------
    # FEATURE EXTRACTION
    # --------------------------------------------------

    def extract_features(self, df):
        print("[FEATURES] Extracting features...")

        label_col = self.detect_label_column(df)

        def get_col(name, default=0):
            if name in df.columns:
                return pd.to_numeric(df[name], errors="coerce").fillna(default)
            return pd.Series([default] * len(df))

        # Raw columns
        fwd_packets = get_col("total_fwd_packets")
        bwd_packets = get_col("total_backward_packets")
        fwd_bytes = get_col("total_length_of_fwd_packets")
        bwd_bytes = get_col("total_length_of_bwd_packets")
        duration = get_col("flow_duration", default=1)
        dst_port = get_col("Unnamed: 0")
        flow_count = get_col("subflow_fwd_packets", default=1)

        # Engineered features
        packet_count = fwd_packets + bwd_packets
        byte_count = fwd_bytes + bwd_bytes
        duration_safe = duration.replace(0, 0.001)
        bytes_per_second = byte_count / duration_safe
        packets_per_second = packet_count / duration_safe
        avg_packet_size = byte_count / packet_count.replace(0, 1)
        flow_density = flow_count / duration_safe
        burst_score = packets_per_second * flow_count
        port_is_common = dst_port.apply(lambda x: 1 if x in COMMON_PORTS else 0)

        X = pd.DataFrame(
            {
                "packet_count": packet_count,
                "byte_count": byte_count,
                "duration": duration,
                "flow_count": flow_count,
                "dst_port": dst_port,
                "bytes_per_second": bytes_per_second,
                "packets_per_second": packets_per_second,
                "avg_packet_size": avg_packet_size,
                "flow_density": flow_density,
                "burst_score": burst_score,
                "port_is_common": port_is_common,
            }
        ).fillna(0)

        y = df[label_col].apply(lambda x: ATTACK_MAPPING.get(str(x), "Unknown Attack"))

        print(f"[FEATURES] Features used: {len(X.columns)}")
        print(X.head())

        return X, y

    # --------------------------------------------------
    # EVALUATION
    # --------------------------------------------------

    def evaluate_model(self, model, X_test, y_test, name, label_encoder=None):
        predictions = model.predict(X_test)

        if label_encoder is not None:
            predictions = label_encoder.inverse_transform(predictions)

        print(f"\n{'=' * 10} {name} {'=' * 10}")
        print("\nClassification Report:\n")
        print(classification_report(y_test, predictions))
        print("\nConfusion Matrix:\n")
        print(confusion_matrix(y_test, predictions))

        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(
            y_test, predictions, average="weighted", zero_division=0
        )
        recall = recall_score(y_test, predictions, average="weighted", zero_division=0)
        f1 = f1_score(y_test, predictions, average="weighted", zero_division=0)

        print(f"\nAccuracy : {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall   : {recall:.4f}")
        print(f"F1 Score : {f1:.4f}")

    # --------------------------------------------------
    # RANDOM FOREST
    # --------------------------------------------------

    def train_random_forest(self, X_train, y_train):
        print("\n[RF] Training RandomForest...")

        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            n_jobs=-1,
            random_state=42,
        )
        model.fit(X_train, y_train)

        path = os.path.join(self.models_dir, "random_forest_model.pkl")
        joblib.dump(model, path)
        print(f"[RF] Saved: {path}")

        return model

    # --------------------------------------------------
    # XGBOOST
    # --------------------------------------------------

    def train_xgboost(self, X_train, y_train):
        print("\n[XGB] Training XGBoost...")

        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y_train)

        model = XGBClassifier(
            n_estimators=120,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="multi:softprob",
            eval_metric="mlogloss",
            n_jobs=-1,
            random_state=42,
        )
        model.fit(X_train, y_encoded)

        model_path = os.path.join(self.models_dir, "xgboost_model.pkl")
        encoder_path = os.path.join(self.models_dir, "xgb_label_encoder.pkl")

        joblib.dump(model, model_path)
        joblib.dump(encoder, encoder_path)

        print(f"[XGB] Saved: {model_path}")
        print(f"[XGB] Encoder Saved: {encoder_path}")

        return model, encoder

    # --------------------------------------------------
    # MAIN PIPELINE
    # --------------------------------------------------

    def run(self):
        datasets = self.find_datasets()

        if not datasets:
            print("[ERROR] No datasets found")
            return

        print("\n=== DATASETS FOUND ===")
        for path in datasets:
            print(path)

        df = self.load_dataset(datasets[0])
        df = self.clean_dataset(df)
        X, y = self.extract_features(df)

        print("\n[SPLIT] Creating train/test split...")
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y,
        )
        print(f"[TRAIN] Samples: {len(X_train)}")
        print(f"[TEST]  Samples: {len(X_test)}")

        # Random Forest
        rf_model = self.train_random_forest(X_train, y_train)
        self.evaluate_model(rf_model, X_test, y_test, "RandomForest")

        # XGBoost
        xgb_model, encoder = self.train_xgboost(X_train, y_train)
        self.evaluate_model(xgb_model, X_test, y_test, "XGBoost", encoder)

        print("\n[TRAINING COMPLETE]")


if __name__ == "__main__":
    trainer = SmartDatasetTrainer()
    trainer.run()
