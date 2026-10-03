"""
UpayAche — Analytics & Model Evaluation Schemas.
Enforces typed contracts for ML model telemetry and system investigation performance.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ConfusionMatrixData(BaseModel):
    true_positives: int = Field(..., description="Correctly identified fraud/anomaly cases")
    false_positives: int = Field(..., description="Legitimate cases mistakenly flagged")
    true_negatives: int = Field(..., description="Correctly identified normal transactions")
    false_negatives: int = Field(..., description="Fraud/anomaly cases missed by the model")


class ModelPerformanceItem(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    model_type: str = Field(..., description="SUPERVISED_CLASSIFIER or UNSUPERVISED_ANOMALY")
    trained_at: str
    train_samples: int
    val_samples: int
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    false_positive_rate: float
    false_negative_rate: float
    confusion_matrix: ConfusionMatrixData
    pattern_breakdown: Optional[Dict[str, Any]] = None
    is_synthetic_evaluation: bool = True


class RiskDistributionItem(BaseModel):
    tier: str
    count: int
    percentage: float
    min_score: float
    max_score: float


class AnomalyDistributionItem(BaseModel):
    category: str
    count: int
    percentage: float
    mean_score: float


class ModelsAnalyticsResponse(BaseModel):
    models: List[ModelPerformanceItem]
    risk_distribution: List[RiskDistributionItem]
    anomaly_distribution: List[AnomalyDistributionItem]
    active_version: str
    evaluation_notice: str = "Synthetic hackathon prototype — metrics do not represent real-world MFS performance."


class SystemAnalyticsResponse(BaseModel):
    transactions_analyzed: int
    alerts_generated: int
    investigations_created: int
    investigations_closed: int
    investigations_open: int
    investigations_in_progress: int
    investigations_reviewed: int
    average_investigation_time_minutes: float
    total_volume_analyzed_bdt: float
    alert_rate_pct: float
    resolution_rate_pct: float
    evaluation_notice: str = "Synthetic hackathon prototype — metrics do not represent real-world MFS performance."
