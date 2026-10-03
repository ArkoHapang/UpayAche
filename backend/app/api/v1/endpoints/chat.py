"""
UpayAche — Customer Risk Intelligence Chatbot Endpoints.
Public & Authenticated REST API for RAG-grounded customer assistance.

Base URL: /api/v1/chat
Endpoints:
- POST   /api/v1/chat/message
- GET    /api/v1/chat/sessions
- GET    /api/v1/chat/sessions/{session_id}
- DELETE /api/v1/chat/sessions/{session_id}
- POST   /api/v1/chat/feedback
- GET    /api/v1/chat/topics
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header

from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionListResponse,
    ChatHistoryResponse,
    ChatFeedbackRequest,
    ChatFeedbackResponse,
    ChatSessionDeleteResponse,
    KnowledgeTopic,
    KnowledgeArticleItem,
    KnowledgeListResponse
)
from app.services.chat_service import ChatService, get_chat_service
from app.knowledge.data import get_all_knowledge_documents
from app.services.rag_service import get_rag_service

from app.core.security import CurrentUser, get_optional_current_user

router = APIRouter(prefix="/chat", tags=["Customer Risk Intelligence Chatbot"])


@router.post(
    "/message",
    response_model=ChatMessageResponse,
    summary="Send Question to UpayAche AI Assistant",
    description=(
        "Executes 10-step grounded RAG pipeline: input validation, rate limiting, "
        "user identification, question classification, pgvector retrieval, safe read-only "
        "risk lookup, prompt injection protection, answer synthesis, and immutable audit logging."
    )
)
async def send_chat_message(
    req: ChatMessageRequest,
    request: Request,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    service: ChatService = Depends(get_chat_service)
) -> ChatMessageResponse:
    client_ip = request.client.host if request.client else "127.0.0.1"
    actor_id = current_user.id if current_user else "anon-user"
    actor_role = current_user.role if current_user else "CUSTOMER"
    return service.answer_message(req, client_ip=client_ip, actor_id=actor_id, actor_role=actor_role)


@router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    summary="List Active Chat Sessions"
)
async def list_chat_sessions(
    limit: int = 20,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    service: ChatService = Depends(get_chat_service)
) -> ChatSessionListResponse:
    actor_id = current_user.id if current_user else "anon-user"
    actor_role = current_user.role if current_user else "CUSTOMER"
    return service.list_sessions(limit=limit, actor_id=actor_id, actor_role=actor_role)


@router.get(
    "/sessions/{session_id}",
    response_model=ChatHistoryResponse,
    summary="Retrieve Chat History for Session"
)
async def get_chat_history(
    session_id: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    service: ChatService = Depends(get_chat_service)
) -> ChatHistoryResponse:
    actor_id = current_user.id if current_user else "anon-user"
    actor_role = current_user.role if current_user else "CUSTOMER"
    return service.get_history(session_id, actor_id=actor_id, actor_role=actor_role)


@router.delete(
    "/sessions/{session_id}",
    response_model=ChatSessionDeleteResponse,
    summary="Delete Chat Session and History",
    description="Removes conversation history from session store and records an audit log entry."
)
async def delete_chat_session(
    session_id: str,
    request: Request,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    service: ChatService = Depends(get_chat_service)
) -> ChatSessionDeleteResponse:
    client_ip = request.client.host if request.client else "127.0.0.1"
    actor_id = current_user.id if current_user else "anon-user"
    actor_role = current_user.role if current_user else "CUSTOMER"
    return service.delete_session(session_id, actor_id=actor_id, actor_role=actor_role, client_ip=client_ip)


@router.post(
    "/feedback",
    response_model=ChatFeedbackResponse,
    summary="Submit Chat Answer Feedback",
    description="Record user helpfulness ratings (positive/negative) and optional commentary into audit log."
)
async def submit_chat_feedback(
    req: ChatFeedbackRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    service: ChatService = Depends(get_chat_service)
) -> ChatFeedbackResponse:
    client_ip = request.client.host if request.client else "127.0.0.1"
    actor_id = "authenticated-user" if authorization else "anon-user"
    return service.record_feedback(req, actor_id=actor_id, client_ip=client_ip)


@router.get(
    "/topics",
    response_model=List[KnowledgeTopic],
    summary="List Curated Knowledge Topics and Suggested Prompts"
)
async def get_knowledge_topics(
    service: ChatService = Depends(get_chat_service)
) -> List[KnowledgeTopic]:
    return service.get_knowledge_topics()


@router.get(
    "/knowledge",
    response_model=KnowledgeListResponse,
    summary="Search or List Knowledge Base Articles",
    description="Queries the master RAG knowledge base used by the AI assistant, with semantic search, keyword scoring, and category filtering."
)
async def get_knowledge_articles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
) -> KnowledgeListResponse:
    docs = get_all_knowledge_documents()
    rag = get_rag_service()

    if q and q.strip():
        citations, _ = rag.search(query=q.strip(), category_filter=category, language_filter=language, top_k=20, min_threshold=0.15)
        cited_ids = {c.document_id for c in citations}
        # Filter docs matching citations and preserve order
        matched_docs = []
        for c in citations:
            match = next((d for d in docs if d["id"] == c.document_id), None)
            if match and match not in matched_docs:
                matched_docs.append(match)
        # Also append any keyword substring matches
        q_lower = q.lower().strip()
        for d in docs:
            if d not in matched_docs:
                if (q_lower in d["title"].lower() or 
                    q_lower in d["content"].lower() or 
                    any(q_lower in kw.lower() for kw in d.get("metadata", {}).get("keywords", []))):
                    matched_docs.append(d)
        docs = matched_docs

    if category and category != "ALL":
        docs = [d for d in docs if d["category"].upper() == category.upper()]

    if language and language != "auto":
        docs = [d for d in docs if d.get("language", "en") == language]

    items: List[KnowledgeArticleItem] = []
    for d in docs:
        cat = d.get("category", "GENERAL")
        doc_id = d.get("id", "")
        # Classify provenance
        if cat in ("ACCOUNT_SECURITY", "SCAM_AWARENESS", "MULE_ACCOUNTS"):
            if "helpline" in d.get("content", "").lower() or "statutory" in d.get("content", "").lower() or "act" in d.get("content", "").lower():
                prov = "EXTERNAL_OFFICIAL"
            else:
                prov = "GENERAL_MFS_SECURITY"
        elif cat == "UPAYACHE_PROTOTYPE":
            prov = "PROTOTYPE"
        else:
            prov = "PROTOTYPE"

        items.append(
            KnowledgeArticleItem(
                id=d["id"],
                title=d["title"],
                source=d.get("source", "UpayAche Intelligence Base"),
                category=cat,
                language=d.get("language", "en"),
                version=d.get("version", "v1.0"),
                content=d["content"],
                updated_at="2026-10-01",
                provenance_type=prov,
                metadata=d.get("metadata", {})
            )
        )

    return KnowledgeListResponse(items=items, total=len(items))
