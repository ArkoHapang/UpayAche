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
    language: Optional[str] = Field(
        default="auto",
        description="Response language preference: 'auto', 'en', 'bn'"
    )


class FactsFromEvidence(BaseModel):
    """Empirical, immutable facts extracted directly from database and ML outputs. ZERO AI HALLUCINATION."""
    wallet_ids: List[str] = Field(default_factory=list, description="Verified wallet identifiers from database")
    transaction_ids: List[str] = Field(default_factory=list, description="Verified transaction hashes/IDs")
    amounts: List[str] = Field(default_factory=list, description="Exact transaction amounts recorded in ledger")
    timestamps: List[str] = Field(default_factory=list, description="Exact transaction/event timestamps")
    risk_signals: List[str] = Field(default_factory=list, description="Pre-computed XGBoost, Isolation Forest, and NetworkX signals")


class AIInterpretation(BaseModel):
    """Probabilistic AI reasoning and compliance guidance. Subject to analyst verification."""
    likely_explanation: str = Field(..., description="AI synthesis of the probable fraud mechanism or behavior")
    investigation_recommendation: List[str] = Field(default_factory=list, description="Advisory next steps for human investigators")


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
    facts_from_evidence: Optional[FactsFromEvidence] = Field(
        default=None,
        description="Strictly verified empirical facts (wallet IDs, tx IDs, amounts, timestamps, risk signals)"
    )
    ai_interpretation: Optional[AIInterpretation] = Field(
        default=None,
        description="AI synthesis (likely explanation, investigation recommendations)"
    )
    what_happened: Optional[str] = Field(
        default=None,
        description="Factual summary of the recorded event"
    )
    why_risky: Optional[str] = Field(
        default=None,
        description="Analytical explanation of why this activity is suspicious"
    )
    what_to_investigate_next: List[str] = Field(
        default_factory=list,
        description="Concrete, actionable investigation checklist for authorized analysts"
    )
    bangla_summary: Optional[str] = Field(
        default=None,
        description="Bangla-friendly explanation of the risk and recommended actions"
    )
    bangla_explanation: Optional[str] = Field(
        default=None,
        description="Comprehensive Bangla intelligence explanation"
    )
    advisory_label: str = Field(
        default="AI-generated investigation assistance. Verify all conclusions against the evidence. Final decisions remain with authorized analysts.",
        description="Mandatory human-in-the-loop advisory label"
    )



from app.schemas.evidence import StructuredRiskEvidence, TieredInvestigationResponse


class AIInvestigationResponse(BaseModel):
    success: bool = True
    data: GeminiInvestigationReport
    metadata: Dict[str, Any]
    structured_evidence: Optional[StructuredRiskEvidence] = None
    tiered_response: Optional[TieredInvestigationResponse] = None
