"""
UpayAche — Risk & Explainability API Request & Response Schemas.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class TransactionRiskRequest(BaseModel):
    """Payload to evaluate and explain transaction risk."""
    amount: Optional[float] = Field(None, description="Transaction amount in BDT", gt=0)
    timestamp: Optional[str] = Field(None, description="ISO-8601 transaction timestamp")
    sender_history: Optional[Dict[str, Any]] = Field(default_factory=dict)
    receiver_profile: Optional[Dict[str, Any]] = Field(default_factory=dict)
    tx_device_id: Optional[str] = Field("dev-primary", description="Device ID used for transaction")
    tx_location_id: Optional[str] = Field("loc-primary", description="Location ID of transaction")
    recent_transactions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    features: Optional[Dict[str, float]] = Field(None, description="Pre-computed 13-feature vector")
    top_k: int = Field(5, ge=1, le=13, description="Number of top SHAP features to return")


class RiskScoreResponse(BaseModel):
    """Standardized risk scoring response."""
    risk_score: float
    risk_level: str
    prediction: int
    model_version: str
    timestamp: str


class RiskSummaryResponse(BaseModel):
    total_analyzed: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    total_fraud_flagged: int
    average_risk_score: float
    fraud_rate_pct: float


class HighRiskTransactionItem(BaseModel):
    id: str
    tx_hash: Optional[str] = None
    amount: float
    tx_type: str
    timestamp: str
    risk_score: float
    risk_level: str
    is_fraud: int
    pattern_name: Optional[str] = None


class HighRiskTransactionsResponse(BaseModel):
    items: List[HighRiskTransactionItem]
    total: int


class RiskTrendsPoint(BaseModel):
    period: str
    transaction_count: int
    high_risk_count: int
    average_risk: float
    total_amount_bdt: float


class RiskTrendsResponse(BaseModel):
    timeframe: str
    points: List[RiskTrendsPoint]


class RiskDetailResponse(BaseModel):
    transaction_id: str
    risk_score: float
    risk_level: str
    prediction: int
    anomaly_score: float
    is_anomaly: int
    base_value: float
    top_contributing_features: List[Dict[str, Any]]
    summary_narrative: str
    model_version: str
    timestamp: str


class ModelStatusResponse(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    trained_at: str
    train_samples: int
    val_samples: int
    precision: float
    recall: float
    f1: float
    roc_auc: float
    is_synthetic_evaluation: bool = True

