"""
UpayAche — Production-Style XGBoost Risk Engine Training Pipeline.
Trains supervised XGBoost Classifier on 13-feature engineering representations,
evaluates precision, recall, F1, and ROC-AUC, and persists model & metadata.
"""

import sys
import json
import joblib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.features import FEATURE_NAMES, extract_features_from_dataframe


def train_risk_engine(
    data_dir: Path = None,
    output_model_dir: Path = None,
    random_state: int = 42
) -> Dict[str, Any]:
    """Train, validate, and persist XGBoost risk classification model."""
    if data_dir is None:
        data_dir = PROJECT_ROOT / "data" / "synthetic"
    if output_model_dir is None:
        output_model_dir = PROJECT_ROOT / "ml" / "models"

    output_model_dir.mkdir(parents=True, exist_ok=True)

    print("Loading synthetic datasets for training...")
    df_tx = pd.read_csv(data_dir / "transactions.csv")
    df_wallets = pd.read_csv(data_dir / "wallets.csv")

    print(f"Extracting 13 canonical features for {len(df_tx)} transactions...")
    df_features = extract_features_from_dataframe(df_tx, df_wallets)

    X = df_features[FEATURE_NAMES].values
    y = df_features["is_fraud"].values

    from sklearn.model_selection import train_test_split

    # Stratified train/validation split (80% train, 20% validation)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    # Calculate class imbalance weighting
    pos_count = max(1, int(np.sum(y_train == 1)))
    neg_count = max(1, int(np.sum(y_train == 0)))
    scale_pos_weight = round(neg_count / pos_count, 2)

    hyperparameters = {
        "n_estimators": 150,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "scale_pos_weight": float(scale_pos_weight),
        "eval_metric": "logloss",
        "random_state": random_state
    }

    print(f"Training XGBClassifier (scale_pos_weight={scale_pos_weight})...")
    model = xgb.XGBClassifier(**hyperparameters)
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Evaluate on validation split
    y_pred_proba = model.predict_proba(X_val)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)

    precision = float(precision_score(y_val, y_pred, zero_division=0))
    recall = float(recall_score(y_val, y_pred, zero_division=0))
    f1 = float(f1_score(y_val, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_val, y_pred_proba))

    cm = confusion_matrix(y_val, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    metrics = {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        },
        "false_positives": fp,
        "false_negatives": fn
    }

    print(f"Validation Metrics: Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}, ROC-AUC={roc_auc:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

    # Persist model artifacts
    model_json_path = output_model_dir / "xgboost_risk_model.json"
    model_joblib_path = output_model_dir / "xgboost_risk_model.joblib"
    metadata_path = output_model_dir / "model_metadata.json"

    model.save_model(str(model_json_path))
    joblib.dump(model, str(model_joblib_path))

    metadata = {
        "model_name": "xgboost_risk_engine",
        "model_version": "v1.0.0",
        "algorithm": "XGBClassifier",
        "library_version": xgb.__version__,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "hyperparameters": hyperparameters,
        "metrics": metrics,
        "risk_levels": {
            "LOW": {"min": 0.00, "max": 0.35},
            "MEDIUM": {"min": 0.35, "max": 0.70},
            "HIGH": {"min": 0.70, "max": 0.88},
            "CRITICAL": {"min": 0.88, "max": 1.00}
        }
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model and metadata to {output_model_dir}")
    return metadata


if __name__ == "__main__":
    train_risk_engine()
