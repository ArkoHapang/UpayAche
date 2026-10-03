"""
UpayAche — ML Risk Prediction Service.
Production inference service using XGBoost for transaction risk classification.
Outputs standardized risk scores, risk levels, and prediction contracts.
"""

import os
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
import joblib
import numpy as np

# Ensure project root in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent

from ml.features import FEATURE_NAMES, compute_features_from_context


# Canonical risk level threshold mapping
RISK_LEVEL_THRESHOLDS = {
    "LOW": (0.00, 0.35),
    "MEDIUM": (0.35, 0.70),
    "HIGH": (0.70, 0.88),
    "CRITICAL": (0.88, 1.00)
}


class RiskPredictionService:
    """
    Production-grade XGBoost Risk Prediction Service for UpayAche MFS transactions.
    Loads persisted model and metadata, performs input validation, and produces
    standardized prediction outputs.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        metadata_path: Optional[Union[str, Path]] = None
    ):
        base_dir = PROJECT_ROOT / "ml" / "models"
        self.model_path = Path(model_path) if model_path else (base_dir / "xgboost_risk_model.joblib")
        self.metadata_path = Path(metadata_path) if metadata_path else (base_dir / "model_metadata.json")
        self.model = None
        self.metadata = {}
        self.model_version = "v1.0.0"

        self._load_model_and_metadata()

    def _load_model_and_metadata(self) -> None:
        """Load XGBoost model and configuration metadata."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained model artifact not found at {self.model_path}. "
                "Ensure ml/training/train.py has been executed."
            )

        self.model = joblib.load(str(self.model_path))

        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("model_version", "v1.0.0")
            except Exception:
                self.model_version = "v1.0.0"

    def map_risk_level(self, risk_score: float) -> str:
        """
        Map a continuous risk score [0.0, 1.0] to a categorical risk level:
        - [0.00, 0.35) -> LOW
        - [0.35, 0.70) -> MEDIUM
        - [0.70, 0.88) -> HIGH
        - [0.88, 1.00] -> CRITICAL
        """
        score = max(0.0, min(1.0, float(risk_score)))
        if score < 0.35:
            return "LOW"
        elif score < 0.70:
            return "MEDIUM"
        elif score < 0.88:
            return "HIGH"
        else:
            return "CRITICAL"

    def predict_features(
        self,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Score a pre-computed 13-feature dictionary.
        Validates that all required feature keys are present and numeric.
        """
        if not isinstance(features, dict):
            raise ValueError(f"Features must be a dictionary, got {type(features)}")

        # Validate presence and validity of all 13 canonical features
        vector = []
        for feat in FEATURE_NAMES:
            if feat not in features:
                raise ValueError(f"Missing required feature: '{feat}'")
            val = features[feat]
            if val is None or not isinstance(val, (int, float, np.number)) or np.isnan(val):
                raise ValueError(f"Feature '{feat}' must be a valid number, got {val}")
            # Feature-specific range bounds
            if feat == "amount" and val <= 0:
                raise ValueError(f"Feature 'amount' must be positive, got {val}")
            if feat == "transaction_hour" and not (0 <= val <= 23):
                raise ValueError(f"Feature 'transaction_hour' must be between 0 and 23, got {val}")
            if feat in ("velocity_5min", "velocity_1hour", "velocity_24hour") and val < 0:
                raise ValueError(f"Feature '{feat}' cannot be negative, got {val}")
            vector.append(float(val))

        X = np.array([vector], dtype=np.float32)

        # Run model inference
        proba = self.model.predict_proba(X)[0]
        # Class 1 probability = fraud/risk probability
        risk_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
        risk_score = round(max(0.0, min(1.0, risk_score)), 4)

        risk_level = self.map_risk_level(risk_score)
        prediction = 1 if risk_score >= 0.50 else 0
        now_ts = datetime.now(timezone.utc).isoformat()

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "prediction": prediction,
            "model_version": self.model_version,
            "timestamp": now_ts
        }

    def predict_transaction(
        self,
        amount: float,
        timestamp: datetime,
        sender_history: Optional[Dict[str, Any]] = None,
        receiver_profile: Optional[Dict[str, Any]] = None,
        tx_device_id: Optional[str] = "dev-primary",
        tx_location_id: Optional[str] = "loc-dhaka",
        recent_transactions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Score a transaction from raw contextual inputs.
        Extracts the 13 canonical features and returns prediction contract.
        """
        sender_hist = sender_history or {}
        receiver_prof = receiver_profile or {}

        # compute_features_from_context validates amount and timestamp
        features = compute_features_from_context(
            amount=amount,
            timestamp=timestamp,
            sender_history=sender_hist,
            receiver_profile=receiver_prof,
            tx_device_id=tx_device_id,
            tx_location_id=tx_location_id,
            recent_transactions=recent_transactions
        )

        result = self.predict_features(features)
        # Attach feature breakdown for observability/explainability
        result["features"] = features
        return result

    def predict(
        self,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Polymorphic prediction method: accepts either a 13-feature dict or transaction context.
        """
        if not isinstance(payload, dict):
            raise ValueError(f"Payload must be a dictionary, got {type(payload)}")

        # If all 13 features are directly in payload
        if all(f in payload for f in FEATURE_NAMES):
            return self.predict_features(payload)

        # Otherwise extract from transaction context
        if "amount" not in payload:
            raise ValueError("Payload missing required 'amount' field")
        
        amount = payload.get("amount")
        ts = payload.get("timestamp")
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        elif not isinstance(ts, datetime):
            ts = datetime.now(timezone.utc)

        return self.predict_transaction(
            amount=amount,
            timestamp=ts,
            sender_history=payload.get("sender_history"),
            receiver_profile=payload.get("receiver_profile"),
            tx_device_id=payload.get("tx_device_id", "dev-primary"),
            tx_location_id=payload.get("tx_location_id", "loc-primary"),
            recent_transactions=payload.get("recent_transactions")
        )


# Global singleton instance for app-wide reuse
_service_instance: Optional[RiskPredictionService] = None

def get_risk_prediction_service() -> RiskPredictionService:
    """Retrieve or initialize the global singleton RiskPredictionService."""
    global _service_instance
    if _service_instance is None:
        _service_instance = RiskPredictionService()
    return _service_instance
