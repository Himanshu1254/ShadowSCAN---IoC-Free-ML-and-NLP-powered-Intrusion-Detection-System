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
    f1_score
)

from sklearn.ensemble import (
    RandomForestClassifier
)

from xgboost import XGBClassifier


class SmartDatasetTrainer:

    def __init__(self):

        self.dataset_dir = (
            r"D:\Projects\ShadowScan Important"
        )

        self.models_dir = "models"

        os.makedirs(
            self.models_dir,
            exist_ok=True
        )

    # --------------------------------------------------
    # FIND ALL DATASETS
    # --------------------------------------------------

    def find_datasets(self):

        csv_files = glob.glob(
            os.path.join(
                self.dataset_dir,
                "*.csv"
            )
        )

        xlsx_files = glob.glob(
            os.path.join(
                self.dataset_dir,
                "*.xlsx"
            )
        )

        return csv_files + xlsx_files

    # --------------------------------------------------
    # LOAD DATASET
    # --------------------------------------------------

    def load_dataset(self, file_path):

        print(
            f"\n[DATASET] Loading: {file_path}"
        )

        if file_path.endswith(".csv"):

            df = pd.read_csv(
                file_path,
                low_memory=False
            )

        else:

            df = pd.read_excel(
                file_path
            )

        print(
            f"[DATASET] Rows: {len(df)}"
        )
        print("\n[COLUMNS]\n")

        for col in df.columns:

            print(col)

        return df

    # --------------------------------------------------
    # CLEAN DATASET
    # --------------------------------------------------

    def clean_dataset(self, df):

        print(
            "[CLEANING] Processing dataset..."
        )

        # CLEAN COLUMN NAMES
        df.columns = [

            str(c).strip()

            for c in df.columns
        ]

        # REMOVE INF VALUES
        df.replace(
            [np.inf, -np.inf],
            np.nan,
            inplace=True
        )

        # REMOVE NULLS
        df.dropna(inplace=True)

        # REMOVE DUPLICATES
        df.drop_duplicates(inplace=True)

        print(
            f"[CLEANING] Final rows: {len(df)}"
        )

        return df

    # --------------------------------------------------
    # AUTO DETECT LABEL COLUMN
    # --------------------------------------------------

    def detect_label_column(self, df):

        possible_labels = [

            "Label",
            "label",

            "Class",
            "class",

            "Target",
            "target",

            "Attack",
            "attack",

            "Outcome",
            "outcome"
        ]

        for col in df.columns:

            if str(col).strip() in possible_labels:

                print(
                    f"\n[LABEL COLUMN DETECTED] {col}"
                )

                return col

        # FALLBACK SMART DETECTION
        for col in df.columns:

            unique_vals = (
                df[col]
                .astype(str)
                .str.upper()
                .unique()
            )

            if (
                "BENIGN" in unique_vals
                or "NORMAL" in unique_vals
            ):

                print(
                    f"\n[LABEL COLUMN AUTO-DETECTED] {col}"
                )

                return col

        print("\n[ERROR] No label column found.\n")

        print("AVAILABLE COLUMNS:\n")

        for c in df.columns:
            print(c)

        raise Exception(
            "Dataset label column missing"
        )

    # --------------------------------------------------
    # FEATURE EXTRACTION
    # --------------------------------------------------

    def extract_features(self, df):

        print(
            "[FEATURES] Extracting features..."
        )

        label_col = self.detect_label_column(
            df
        )

        # --------------------------------------------------
        # SAFE COLUMN FETCHER
        # --------------------------------------------------

        def get_col(name, default=0):

            if name in df.columns:

                return pd.to_numeric(

                    df[name],

                    errors="coerce"

                ).fillna(default)

            return pd.Series(
                [default] * len(df)
            )

        # --------------------------------------------------
        # REAL DATASET COLUMNS
        # --------------------------------------------------

        fwd_packets = get_col(
            "total_fwd_packets"
        )

        bwd_packets = get_col(
            "total_backward_packets"
        )

        fwd_bytes = get_col(
            "total_length_of_fwd_packets"
        )

        bwd_bytes = get_col(
            "total_length_of_bwd_packets"
        )

        duration = get_col(
            "flow_duration",
            1
        )

        dst_port = get_col(
            "unnamed: 0"
        )

        flow_count = get_col(
            "subflow_fwd_packets",
            1
        )

        # --------------------------------------------------
        # ENGINEERED FEATURES
        # --------------------------------------------------

        packet_count = (
            fwd_packets + bwd_packets
        )

        byte_count = (
            fwd_bytes + bwd_bytes
        )

        duration_safe = duration.replace(
            0,
            0.001
        )

        bytes_per_second = (
            byte_count / duration_safe
        )

        packets_per_second = (
            packet_count / duration_safe
        )

        avg_packet_size = (
            byte_count
            /
            packet_count.replace(0, 1)
        )

        flow_density = (
            flow_count / duration_safe
        )

        burst_score = (
            packets_per_second
            *
            flow_count
        )

        port_is_common = dst_port.apply(

            lambda x:

            1

            if x in [
                80,
                443,
                53
            ]

            else 0
        )

        # --------------------------------------------------
        # FINAL FEATURE FRAME
        # --------------------------------------------------

        X = pd.DataFrame({

            "packet_count":
                packet_count,

            "byte_count":
                byte_count,

            "duration":
                duration,

            "flow_count":
                flow_count,

            "dst_port":
                dst_port,

            "bytes_per_second":
                bytes_per_second,

            "packets_per_second":
                packets_per_second,

            "avg_packet_size":
                avg_packet_size,

            "flow_density":
                flow_density,

            "burst_score":
                burst_score,

            "port_is_common":
                port_is_common
        }).fillna(0)

        # --------------------------------------------------
        # LABELS
        # --------------------------------------------------

        y = df[label_col].apply(

            lambda x:

            0

            if str(x).upper() in [

                "BENIGN",
                "NORMAL",
                "0"

            ]

            else 1
        )

        print(
            f"[FEATURES] Features used: "
            f"{len(X.columns)}"
        )

        print(X.head())

        return X, y

    # --------------------------------------------------
    # EVALUATION
    # --------------------------------------------------

    def evaluate_model(
        self,
        model,
        X_test,
        y_test,
        name
    ):

        preds = model.predict(
            X_test
        )

        print(
            f"\n========== {name} =========="
        )

        print(
            "\nClassification Report:\n"
        )

        print(
            classification_report(
                y_test,
                preds
            )
        )

        accuracy = accuracy_score(
            y_test,
            preds
        )

        precision = precision_score(
            y_test,
            preds
        )

        recall = recall_score(
            y_test,
            preds
        )

        f1 = f1_score(
            y_test,
            preds
        )

        print(
            "\nConfusion Matrix:\n"
        )

        print(
            confusion_matrix(
                y_test,
                preds
            )
        )

        print(
            f"\nAccuracy : {accuracy:.4f}"
        )

        print(
            f"Precision: {precision:.4f}"
        )

        print(
            f"Recall   : {recall:.4f}"
        )

        print(
            f"F1 Score : {f1:.4f}"
        )

    # --------------------------------------------------
    # RANDOM FOREST
    # --------------------------------------------------

    def train_random_forest(
        self,
        X_train,
        y_train
    ):

        print(
            "\n[RF] Training RandomForest..."
        )

        model = RandomForestClassifier(

            n_estimators=100,

            max_depth=20,

            n_jobs=-1,

            random_state=42
        )

        model.fit(
            X_train,
            y_train
        )

        path = os.path.join(
            self.models_dir,
            "random_forest_model.pkl"
        )

        joblib.dump(
            model,
            path
        )

        print(
            f"[RF] Saved: {path}"
        )

        return model

    # --------------------------------------------------
    # XGBOOST
    # --------------------------------------------------

    def train_xgboost(
        self,
        X_train,
        y_train
    ):

        print(
            "\n[XGB] Training XGBoost..."
        )

        model = XGBClassifier(

            n_estimators=100,

            max_depth=8,

            learning_rate=0.1,

            subsample=0.8,

            colsample_bytree=0.8,

            eval_metric="logloss",

            n_jobs=-1,

            random_state=42
        )

        model.fit(
            X_train,
            y_train
        )

        path = os.path.join(
            self.models_dir,
            "xgboost_model.pkl"
        )

        joblib.dump(
            model,
            path
        )

        print(
            f"[XGB] Saved: {path}"
        )

        return model

    # --------------------------------------------------
    # MAIN TRAINING PIPELINE
    # --------------------------------------------------

    def run(self):

        datasets = self.find_datasets()

        if not datasets:

            print(
                "[ERROR] No datasets found"
            )

            return

        print(
            "\n=== DATASETS FOUND ==="
        )

        for d in datasets:
            print(d)

        # USE FIRST DATASET
        dataset_path = datasets[0]

        df = self.load_dataset(
            dataset_path
        )

        df = self.clean_dataset(df)

        X, y = self.extract_features(df)

        print(
            "\n[SPLIT] Creating train/test split..."
        )

        X_train, X_test, y_train, y_test = train_test_split(

            X,
            y,

            test_size=0.2,

            random_state=42,

            stratify=y
        )

        print(
            f"[TRAIN] Samples: {len(X_train)}"
        )

        print(
            f"[TEST] Samples : {len(X_test)}"
        )

        # --------------------------------------------------
        # RANDOM FOREST
        # --------------------------------------------------

        rf_model = self.train_random_forest(

            X_train,
            y_train
        )

        self.evaluate_model(

            rf_model,

            X_test,

            y_test,

            "RandomForest"
        )

        # --------------------------------------------------
        # XGBOOST
        # --------------------------------------------------

        xgb_model = self.train_xgboost(

            X_train,
            y_train
        )

        self.evaluate_model(

            xgb_model,

            X_test,

            y_test,

            "XGBoost"
        )

        print(
            "\n[TRAINING COMPLETE]"
        )


if __name__ == "__main__":

    trainer = SmartDatasetTrainer()

    trainer.run()