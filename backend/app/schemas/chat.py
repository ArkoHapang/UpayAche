"""
UpayAche — Customer Risk Intelligence Chatbot Schemas.
Data contracts for RAG retrieval, chat messages, sessions, citations, and feedback.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:  # type: ignore
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return {k: (v.model_dump() if hasattr(v, "model_dump") else v) for k, v in self.__dict__.items()}
        def dict(self):
            return self.model_dump()

    def Field(default=None, **kwargs):  # type: ignore
        return default



class ChatCitation(BaseModel):
    document_id: str
    title: str
    source: str
    category: str
    snippet: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)


from app.schemas.evidence import StructuredRiskEvidence, TieredInvestigationResponse


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500, description="User question in English, Bangla, or Banglish")
    session_id: Optional[str] = Field(None, description="Existing chat session UUID if continuing conversation")
    category_filter: Optional[str] = Field(None, description="Optional category filter: TRANSACTION_RISK, SCAM_AWARENESS, ACCOUNT_SECURITY, etc.")
    language: Optional[str] = Field("auto", description="Preferred response language: auto, en, bn, banglish")


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str = "assistant"
    content: str
    citations: List[ChatCitation] = Field(default_factory=list)
    confidence_tier: str = Field(..., description="HIGH, MEDIUM, or LOW confidence based on retrieved knowledge")
    disclaimer: str = Field(
        default="UpayAche AI Assistant is an educational AI risk intelligence copilot for the DIU CPC × upay AI Hackathon 2026 prototype. Not official upay customer support.",
        description="Mandatory disclaimer affirming prototype scope"
    )
    suggested_actions: List[str] = Field(default_factory=list)
    created_at: str
    structured_evidence: Optional[StructuredRiskEvidence] = None
    tiered_response: Optional[TieredInvestigationResponse] = None


class ChatSessionItem(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionItem]


class ChatHistoryResponse(BaseModel):
    session_id: str
    title: str
    messages: List[Dict[str, Any]]


class ChatFeedbackRequest(BaseModel):
    message_id: str
    rating: int = Field(..., description="1 for positive (helpful), -1 for negative (unhelpful)")
    feedback_text: Optional[str] = Field(None, max_length=500)


class ChatFeedbackResponse(BaseModel):
    id: str
    message_id: str
    rating: int
    status: str = "RECORDED"


class KnowledgeTopic(BaseModel):
    category: str
    label: str
    description: str
    suggested_prompts: List[str]


class ChatSessionDeleteResponse(BaseModel):
    status: str = "DELETED"
    session_id: str


class KnowledgeArticleItem(BaseModel):
    id: str
    title: str
    source: str
    category: str
    language: str = "en"
    version: str = "v1.0"
    content: str
    updated_at: str = "2026-10-01"
    provenance_type: str = "PROTOTYPE"
    metadata: Optional[Dict[str, Any]] = None


class KnowledgeListResponse(BaseModel):
    items: List[KnowledgeArticleItem]
    total: int

