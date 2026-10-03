"""
UpayAche — Behavioral Anomaly Detection Training Pipeline.
Trains an unsupervised Isolation Forest on behavioral transaction feature representations,
evaluates anomaly score distributions, and persists model & configuration metadata.
"""

import sys
import json
import joblib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, precision_score, recall_score, f1_score

# Ensure project root in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.anomaly_features import ANOMALY_FEATURE_NAMES, extract_behavioral_features_from_dataframe


def train_anomaly_engine(
    data_dir: Path = None,
    output_model_dir: Path = None,
    contamination: float = 0.10,
    random_state: int = 42
) -> Dict[str, Any]:
    """Train and persist unsupervised Isolation Forest behavioral anomaly engine."""
    if data_dir is None:
        data_dir = PROJECT_ROOT / "data" / "synthetic"
    if output_model_dir is None:
        output_model_dir = PROJECT_ROOT / "ml" / "models"

    output_model_dir.mkdir(parents=True, exist_ok=True)

    print("Loading synthetic datasets for behavioral training...")
    df_tx = pd.read_csv(data_dir / "transactions.csv")
    df_wallets = pd.read_csv(data_dir / "wallets.csv")

    print(f"Extracting 11 behavioral features for {len(df_tx)} transactions...")
    df_features = extract_behavioral_features_from_dataframe(df_tx, df_wallets)

    X = df_features[ANOMALY_FEATURE_NAMES].values
    y_true_anomaly = df_features["is_anomaly"].values

    hyperparameters = {
        "n_estimators": 150,
        "contamination": contamination,
        "max_samples": "auto",
        "bootstrap": False,
        "random_state": random_state
    }

    print(f"Training IsolationForest (contamination={contamination})...")
    model = IsolationForest(**hyperparameters)
    model.fit(X)

    # Evaluate decision function and anomaly scores
    decision_scores = model.decision_function(X)
    raw_predictions = model.predict(X) # 1 for inlier, -1 for outlier
    predicted_anomalies = (raw_predictions == -1).astype(int)

    # Calibrated anomaly score [0.0, 1.0]: higher = more anomalous
    anomaly_scores = np.clip(0.5 - (decision_scores / 0.5), 0.0, 1.0)

    precision = float(precision_score(y_true_anomaly, predicted_anomalies, zero_division=0))
    recall = float(recall_score(y_true_anomaly, predicted_anomalies, zero_division=0))
    f1 = float(f1_score(y_true_anomaly, predicted_anomalies, zero_division=0))

    detected_count = int(np.sum(predicted_anomalies))
    total_count = len(X)

    print(f"Behavioral Anomaly Training Summary:")
    print(f"  Total Samples: {total_count}")
    print(f"  Detected Anomalies: {detected_count} ({detected_count / total_count:.2%})")
    print(f"  Unsupervised Precision vs Known Anomalies: {precision:.4f}")
    print(f"  Unsupervised Recall vs Known Anomalies: {recall:.4f}")
    print(f"  F1 Score: {f1:.4f}")

    # Persist model artifact
    model_path = output_model_dir / "isolation_forest_model.joblib"
    joblib.dump(model, str(model_path))

    # Persist metadata
    metadata = {
        "model_name": "isolation_forest_behavioral_engine",
        "model_version": "v1.0.0",
        "algorithm": "IsolationForest",
        "paradigm": "unsupervised_anomaly_detection",
        "contamination": contamination,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": total_count,
        "feature_count": len(ANOMALY_FEATURE_NAMES),
        "feature_names": ANOMALY_FEATURE_NAMES,
        "hyperparameters": hyperparameters,
        "score_calibration": {
            "method": "decision_function_linear_scaling",
            "formula": "clip(0.5 - (decision_function / 0.5), 0.0, 1.0)",
            "decision_threshold": 0.50
        },
        "training_metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "detected_anomalies": detected_count,
            "mean_normal_score": round(float(np.mean(anomaly_scores[y_true_anomaly == 0])), 4),
            "mean_anomaly_score": round(float(np.mean(anomaly_scores[y_true_anomaly == 1])), 4)
        }
    }

    metadata_path = output_model_dir / "anomaly_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved Isolation Forest model to {model_path}")
    print(f"Saved metadata to {metadata_path}")
    return metadata


if __name__ == "__main__":
    train_anomaly_engine()
