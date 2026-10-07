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


class CompositeRiskContribution(BaseModel):
    supervised_score: float = Field(..., description="Supervised XGBoost fraud probability [0.0, 1.0]")
    supervised_weight: float = Field(0.50, description="Weight of supervised model in composite score")
    anomaly_score: float = Field(..., description="Unsupervised Isolation Forest anomaly score [0.0, 1.0]")
    anomaly_weight: float = Field(0.25, description="Weight of behavioral anomaly in composite score")
    graph_score: float = Field(..., description="Topological network graph risk score [0.0, 1.0]")
    graph_weight: float = Field(0.25, description="Weight of graph intelligence in composite score")
    composite_score: float = Field(..., description="Weighted composite risk score [0.0, 1.0]")
    alert_threshold: float = Field(0.65, description="Composite alert threshold")
    threshold_crossed: bool = Field(False, description="Whether composite score exceeds alert threshold")
    threshold_reason: str = Field(..., description="Clear explanation of why transaction crossed or stayed below threshold")
    shap_scope_notice: str = Field(
        default="Notice: SHAP feature attributions explain the supervised XGBoost model specifically. The composite risk integrates XGBoost, Isolation Forest anomaly, and NetworkX topological signals.",
        description="Clarification that SHAP explains XGBoost, not the whole composite"
    )


class BangladeshMFSIntelligence(BaseModel):
    typology_code: str = Field(..., description="Canonical typology identifier")
    typology_name: str = Field(..., description="English typology name")
    typology_name_bn: str = Field(..., description="Bengali typology name")
    what_happened: str = Field(..., description="Objective transaction sequence facts")
    why_risky: str = Field(..., description="Financial crime and velocity risk rationale")
    what_to_investigate_next: List[str] = Field(default_factory=list, description="Actionable checklist for compliance analyst")
    bangla_summary: str = Field(..., description="Bangla language explanation for local operations")
    evidence_features: List[str] = Field(
        default_factory=list,
        description="Extracted evidence features explaining why scenario was generated"
    )
    responsible_ai_disclaimer: str = Field(
        default="ঝুঁকি সতর্কতা: এটি একটি তদন্তমূলক সংকেত (Risk Signal), নিশ্চিত জালিয়াতি নয় (Not Confirmed Fraud)। মানুষের সিদ্ধান্তই চূড়ান্ত।",
        description="Responsible AI and false-positive caveat in Bangla"
    )



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
    composite_breakdown: Optional[CompositeRiskContribution] = None
    mfs_intelligence: Optional[BangladeshMFSIntelligence] = None
    risk_change_reason: Optional[str] = None
    responsible_ai_notice: Optional[str] = (
        "RISK SIGNAL != CONFIRMED FRAUD: Advisory investigation signal for analyst triage only. "
        "False positives are possible. Final decision remains with human compliance analyst."
    )


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

