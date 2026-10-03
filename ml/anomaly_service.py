"""
UpayAche — Behavioral Anomaly Detection Service.
Production unsupervised inference service using Isolation Forest.
Detects statistical behavioral anomalies (unusual amounts, nocturnal activity,
device novelty, location shifts, frequency surges) without relying on fraud labels.
Outputs standardized anomaly scores, anomaly classifications, and metadata contracts.
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
import joblib
import numpy as np

# Ensure project root in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent

from ml.anomaly_features import ANOMALY_FEATURE_NAMES, compute_behavioral_features


class BehavioralAnomalyService:
    """
    Production-grade Unsupervised Isolation Forest Behavioral Anomaly Service.
    Loads persisted Isolation Forest model and metadata, performs input validation,
    and produces standardized anomaly outputs separate from supervised fraud classification.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        metadata_path: Optional[Union[str, Path]] = None
    ):
        base_dir = PROJECT_ROOT / "ml" / "models"
        self.model_path = Path(model_path) if model_path else (base_dir / "isolation_forest_model.joblib")
        self.metadata_path = Path(metadata_path) if metadata_path else (base_dir / "anomaly_metadata.json")
        self.model = None
        self.metadata = {}
        self.model_version = "v1.0.0"

        self._load_model_and_metadata()

    def _load_model_and_metadata(self) -> None:
        """Load persisted Isolation Forest model and anomaly metadata."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained Isolation Forest model artifact not found at {self.model_path}. "
                "Ensure ml/training/train_anomaly.py has been executed."
            )

        self.model = joblib.load(str(self.model_path))

        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("model_version", "v1.0.0")
            except Exception:
                self.model_version = "v1.0.0"

    def predict_anomaly_features(
        self,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Score a pre-computed 11-feature behavioral dictionary.
        Validates presence and validity of all required behavioral features.
        """
        if not isinstance(features, dict):
            raise ValueError(f"Features must be a dictionary, got {type(features)}")

        vector = []
        for feat in ANOMALY_FEATURE_NAMES:
            if feat not in features:
                raise ValueError(f"Missing required behavioral feature: '{feat}'")
            val = features[feat]
            if val is None or not isinstance(val, (int, float, np.number)) or np.isnan(val):
                raise ValueError(f"Behavioral feature '{feat}' must be a valid number, got {val}")
            if feat == "amount" and val <= 0:
                raise ValueError(f"Feature 'amount' must be positive, got {val}")
            if feat == "transaction_hour" and not (0 <= val <= 23):
                raise ValueError(f"Feature 'transaction_hour' must be between 0 and 23, got {val}")
            if feat in ("velocity_5min", "velocity_1hour", "transaction_frequency") and val < 0:
                raise ValueError(f"Feature '{feat}' cannot be negative, got {val}")
            vector.append(float(val))

        X = np.array([vector], dtype=np.float32)

        # In Isolation Forest:
        # decision_function: positive values denote inliers, negative values denote outliers.
        dfunc = float(self.model.decision_function(X)[0])

        # Calibrated continuous anomaly score in [0.0, 1.0]
        # Boundary: dfunc == 0.0 -> score = 0.50
        # Inlier: dfunc > 0.0 -> score < 0.50
        # Outlier: dfunc < 0.0 -> score > 0.50
        raw_score = 0.5 - (dfunc / 0.5)
        anomaly_score = round(float(np.clip(raw_score, 0.0, 1.0)), 4)

        # Classification decision: is_anomaly is 1 if score >= 0.50 (or raw predict == -1)
        is_anomaly = 1 if anomaly_score >= 0.50 else 0
        now_ts = datetime.now(timezone.utc).isoformat()

        return {
            "anomaly_score": anomaly_score,
            "is_anomaly": is_anomaly,
            "model_version": self.model_version,
            "timestamp": now_ts
        }

    predict_features = predict_anomaly_features

    def predict_anomaly_transaction(
        self,
        amount: float,
        timestamp: datetime,
        sender_history: Optional[Dict[str, Any]] = None,
        receiver_profile: Optional[Dict[str, Any]] = None,
        tx_device_id: Optional[str] = "dev-primary",
        tx_location_id: Optional[str] = "loc-primary",
        recent_transactions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Score a transaction for behavioral anomalies from raw transaction context.
        """
        features = compute_behavioral_features(
            amount=amount,
            timestamp=timestamp,
            sender_history=sender_history,
            receiver_profile=receiver_profile,
            tx_device_id=tx_device_id,
            tx_location_id=tx_location_id,
            recent_transactions=recent_transactions
        )

        result = self.predict_anomaly_features(features)
        result["features"] = features
        return result

    def predict(
        self,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Polymorphic interface: accepts either an 11-feature dict or transaction context.
        """
        if not isinstance(payload, dict):
            raise ValueError(f"Payload must be a dictionary, got {type(payload)}")

        if all(f in payload for f in ANOMALY_FEATURE_NAMES):
            return self.predict_anomaly_features(payload)

        if "amount" not in payload:
            raise ValueError("Payload missing required 'amount' field")

        amount = payload.get("amount")
        ts = payload.get("timestamp")
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        elif not isinstance(ts, datetime):
            ts = datetime.now(timezone.utc)

        return self.predict_anomaly_transaction(
            amount=amount,
            timestamp=ts,
            sender_history=payload.get("sender_history"),
            receiver_profile=payload.get("receiver_profile"),
            tx_device_id=payload.get("tx_device_id", "dev-primary"),
            tx_location_id=payload.get("tx_location_id", "loc-primary"),
            recent_transactions=payload.get("recent_transactions")
        )


_anomaly_service_instance: Optional[BehavioralAnomalyService] = None

def get_behavioral_anomaly_service() -> BehavioralAnomalyService:
    """Retrieve or initialize the global singleton BehavioralAnomalyService."""
    global _anomaly_service_instance
    if _anomaly_service_instance is None:
        _anomaly_service_instance = BehavioralAnomalyService()
    return _anomaly_service_instance
