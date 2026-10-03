"""
UpayAche — Guarded AI Copilot Schemas.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


class AIInvestigationRequest(BaseModel):
    case_id: str = Field(..., description="ID of the investigation case to evaluate")
    focus_area: Optional[str] = Field(
        default="MULE_STRUCTURING_ANALYSIS",
        description="Focus of intelligence synthesis"
    )
    question: Optional[str] = Field(
        default=None,
        description="Optional analyst investigation prompt or suggested question"
    )


class GeminiInvestigationReport(BaseModel):
    executive_summary: str = Field(
        ...,
        description="Concise 2-3 sentence executive summary explaining risk."
    )
    summary: Optional[str] = Field(
        default=None,
        description="Targeted response summary answering the analyst inquiry."
    )
    typology_hypothesis: str = Field(
        ...,
        description="Identified MFS scam typology."
    )
    confidence_level: Literal["LOW", "MEDIUM", "HIGH"]
    key_suspicious_indicators: List[str] = Field(
        ...,
        description="Empirical flags directly cited from structured evidence."
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Factual evidence items drawn strictly from database records."
    )
    relevant_risk_factors: List[str] = Field(
        default_factory=list,
        description="Top contributing ML and behavioral risk factors."
    )
    relevant_network_information: List[str] = Field(
        default_factory=list,
        description="Network topology facts, counterparty degree, and clustering."
    )
    suggested_investigation_questions: List[str] = Field(
        default_factory=list,
        description="Recommended follow-up questions for the analyst."
    )
    recommended_actions: List[str] = Field(
        ...,
        description="Human compliance recommendations."
    )



from app.schemas.evidence import StructuredRiskEvidence, TieredInvestigationResponse


class AIInvestigationResponse(BaseModel):
    success: bool = True
    data: GeminiInvestigationReport
    metadata: Dict[str, Any]
    structured_evidence: Optional[StructuredRiskEvidence] = None
    tiered_response: Optional[TieredInvestigationResponse] = None
