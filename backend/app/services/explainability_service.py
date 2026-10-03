"""
UpayAche — Backend Explainability Service Integration.
Wraps the ML SHAP Explainability Engine into the FastAPI dependency injection layer.
"""

from ml.explainability import (
    RiskExplainabilityService,
    get_risk_explainability_service,
    TransactionExplanation,
    FeatureContribution
)

__all__ = [
    "RiskExplainabilityService",
    "get_risk_explainability_service",
    "TransactionExplanation",
    "FeatureContribution"
]
