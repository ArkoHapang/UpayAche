"""
UpayAche — Investigation Cases & Notes Schemas.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class InvestigationNoteCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Analyst note or findings")
    note_type: str = Field(default="ANALYST", description="ANALYST, AI_COPILOT, or SYSTEM")


class InvestigationNoteResponse(BaseModel):
    id: str
    case_id: str
    author_id: str
    author_role: str
    content: str
    note_type: str
    created_at: str


class InvestigationCaseCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Descriptive case title")
    description: str = Field(..., description="Background rationale or alert details")
    target_wallet_id: str = Field(..., description="Primary wallet under investigation")
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, or CRITICAL")
    primary_transaction_id: Optional[str] = Field(default=None, description="Triggering transaction ID")


class InvestigationCaseUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Target state: OPEN, INVESTIGATING, REVIEWED, CLOSED")
    resolution: Optional[str] = Field(None, description="PENDING, CONFIRMED_FRAUD, FALSE_POSITIVE, SUSPICIOUS_MONITOR")
    assigned_to: Optional[str] = Field(None, description="Assigned analyst ID or name")
    analyst_comment: Optional[str] = Field(None, description="Audit note recording reason for transition")


class InvestigationCaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    description: str
    status: str
    priority: str
    resolution: str
    assigned_to: Optional[str] = None
    target_wallet_id: Optional[str] = None
    primary_transaction_id: Optional[str] = None
    created_at: str
    updated_at: str
    closed_at: Optional[str] = None
    notes: List[InvestigationNoteResponse] = []


class InvestigationListResponse(BaseModel):
    items: List[InvestigationCaseResponse]
    total: int
