"""
UpayAche — Structured Risk Evidence and Tiered Response Schemas.
Controlled integration between XGBoost, Isolation Forest, NetworkX, SHAP, and Gemini Copilot.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SHAPContributionItem(BaseModel):
    feature: str = ""
    feature_name: Optional[str] = None
    feature_value: Optional[float] = 0.0
    contribution: float = 0.0
    shap_value: Optional[float] = None
    direction: str = "increased_risk"  # "increased_risk", "decreased_risk", "neutral"
    human_readable_explanation: Optional[str] = None
    importance: Optional[float] = None

    def model_post_init(self, __context: Any) -> None:
        if self.feature_name and not self.feature:
            self.feature = self.feature_name
        elif self.feature and not self.feature_name:
            self.feature_name = self.feature

        if self.shap_value is not None and self.contribution == 0.0:
            self.contribution = self.shap_value
        elif self.contribution != 0.0 and self.shap_value is None:
            self.shap_value = self.contribution

        if self.importance is None:
            self.importance = abs(self.contribution)

        if not self.human_readable_explanation:
            self.human_readable_explanation = f"{self.feature} has impact {self.contribution:+.3f} on risk"


class StructuredRiskEvidence(BaseModel):
    risk_score: Optional[float] = Field(None, description="Numerical transaction risk score [0.0, 1.0] from XGBoost")
    risk_level: Optional[str] = Field(None, description="Categorical risk tier (LOW, MEDIUM, HIGH, CRITICAL)")
    top_risk_features: List[str] = Field(default_factory=list, description="Top features contributing to XGBoost risk")
    shap_contributions: List[SHAPContributionItem] = Field(default_factory=list, description="SHAP feature attributions")
    anomaly_score: Optional[float] = Field(None, description="Unsupervised behavioral anomaly score [0.0, 1.0] from Isolation Forest")
    anomaly_reasons: List[str] = Field(default_factory=list, description="Behavioral anomalies tagged by Isolation Forest")
    network_signals: List[str] = Field(default_factory=list, description="Topological network signals from NetworkX")
    related_wallet_count: Optional[int] = Field(None, description="Degree / adjacent counterparty count from NetworkX")
    suspicious_connection_count: Optional[int] = Field(None, description="Count of connected suspicious or flagged nodes")
    transaction_context: Dict[str, Any] = Field(default_factory=dict, description="Safe read-only transaction attributes (no PII)")
    model_source: str = Field(
        default="Supervised XGBoost + Unsupervised Isolation Forest + NetworkX Multigraph + SHAP TreeExplainer"
    )


class ModelResultTier(BaseModel):
    risk_score: Optional[float] = None
    risk_level: Optional[str] = "Unavailable"
    anomaly_score: Optional[float] = None
    anomaly_level: Optional[str] = "Unavailable"
    primary_model: str = "XGBoost v1.2"
    scoring_engine: Optional[str] = None
    anomaly_model: str = "Isolation Forest"
    anomaly_engine: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.scoring_engine:
            self.scoring_engine = self.primary_model
        if not self.anomaly_engine:
            self.anomaly_engine = self.anomaly_model


class EvidenceTier(BaseModel):
    transaction_context: Dict[str, Any] = Field(default_factory=dict)
    top_risk_features: List[str] = Field(default_factory=list)
    shap_contributions: List[SHAPContributionItem] = Field(default_factory=list)
    anomaly_reasons: List[str] = Field(default_factory=list)
    network_signals: List[str] = Field(default_factory=list)
    related_wallet_count: Optional[int] = None
    suspicious_connection_count: Optional[int] = None


class AIExplanationTier(BaseModel):
    executive_summary: str
    typology_hypothesis: str
    confidence_level: str
    risk_breakdown: str
    anomaly_explanation: str
    network_explanation: str
    investigation_guidance: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    narrative_explanation: Optional[str] = None
    investigator_checklist: List[str] = Field(default_factory=list)

    def model_post_init(self, __context: Any) -> None:
        if not self.narrative_explanation:
            self.narrative_explanation = self.executive_summary
        if not self.investigator_checklist:
            self.investigator_checklist = self.investigation_guidance or self.recommended_actions


class TieredInvestigationResponse(BaseModel):
    model_result: ModelResultTier
    evidence: EvidenceTier
    ai_explanation: AIExplanationTier
