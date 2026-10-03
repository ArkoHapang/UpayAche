"""
UpayAche — SHAP Model Explainability Engine.
Computes exact Shapley feature attributions (SHAP values) using TreeExplainer
for XGBoost transaction risk classification, converting mathematical attributions
into safe, structured, and auditable human-readable explanations.
"""

from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np
import shap
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent

from ml.features import FEATURE_NAMES, compute_features_from_context
from ml.prediction import RiskPredictionService, get_risk_prediction_service


class FeatureContribution(BaseModel):
    """Structured attribution for a single feature."""
    feature: str
    feature_value: float
    contribution: float # Rounded SHAP value (log-odds / margin contribution)
    direction: str # "increased_risk", "decreased_risk", or "neutral"
    human_readable_explanation: str


class TransactionExplanation(BaseModel):
    """Complete SHAP explainability response contract."""
    risk_score: float
    risk_level: str
    prediction: int
    base_value: float # Expected model baseline
    top_contributing_features: List[FeatureContribution]
    all_contributions: List[FeatureContribution]
    summary_narrative: str
    model_version: str
    timestamp: str


def generate_feature_explanation(
    feature: str,
    val: float,
    shap_val: float,
    direction: str
) -> str:
    """
    Deterministically generate human-readable explanations directly grounded
    in the exact feature name, feature value, and SHAP attribution direction.
    Never hallucinates or invents arbitrary explanations.
    """
    if direction == "increased_risk":
        if feature == "amount":
            return f"Transaction amount of BDT {val:,.2f} significantly increases risk above standard baseline thresholds."
        elif feature == "amount_deviation":
            return f"Amount deviation of {val:.1f}x from historical baseline indicates an anomalous spending spike, increasing risk."
        elif feature == "new_device":
            return "Transaction originated from an unrecognized hardware device/terminal, strongly increasing takeover risk."
        elif feature == "device_change":
            return "Sudden hardware device switch detected compared to the previous active session, increasing risk."
        elif feature == "new_recipient":
            return "Funds transferred to a previously unseen recipient wallet, increasing risk."
        elif feature == "recipient_risk":
            return f"Recipient wallet has an elevated risk score ({val:.2f}) or mule association, strongly increasing risk."
        elif feature == "velocity_5min":
            return f"Rapid burst of {int(val)} transactions executed within trailing 5 minutes indicates an automated velocity storm, increasing risk."
        elif feature == "velocity_1hour":
            return f"High volume of {int(val)} transactions executed within the past hour indicates aggressive fund movement, increasing risk."
        elif feature == "velocity_24hour":
            return f"Elevated 24-hour transaction count of {int(val)} transfers, increasing risk."
        elif feature == "transaction_hour":
            return f"Transaction executed at {int(val):02d}:00 during nocturnal dead hours (01:00–05:00), increasing risk."
        elif feature == "location_change":
            return "Transaction location shifted away from the sender's registered home region, increasing risk."
        elif feature == "transaction_frequency":
            return f"Elevated 24-hour transaction frequency ({int(val)} transactions), increasing risk."
        elif feature == "average_transaction_amount":
            return f"Sender's historical average amount is BDT {val:,.2f}, which contrasts with current spending pattern."
        else:
            return f"Feature '{feature}' ({val}) increased risk by +{abs(shap_val):.4f} log-odds."

    elif direction == "decreased_risk":
        if feature == "amount":
            return f"Modest transaction amount of BDT {val:,.2f} aligns with typical consumer habits, reducing risk."
        elif feature == "amount_deviation":
            return "Transaction amount closely conforms to the sender's historical spending baseline, reducing risk."
        elif feature == "new_device":
            return "Transaction originated from the sender's verified primary registered device, reducing risk."
        elif feature == "device_change":
            return "Consistent hardware device utilized across sessions, reducing risk."
        elif feature == "new_recipient":
            return "Transfer sent to a known, established counterparty, reducing risk."
        elif feature == "recipient_risk":
            return "Recipient wallet is in good standing with a low risk tier, reducing risk."
        elif feature == "velocity_5min":
            return "Low transaction velocity in the trailing 5 minutes, reducing risk."
        elif feature == "velocity_1hour":
            return "Normal hourly transaction frequency, reducing risk."
        elif feature == "velocity_24hour":
            return "Daily transaction count is within normal limits, reducing risk."
        elif feature == "transaction_hour":
            return f"Transaction executed during regular daytime business hours ({int(val):02d}:00), reducing risk."
        elif feature == "location_change":
            return "Transaction initiated from the sender's registered home location, reducing risk."
        elif feature == "transaction_frequency":
            return "Normal transaction frequency, reducing risk."
        elif feature == "average_transaction_amount":
            return f"Typical historical baseline amount (BDT {val:,.2f}) supports regular consumer usage."
        else:
            return f"Feature '{feature}' ({val}) reduced risk by -{abs(shap_val):.4f} log-odds."

    else:
        return f"Feature '{feature}' has neutral impact on the decision."


class RiskExplainabilityService:
    """
    Service generating local SHAP feature attributions and structured explanations
    for transactions evaluated by the XGBoost Risk Engine.
    """

    def __init__(self, risk_service: Optional[RiskPredictionService] = None):
        self.risk_service = risk_service or get_risk_prediction_service()
        self.model = self.risk_service.model
        self.explainer = shap.TreeExplainer(self.model, model_output="raw")
        # Warm up explainer with a dummy input to calibrate the exact tree-path base expected value
        dummy_x = np.zeros((1, len(FEATURE_NAMES)), dtype=np.float32)
        self.explainer.shap_values(dummy_x)
        if np.isscalar(self.explainer.expected_value):
            self.base_value = float(self.explainer.expected_value)
        else:
            ev = np.array(self.explainer.expected_value).flatten()
            self.base_value = float(ev[1] if len(ev) > 1 else ev[0])

    def explain_features(
        self,
        features: Dict[str, Any],
        top_k: int = 5
    ) -> TransactionExplanation:
        """
        Explain a pre-computed 13-feature vector using TreeExplainer.
        """
        pred_res = self.risk_service.predict_features(features)

        vector = [float(features[feat]) for feat in FEATURE_NAMES]
        X = np.array([vector], dtype=np.float32)

        # Compute SHAP values
        raw_shap = self.explainer.shap_values(X)
        if isinstance(raw_shap, list) and len(raw_shap) > 1:
            shap_values = raw_shap[1][0] # Positive class for binary
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            shap_values = raw_shap[0, :, 1]
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 2:
            shap_values = raw_shap[0]
        else:
            shap_values = np.array(raw_shap).flatten()

        all_contributions: List[FeatureContribution] = []
        for feat, val, s_val in zip(FEATURE_NAMES, vector, shap_values):
            contribution = round(float(s_val), 4)
            if contribution > 0.001:
                direction = "increased_risk"
            elif contribution < -0.001:
                direction = "decreased_risk"
            else:
                direction = "neutral"

            expl = generate_feature_explanation(feat, val, contribution, direction)

            all_contributions.append(FeatureContribution(
                feature=feat,
                feature_value=round(val, 2),
                contribution=contribution,
                direction=direction,
                human_readable_explanation=expl
            ))

        # Sort top K features by absolute magnitude
        sorted_contributions = sorted(all_contributions, key=lambda c: abs(c.contribution), reverse=True)
        top_k_contributions = sorted_contributions[:top_k]

        # Synthesize concise narrative
        risk_level = pred_res["risk_level"]
        risk_score = pred_res["risk_score"]
        positives = [c for c in top_k_contributions if c.direction == "increased_risk"]
        negatives = [c for c in top_k_contributions if c.direction == "decreased_risk"]

        if positives:
            pos_str = ", ".join(f"{c.feature} (+{c.contribution:.2f})" for c in positives[:3])
            narrative = f"Transaction scored {risk_score:.4f} ({risk_level}). Primary risk drivers: {pos_str}."
        elif negatives:
            neg_str = ", ".join(f"{c.feature} ({c.contribution:.2f})" for c in negatives[:3])
            narrative = f"Transaction scored {risk_score:.4f} ({risk_level}). Benign usage supported by: {neg_str}."
        else:
            narrative = f"Transaction scored {risk_score:.4f} ({risk_level}). Low risk across baseline features."

        return TransactionExplanation(
            risk_score=risk_score,
            risk_level=risk_level,
            prediction=pred_res["prediction"],
            base_value=round(self.base_value, 4),
            top_contributing_features=top_k_contributions,
            all_contributions=sorted_contributions,
            summary_narrative=narrative,
            model_version=pred_res["model_version"],
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    def explain_transaction(
        self,
        amount: float,
        timestamp: datetime,
        sender_history: Optional[Dict[str, Any]] = None,
        receiver_profile: Optional[Dict[str, Any]] = None,
        tx_device_id: Optional[str] = "dev-primary",
        tx_location_id: Optional[str] = "loc-primary",
        recent_transactions: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 5
    ) -> TransactionExplanation:
        """
        Explain a transaction directly from raw contextual data.
        """
        features = compute_features_from_context(
            amount=amount,
            timestamp=timestamp,
            sender_history=sender_history or {},
            receiver_profile=receiver_profile or {},
            tx_device_id=tx_device_id,
            tx_location_id=tx_location_id,
            recent_transactions=recent_transactions
        )

        return self.explain_features(features, top_k=top_k)


_explainability_instance: Optional[RiskExplainabilityService] = None

def get_risk_explainability_service() -> RiskExplainabilityService:
    """Retrieve or initialize global RiskExplainabilityService singleton."""
    global _explainability_instance
    if _explainability_instance is None:
        _explainability_instance = RiskExplainabilityService()
    return _explainability_instance
