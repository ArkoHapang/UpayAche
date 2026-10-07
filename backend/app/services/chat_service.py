"""
UpayAche — Customer Risk Intelligence Chatbot Service.
Implements Guarded RAG generation with Google Gemini GenAI SDK and deterministic fallback.

NON-NEGOTIABLE GUARDRAILS:
1. Identifies strictly as 'UpayAche AI Assistant' (DIU CPC × upay AI Hackathon 2026 Prototype).
2. Explicitly denies being the official upay customer care system.
3. Zero authority to transfer money, approve/deny transactions, block/unblock accounts,
   or modify user credentials.
4. Prompt-injection and adversarial jailbreak defense.
5. Strict grounding: If knowledge base lacks evidence, responds:
   'I don't have enough verified information in my UpayAche knowledge base to answer that confidently.'
6. Read-only risk context retrieval: Never exposes SQL, database credentials, or service keys to the LLM.
7. Immutable audit logging for every message, prompt injection attempt, and session lifecycle event.
"""

import time
import uuid
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import threading
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatCitation,
    ChatSessionItem,
    ChatSessionListResponse,
    ChatHistoryResponse,
    ChatFeedbackRequest,
    ChatFeedbackResponse,
    ChatSessionDeleteResponse,
    KnowledgeTopic
)
from app.schemas.evidence import StructuredRiskEvidence, TieredInvestigationResponse
from app.services.rag_service import RAGService, get_rag_service
from app.services.audit_service import get_audit_service

logger = logging.getLogger("upayache.chat")

DISCLAIMER_TEXT = (
    "UpayAche AI Assistant is an AI risk & scam intelligence copilot created for the "
    "DIU CPC × upay AI Hackathon 2026 prototype. Not official upay customer support."
)

UNSUPPORTED_ACTION_KEYWORDS = [
    "transfer", "transfer money", "send money", "send tk", "transfer tk", "taka pathao",
    "taka pathan", "transfer korun", "taka transfer", "pathate chai",
    "unblock", "block my account", "block wallet", "account bondho", "account block",
    "change pin", "reset pin", "pin change", "pin reset", "password change",
    "refund", "taka ferot", "give my money back", "nid change", "balance check",
    "amar balance koto",
    "approve this transaction", "approve transaction", "approve",
    "cancel this transaction", "cancel transaction",
    "delete all investigation cases", "delete investigation cases", "delete cases"
]

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions",
    r"\b(system|developer|initial)\s+prompt\b",
    r"(show|reveal|display|tell|print|what\s+is)\s+(me\s+)?(your\s+)?(system|developer)\s+prompt",
    r"print\s+.*prompt",
    r"(what\s+is|tell\s+me|show|output|print|give|reveal)\s+(me\s+)?(all\s+)?(the\s+)?(database|db|system|admin|postgres)\s+(passwords?|credentials?|secrets?)",
    r"\b(database|db|postgres)\s+(passwords?|credentials?|secrets?)\b",
    r"what\s+is\s+the\s+(database\s+)?password",
    r"pretend\s+(you\s+are|to\s+be)",
    r"jailbreak",
    r"execute\s+(this\s+)?sql",
    r"run\s+(this\s+)?sql",
    r"delete\s+(all\s+|the\s+)?(database|tables?|investigation\s+cases|cases|investigations|records|wallets|transactions)",
    r"drop\s+table",
    r"drop\s+database",
    r"service[-_ ]role[-_ ]key",
    r"select\s+\*\s+from",
    r"dump\s+(all\s+)?(users|wallets|data)",
    r"(give|show|dump|get|provide|tell)\s+(me\s+)?(another|other|any)\s+(customer|user)('s)?\s+(information|data|details|account|pii)",
    r"(another|other)\s+customer('s)?\s+(information|data|details|profile|account)",
    r"give\s+me\s+another\s+customer"
]


class RateLimiter:
    """Thread-safe in-memory sliding window rate limiter (30 requests per minute)."""
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, client_id: str) -> bool:
        now = time.time()
        with self._lock:
            if client_id not in self._requests:
                self._requests[client_id] = [now]
                return True

            # Prune timestamps older than window
            cutoff = now - self.window_seconds
            self._requests[client_id] = [t for t in self._requests[client_id] if t > cutoff]

            if len(self._requests[client_id]) >= self.max_requests:
                return False

            self._requests[client_id].append(now)
            return True


def detect_language(text: str) -> str:
    """Detect if text is Bangla (Unicode), Banglish, or English."""
    if re.search(r"[\u0980-\u09ff]", text):
        return "bn"

    text_lower = text.lower()
    if "in bangla" in text_lower or "bangla te" in text_lower or "banglay" in text_lower:
        return "bn"

    if "in banglish" in text_lower or "banglish e" in text_lower:
        return "banglish"

    banglish_markers = [
        r"\bki\b", r"\bkivabe\b", r"\bkorbo\b", r"\bkorle\b", r"\bhobe\b", r"\bamar\b",
        r"\btaka\b", r"\bkeno\b", r"\bache\b", r"\bkaron\b", r"\bkake\b", r"\bbolbo\b",
        r"\bjani\b", r"\bshathe\b", r"\bkoro\b", r"\bparbo\b"
    ]
    if any(re.search(marker, text_lower) for marker in banglish_markers):
        return "banglish"

    return "en"


def check_prompt_injection(text: str) -> bool:
    """Detect prompt injection and adversarial jailbreak attempts."""
    t = text.lower()
    return any(re.search(pattern, t) for pattern in PROMPT_INJECTION_PATTERNS)


def is_unsupported_account_mutation(query: str) -> bool:
    """Detect if user is attempting to perform an unavailable financial or administrative action."""
    q = query.lower()
    return any(act in q for act in UNSUPPORTED_ACTION_KEYWORDS)


def classify_question_category(text: str) -> str:
    """Categorize user query into one of the 14 standard risk intelligence domains."""
    t = text.lower()
    if any(k in t for k in ["mule", "smurf", "network", "graph", "fan in", "loop", "pagerank"]):
        return "network"
    elif any(k in t for k in ["scam", "lottery", "prize", "phish", "impersonat", "fake call"]):
        return "scam"
    elif any(k in t for k in ["pin", "otp", "password", "protect", "lost phone", "security"]):
        return "security"
    elif any(k in t for k in ["shap", "feature", "explain", "treeexplainer", "contribution"]):
        return "SHAP"
    elif any(k in t for k in ["anomaly", "isolation forest", "outlier", "unsupervised"]):
        return "anomaly"
    elif any(k in t for k in ["flag", "flagged", "velocity", "nocturnal", "risk score"]):
        return "risk"
    elif any(k in t for k in ["xgboost", "model", "f1", "precision", "recall", "ml"]):
        return "ML"
    elif any(k in t for k in ["case", "investigat", "reviewed", "closed", "triage"]):
        return "investigation"
    elif any(k in t for k in ["privacy", "pii", "synthetic", "mask"]):
        return "privacy"
    elif any(k in t for k in ["responsible", "guardrail", "block account", "can ai"]):
        return "responsible-ai"
    elif any(k in t for k in ["faq", "help", "customer", "support"]):
        return "customer-support"
    elif any(k in t for k in ["transaction", "p2p", "cash in", "cash out"]):
        return "transaction"
    elif any(k in t for k in ["ai", "copilot", "gemini"]):
        return "AI"
    return "general"


def generate_unsupported_action_refusal(query: str, lang: str) -> str:
    """Return polite refusal with official escalation guidance."""
    if lang == "bn":
        return (
            "আমি 'UpayAche AI Assistant', একটি কৃত্রিম বুদ্ধিমত্তা চালিত ঝুঁকি ও প্রতারণা সচেতনতা বিষয়ক সহায়ক। "
            "আমি কোনো আর্থিক লেনদেন সম্পাদন, টাকা ফেরত, অ্যাকাউন্ট ব্লক বা পিন পরিবর্তন করতে পারি না।\n\n"
            "আপনার অফিসিয়াল অ্যাকাউন্টের যে কোনো সেবা বা সমস্যার জন্য অনুগ্রহ করে অফিসিয়াল উপায় হেল্পলাইন ১৬২৬৮ (16268) "
            "এ যোগাযোগ করুন অথবা নিকটস্থ অনুমোদিত উপায় কাস্টমার কেয়ারে যোগাযোগ করুন।"
        )
    elif lang == "banglish":
        return (
            "Ami 'UpayAche AI Assistant', ekta AI risk intelligence copilot. Ami kono financial transfer, "
            "account block, taka refund ba PIN change korte pari na.\n\n"
            "Apnar official account er support er jonno doya kore official upay helpline 16268 e call korun "
            "othoba nearest official upay customer care center e jogajog korun."
        )
    else:
        return (
            "I am the 'UpayAche AI Assistant', an AI-powered risk and scam intelligence copilot for the "
            "DIU CPC × upay AI Hackathon 2026 prototype. I do not have access to live customer accounts and "
            "cannot transfer funds, issue refunds, block/unblock wallets, or change your PIN.\n\n"
            "For official account inquiries, wallet management, or dispute resolutions, please contact the "
            "official upay helpline directly at 16268 or visit an authorized upay customer care branch."
        )


def generate_prompt_injection_refusal(lang: str) -> str:
    """Return polite refusal when an adversarial prompt injection, secret probe, or unauthorized data request is detected."""
    if lang == "bn":
        return (
            "আমি এই অনুরোধটি সম্পন্ন করতে পারছি না। 'UpayAche AI Assistant' হিসেবে আমি কঠোর নিরাপত্তা ও গোপনীয়তা "
            "নীতিমালার অধীনে পরিচালিত হই এবং সিস্টেম প্রম্পট প্রকাশ, ডাটাবেস ক্রেডেনশিয়াল প্রদান, গ্রাহকের ব্যক্তিগত তথ্য (Zero PII) "
            "কিংবা কোনো প্রশাসনিক ও ধ্বংসাত্মক কমান্ড সম্পাদন করতে পারি না। আমি এমএফএস লেনদেনের ঝুঁকি, প্রতারণা প্রতিরোধ কিংবা "
            "UpayAche এর ব্যাখ্যাযোগ্য এআই নিয়ে আপনার প্রশ্নের উত্তর দিতে পারি।"
        )
    elif lang == "banglish":
        return (
            "Ami ei request ti fulfill korte parbo na. UpayAche AI Assistant hishabe ami strict security and privacy "
            "guardrail er under e kaj kori ebong kono system prompt reveal, database credential disclose, customer data (Zero PII) share, "
            "ba arbitrary administrative command run korte pari na. Apni transaction risk ba scam awareness niye jekono question korte paren."
        )
    else:
        return (
            "I cannot fulfill this request. As UpayAche AI Assistant, I operate strictly within defined security and privacy "
            "guardrails and cannot reveal system prompts, disclose database credentials, provide other customers' personal data (Zero PII), "
            "or execute administrative/destructive commands. I can, however, assist you with MFS transaction risk concepts, scam prevention, or UpayAche explainability architecture."
        )


def build_fallback_response(query: str, citations: List[ChatCitation], lang: str) -> str:
    """Deterministic, high-clarity template response grounded in retrieved citations."""
    if not citations:
        if lang == "bn":
            return "আমার UpayAche নলেজ বেজে আত্মবিশ্বাসের সাথে এই প্রশ্নের উত্তর দেওয়ার মতো পর্যাপ্ত যাচাইকৃত তথ্য নেই।"
        elif lang == "banglish":
            return "I don't have enough verified information in my UpayAche knowledge base to answer that confidently."
        else:
            return "I don't have enough verified information in my UpayAche knowledge base to answer that confidently."

    primary = citations[0]
    sec = citations[1] if len(citations) > 1 else None

    if lang == "bn":
        ans = f"**{primary.title}** এর তথ্যানুযায়ী:\n\n{primary.snippet}\n"
        if sec:
            ans += f"\nআরও প্রাসঙ্গিক তথ্য (**{sec.title}**):\n{sec.snippet}\n"
        ans += "\n\n*স্মারক: UpayAche একটি হ্যাকাথন প্রোটোটাইপ এবং এটি অফিসিয়াল উপায় কাস্টমার কেয়ার নয়।*"
        return ans
    elif lang == "banglish":
        ans = f"**{primary.title}** onushare:\n\n{primary.snippet}\n"
        if sec:
            ans += f"\nRelated information (**{sec.title}**):\n{sec.snippet}\n"
        ans += "\n\n*Note: UpayAche holo ekta hackathon prototype, official upay customer service noy.*"
        return ans
    else:
        ans = f"Based on verified guidance from **{primary.title}**:\n\n{primary.snippet}\n"
        if sec:
            ans += f"\nAdditional context from **{sec.title}**:\n{sec.snippet}\n"
        ans += "\n\n*Note: UpayAche is an independent hackathon prototype and not official upay customer service.*"
        return ans


class ChatService:
    def __init__(self, rag_service: Optional[RAGService] = None):
        self.rag = rag_service or get_rag_service()
        self._lock = threading.RLock()
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._messages: Dict[str, List[Dict[str, Any]]] = {}
        self._feedback: Dict[str, Dict[str, Any]] = {}
        self.rate_limiter = RateLimiter(max_requests=30, window_seconds=60)

    def get_or_create_session(self, session_id: Optional[str] = None, user_id: str = "anon-user") -> str:
        with self._lock:
            if session_id and session_id in self._sessions:
                existing_owner = self._sessions[session_id].get("user_id")
                if existing_owner and existing_owner != user_id and user_id not in ("anon-user", "authenticated-user"):
                    raise HTTPException(
                        status_code=403,
                        detail="Forbidden: You are not authorized to modify another user's chat session."
                    )
                return session_id

            sid = session_id or str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            self._sessions[sid] = {
                "id": sid,
                "user_id": user_id,
                "title": "New Conversation",
                "created_at": now,
                "updated_at": now
            }
            self._messages[sid] = []
            return sid

    def list_sessions(
        self,
        limit: int = 20,
        actor_id: Optional[str] = None,
        actor_role: Optional[str] = None
    ) -> ChatSessionListResponse:
        with self._lock:
            # IDOR Protection: Non-admins can only see their own sessions
            if actor_role == "ADMIN":
                eligible = list(self._sessions.values())
            elif actor_id and actor_id not in ("anon-user", "authenticated-user"):
                eligible = [s for s in self._sessions.values() if s.get("user_id") == actor_id]
            else:
                eligible = [s for s in self._sessions.values() if s.get("user_id") in ("anon-user", "authenticated-user", None)]

            items = []
            for s in sorted(eligible, key=lambda x: str(x["updated_at"]), reverse=True)[:limit]:
                msg_count = len(self._messages.get(s["id"], []))
                items.append(ChatSessionItem(
                    id=s["id"],
                    title=s["title"],
                    created_at=s["created_at"],
                    updated_at=s["updated_at"],
                    message_count=msg_count
                ))
            return ChatSessionListResponse(sessions=items)

    def get_history(
        self,
        session_id: str,
        actor_id: Optional[str] = None,
        actor_role: Optional[str] = None
    ) -> ChatHistoryResponse:
        with self._lock:
            s = self._sessions.get(session_id)
            if not s:
                raise HTTPException(status_code=404, detail=f"Chat session '{session_id}' not found.")

            # IDOR Protection: Reject callers who are not the owner and not an admin
            owner_id = s.get("user_id")
            if (
                actor_role != "ADMIN"
                and owner_id
                and owner_id not in ("anon-user", "authenticated-user")
                and actor_id != owner_id
            ):
                raise HTTPException(
                    status_code=403,
                    detail=f"Forbidden: You are not authorized to view session owned by '{owner_id}'."
                )

            title = s.get("title", "Conversation")
            msgs = self._messages.get(session_id, [])
            return ChatHistoryResponse(session_id=session_id, title=title, messages=list(msgs))

    def delete_session(
        self,
        session_id: str,
        actor_id: str = "anon-user",
        actor_role: Optional[str] = None,
        client_ip: str = "127.0.0.1"
    ) -> ChatSessionDeleteResponse:
        with self._lock:
            if session_id not in self._sessions:
                raise HTTPException(status_code=404, detail=f"Chat session '{session_id}' not found.")

            # IDOR Protection: Reject deletion by non-owner unless ADMIN
            owner_id = self._sessions[session_id].get("user_id")
            if (
                actor_role != "ADMIN"
                and owner_id
                and owner_id not in ("anon-user", "authenticated-user")
                and actor_id != owner_id
            ):
                raise HTTPException(
                    status_code=403,
                    detail=f"Forbidden: You are not authorized to delete session owned by '{owner_id}'."
                )

            del self._sessions[session_id]
            if session_id in self._messages:
                del self._messages[session_id]

            get_audit_service().log_event(
                actor_id=actor_id,
                actor_role=actor_role or "CONSUMER",
                action="CHAT_SESSION_DELETED",
                resource_type="chat_session",
                resource_id=session_id,
                metadata={"status": "DELETED"},
                ip_address=client_ip
            )
            return ChatSessionDeleteResponse(status="DELETED", session_id=session_id)

    def answer_message(
        self,
        req: Optional[ChatMessageRequest] = None,
        client_ip: str = "127.0.0.1",
        actor_id: str = "anon-user",
        actor_role: str = "CONSUMER",
        message: Optional[str] = None,
        session_id: Optional[str] = None,
        **kwargs
    ) -> ChatMessageResponse:
        """
        Executes the complete 10-step Customer Chatbot pipeline:
        1. Validate request & enforce rate limit
        2. Identify user/session
        3. Classify question & detect language
        4. Retrieve relevant knowledge using pgvector / semantic embeddings
        5. Retrieve project risk info safely if specific identifiers are referenced
        6. Construct grounded prompt with strict persona & zero secret exposure
        7. Generate answer via Gemini SDK or deterministic fallback
        8. Include source citations
        9. Store conversation in session history
        10. Record immutable audit log
        """
        # Step 1: Input validation & rate limiting
        if req is None:
            raw_msg = (message or "").strip()
            if not raw_msg:
                raise HTTPException(status_code=422, detail="Message cannot be empty.")
            if len(raw_msg) > 1500:
                raise HTTPException(status_code=422, detail="Message exceeds maximum allowed length of 1500 characters.")
            req = ChatMessageRequest(message=raw_msg, session_id=session_id)
        user_text = req.message.strip()
        if not user_text:
            raise HTTPException(status_code=422, detail="Message cannot be empty.")
        if len(user_text) > 1500:
            raise HTTPException(status_code=422, detail="Message exceeds maximum allowed length of 1500 characters.")

        rate_key = f"{client_ip}:{actor_id}"
        if not self.rate_limiter.check_rate_limit(rate_key):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please wait a moment before sending more messages."
            )

        # Step 2: Identify session & user
        session_id = self.get_or_create_session(req.session_id, user_id=actor_id)
        now = datetime.now(timezone.utc).isoformat()
        user_msg_id = str(uuid.uuid4())

        # Step 3: Classify question & language
        lang = detect_language(user_text) if req.language == "auto" else (req.language or "en")
        category = classify_question_category(user_text)

        # Store user message
        with self._lock:
            self._messages[session_id].append({
                "id": user_msg_id,
                "session_id": session_id,
                "role": "user",
                "content": user_text,
                "citations": [],
                "created_at": now
            })
            if self._sessions[session_id]["title"] == "New Conversation":
                title_snip = user_text[:36] + ("..." if len(user_text) > 36 else "")
                self._sessions[session_id]["title"] = title_snip

        # Guardrail Check 1: Prompt-Injection / Credential Probe
        if check_prompt_injection(user_text):
            refusal_text = generate_prompt_injection_refusal(lang)
            get_audit_service().log_event(
                actor_id=actor_id,
                actor_role=actor_role,
                action="CHAT_SECURITY_VIOLATION_BLOCKED",
                resource_type="chat_message",
                resource_id=user_msg_id,
                metadata={"reason": "PROMPT_INJECTION_OR_CREDENTIAL_PROBE", "query_snip": user_text[:60]},
                ip_address=client_ip
            )
            return self._record_and_return_assistant_message(
                session_id=session_id,
                content=refusal_text,
                citations=[],
                confidence_tier="HIGH",
                suggested_actions=[
                    "Why was this transaction flagged?",
                    "What is a mule account?",
                    "How can I protect my wallet?"
                ],
                actor_id=actor_id,
                actor_role=actor_role,
                client_ip=client_ip,
                category=category
            )

        # Guardrail Check 2: Disallowed financial/account mutation
        if is_unsupported_account_mutation(user_text):
            response_content = generate_unsupported_action_refusal(user_text, lang)
            get_audit_service().log_event(
                actor_id=actor_id,
                actor_role=actor_role,
                action="CHAT_UNSAFE_ACTION_REFUSED",
                resource_type="chat_message",
                resource_id=user_msg_id,
                metadata={"reason": "UNSUPPORTED_FINANCIAL_ACTION", "query_snip": user_text[:60]},
                ip_address=client_ip
            )
            return self._record_and_return_assistant_message(
                session_id=session_id,
                content=response_content,
                citations=[],
                confidence_tier="HIGH",
                suggested_actions=[
                    "Contact official upay helpline 16268",
                    "Visit authorized upay customer care center",
                    "Ask about transaction risk factors instead"
                ],
                actor_id=actor_id,
                actor_role=actor_role,
                client_ip=client_ip,
                category=category
            )

        # Step 4: Retrieve relevant knowledge using pgvector / semantic embeddings
        search_query = user_text
        if len(user_text.split()) <= 6:
            prior_user_msgs = [m["content"] for m in self._messages.get(session_id, [])[:-1] if m.get("role") == "user"]
            if prior_user_msgs:
                search_query = f"{prior_user_msgs[-1]} {user_text}"
            elif any(w in user_text.lower() for w in ["explain this", "in bangla", "in banglish", "beginner", "simple"]):
                search_query = f"UpayAche risk and scam intelligence {user_text}"

        citations, has_context = self.rag.search(
            query=search_query,
            category_filter=req.category_filter,
            language_filter=lang if lang in ("en", "bn", "banglish") else None,
            top_k=3
        )

        # Step 5: Safe read-only backend risk lookup & ML evidence compilation
        safe_risk_context, structured_evidence, tiered_response = self._retrieve_safe_read_only_risk_info(user_text)

        # If a specific transaction or case was queried and structured evidence compiled, return the explicit 3-tiered response
        if structured_evidence and tiered_response:
            score_disp = f"{structured_evidence.risk_score:.4f}" if structured_evidence.risk_score is not None else "Unavailable"
            anom_disp = f"{structured_evidence.anomaly_score:.4f}" if structured_evidence.anomaly_score is not None else "Unavailable"
            amt_bdt = structured_evidence.transaction_context.get("amount_bdt", 0.0)
            tx_h = structured_evidence.transaction_context.get("tx_hash", "TX-RECORD")
            tx_t = structured_evidence.transaction_context.get("tx_type", "P2P")
            top_f = ", ".join(structured_evidence.top_risk_features) if structured_evidence.top_risk_features else "None flagged"
            net_sigs = "; ".join(structured_evidence.network_signals) if structured_evidence.network_signals else "Standard network topology"
            shap_highlights = "; ".join([f"{c.feature} ({c.direction}: {c.contribution:+.2f})" for c in structured_evidence.shap_contributions[:3]]) or "Standard baseline weights"

            content = (
                f"### Model result\n"
                f"• **XGBoost Risk Score**: {score_disp} ({structured_evidence.risk_level})\n"
                f"• **Isolation Forest Anomaly Score**: {anom_disp} ({tiered_response.model_result.anomaly_level})\n"
                f"• **Model Source**: {structured_evidence.model_source}\n\n"
                f"### Evidence\n"
                f"• **Transaction Context**: {tx_h} | Amount: BDT {amt_bdt:,.2f} ({tx_t})\n"
                f"• **Top Risk Features**: {top_f}\n"
                f"• **SHAP Attributions**: {shap_highlights}\n"
                f"• **Network Signals**: {net_sigs}\n"
                f"• **Counterparty Connections**: {structured_evidence.related_wallet_count or 'Unavailable'} ({structured_evidence.suspicious_connection_count or 0} suspicious)\n\n"
                f"### AI explanation\n"
                f"{tiered_response.ai_explanation.executive_summary}\n\n"
                f"{tiered_response.ai_explanation.risk_breakdown}\n\n"
                f"**Investigation Guidance:**\n"
                + "\n".join([f"• {g}" for g in (tiered_response.ai_explanation.investigation_guidance[:3] or ["Cross-reference KYC and device hardware logs", "Monitor 24h outbound flow"])])
            )

            return self._record_and_return_assistant_message(
                session_id=session_id,
                content=content,
                citations=citations,
                confidence_tier="HIGH",
                suggested_actions=[
                    "What does a high risk score mean?",
                    "What is a mule network?",
                    "How does SHAP explain risk?"
                ],
                actor_id=actor_id,
                actor_role=actor_role,
                client_ip=client_ip,
                category=category,
                structured_evidence=structured_evidence,
                tiered_response=tiered_response
            )

        # Step 6 & 7: Check grounding & generate answer
        if not has_context or not citations:
            insufficient_msg = (
                "আমার UpayAche নলেজ বেজে আত্মবিশ্বাসের সাথে এই প্রশ্নের উত্তর দেওয়ার মতো পর্যাপ্ত যাচাইকৃত তথ্য নেই।"
                if lang == "bn"
                else "I don't have enough verified information in my UpayAche knowledge base to answer that confidently."
            )
            return self._record_and_return_assistant_message(
                session_id=session_id,
                content=insufficient_msg,
                citations=[],
                confidence_tier="LOW",
                suggested_actions=[
                    "Why was this transaction flagged?",
                    "What is a mule account?",
                    "How can I protect my wallet?"
                ],
                actor_id=actor_id,
                actor_role=actor_role,
                client_ip=client_ip,
                category=category
            )

        response_content = self._generate_rag_answer(user_text, citations, lang, safe_risk_context)

        confidence_tier = "HIGH" if citations[0].similarity_score >= 0.40 else "MEDIUM"
        suggested_actions = [
            "What does a suspicious network mean?",
            "How does SHAP explain risk?",
            "How to recognize phishing calls?"
        ]

        # Step 8, 9, 10: Store, cite, and log audit trail
        return self._record_and_return_assistant_message(
            session_id=session_id,
            content=response_content,
            citations=citations,
            confidence_tier=confidence_tier,
            suggested_actions=suggested_actions,
            actor_id=actor_id,
            actor_role=actor_role,
            client_ip=client_ip,
            category=category,
            structured_evidence=structured_evidence,
            tiered_response=tiered_response
        )

    def _retrieve_safe_read_only_risk_info(
        self, text: str
    ) -> Tuple[Optional[str], Optional[StructuredRiskEvidence], Optional[TieredInvestigationResponse]]:
        """Safely fetch sanitized, read-only transaction/wallet status and compile structured risk evidence."""
        try:
            from app.services.evidence_compiler import get_risk_evidence_compiler
            compiler = get_risk_evidence_compiler()

            # Look for transaction hash patterns (e.g. TX_9999, TX-2026-001, tx_hash_...)
            tx_match = re.search(r"\b(tx_hash_[a-z0-9_]+|TX[_-][A-Za-z0-9_-]+|TX[0-9]{3,})\b", text, re.I)
            if tx_match:
                tx_id = tx_match.group(1)
                evidence = compiler.compile_evidence_for_transaction(tx_id)
                tiered = compiler.generate_tiered_response(evidence, inquiry=text)
                ctx_summary = (
                    f"[Safe Read-Only Ledger Record]: Transaction {evidence.transaction_context.get('tx_hash', tx_id)} "
                    f"Amount: BDT {evidence.transaction_context.get('amount_bdt', 0):,.2f}, Status: {evidence.transaction_context.get('status', 'COMPLETED')}, "
                    f"XGBoost Score: {evidence.risk_score} ({evidence.risk_level}), Isolation Forest Anomaly: {evidence.anomaly_score}."
                )
                return ctx_summary, evidence, tiered

            # Look for case ID patterns (e.g. CASE_001, CASE-2026-001, case_...)
            case_match = re.search(r"\b(case_[a-z0-9_]+|CASE[_-][A-Za-z0-9_-]+|CASE[0-9]{3,})\b", text, re.I)
            if case_match:
                case_id = case_match.group(1)
                evidence = compiler.compile_evidence_for_case(case_id)
                tiered = compiler.generate_tiered_response(evidence, inquiry=text)
                ctx_summary = (
                    f"[Investigation Case Evidence]: Case {case_id} "
                    f"XGBoost Score: {evidence.risk_score} ({evidence.risk_level}), Anomaly: {evidence.anomaly_score}."
                )
                return ctx_summary, evidence, tiered

        except Exception as e:
            logger.debug(f"Read-only risk evidence lookup skipped: {e}")

        return None, None, None


    def _generate_rag_answer(
        self,
        query: str,
        citations: List[ChatCitation],
        lang: str,
        safe_risk_context: Optional[str] = None
    ) -> str:
        """Call Gemini with strictly bounded prompt and context, or deterministic fallback."""
        if not settings.GEMINI_API_KEY or "your-gemini" in settings.GEMINI_API_KEY:
            return build_fallback_response(query, citations, lang)

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            context_snippets = "\n\n".join([
                f"[Source: {c.title} | Category: {c.category}]\n{c.snippet}"
                for c in citations
            ])
            if safe_risk_context:
                context_snippets += f"\n\n{safe_risk_context}"

            system_instruction = (
                "You are 'UpayAche AI Assistant', an educational risk and scam intelligence copilot "
                "for the DIU CPC × upay AI Hackathon 2026 prototype.\n"
                "CRITICAL SECURITY INVARIANTS:\n"
                "1. You are NOT the official upay customer care service.\n"
                "2. You have ZERO authority to transfer money, block/suspend wallets, approve/deny transactions, "
                "or execute SQL/JS code.\n"
                "3. Base your answer EXCLUSIVELY on the verified context provided below. NEVER invent or fabricate "
                "transaction IDs, wallet IDs, amounts, or dates.\n"
                "4. Clearly distinguish FACTS FROM EVIDENCE (wallet IDs, transaction IDs, amounts, timestamps, risk signals) "
                "from AI INTERPRETATION (likely explanation, investigation recommendation).\n"
                "5. When explaining an alert or case, structure with: WHAT HAPPENED, WHY IT MAY BE RISKY, and WHAT TO INVESTIGATE NEXT.\n"
                "6. Conclude with the mandatory advisory: 'AI-generated investigation assistance. Verify all conclusions against the evidence. Final decisions remain with authorized analysts.'\n"
                f"7. Answer in the requested language ({lang}: English, Bangla, or Banglish)."
            )

            prompt = (
                f"VERIFIED KNOWLEDGE BASE CONTEXT:\n{context_snippets}\n\n"
                f"USER QUESTION: {query}\n\n"
                "Provide a clear, helpful, grounded answer citing the source documents:"
            )

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                    max_output_tokens=600
                )
            )

            text = response.text
            if text and len(text.strip()) > 15:
                return text.strip()

        except Exception as e:
            logger.warning(f"Gemini RAG chat invocation failed, using fallback: {e}")

        return build_fallback_response(query, citations, lang)

    def _record_and_return_assistant_message(
        self,
        session_id: str,
        content: str,
        citations: List[ChatCitation],
        confidence_tier: str,
        suggested_actions: List[str],
        actor_id: str,
        actor_role: str,
        client_ip: str,
        category: str,
        structured_evidence: Optional[StructuredRiskEvidence] = None,
        tiered_response: Optional[TieredInvestigationResponse] = None
    ) -> ChatMessageResponse:
        now = datetime.now(timezone.utc).isoformat()
        msg_id = str(uuid.uuid4())

        msg_record = {
            "id": msg_id,
            "session_id": session_id,
            "role": "assistant",
            "content": content,
            "citations": [c.model_dump() for c in citations],
            "confidence_tier": confidence_tier,
            "created_at": now,
            "structured_evidence": structured_evidence.model_dump() if structured_evidence else None,
            "tiered_response": tiered_response.model_dump() if tiered_response else None
        }

        with self._lock:
            self._messages[session_id].append(msg_record)
            self._sessions[session_id]["updated_at"] = now

        # Step 10: Immutable Audit Log
        get_audit_service().log_event(
            actor_id=actor_id,
            actor_role=actor_role,
            action="CHAT_MESSAGE_PROCESSED",
            resource_type="chat_message",
            resource_id=msg_id,
            metadata={
                "session_id": session_id,
                "category": category,
                "citations_count": len(citations),
                "confidence_tier": confidence_tier,
                "has_structured_evidence": structured_evidence is not None
            },
            ip_address=client_ip
        )

        return ChatMessageResponse(
            id=msg_id,
            session_id=session_id,
            role="assistant",
            content=content,
            citations=citations,
            confidence_tier=confidence_tier,
            disclaimer=DISCLAIMER_TEXT,
            suggested_actions=suggested_actions,
            created_at=now,
            structured_evidence=structured_evidence,
            tiered_response=tiered_response
        )

    def record_feedback(
        self,
        req: ChatFeedbackRequest,
        actor_id: str = "anon-user",
        client_ip: str = "127.0.0.1"
    ) -> ChatFeedbackResponse:
        with self._lock:
            fb_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            self._feedback[fb_id] = {
                "id": fb_id,
                "message_id": req.message_id,
                "rating": req.rating,
                "feedback_text": req.feedback_text,
                "created_at": now
            }

            get_audit_service().log_event(
                actor_id=actor_id,
                actor_role="CONSUMER",
                action="CHAT_FEEDBACK_RECORDED",
                resource_type="chat_feedback",
                resource_id=fb_id,
                metadata={"message_id": req.message_id, "rating": req.rating},
                ip_address=client_ip
            )
            return ChatFeedbackResponse(id=fb_id, message_id=req.message_id, rating=req.rating)

    def get_knowledge_topics(self) -> List[KnowledgeTopic]:
        return [
            KnowledgeTopic(
                category="TRANSACTION_RISK",
                label="Transaction Risk & Flags",
                description="Understand why transactions are flagged and how velocity or amounts affect risk.",
                suggested_prompts=[
                    "Why was this transaction flagged?",
                    "Why is my risk score high?",
                    "What does a high risk score mean?"
                ]
            ),
            KnowledgeTopic(
                category="SCAM_AWARENESS",
                label="Scam Awareness & Phishing",
                description="Learn how to spot OTP scams, prize calls, and emergency impersonations.",
                suggested_prompts=[
                    "What should I do if someone asks for my OTP?",
                    "How do scammers steal PINs?",
                    "OTP share korle ki hobe?"
                ]
            ),
            KnowledgeTopic(
                category="ACCOUNT_SECURITY",
                label="Wallet & PIN Security",
                description="Best practices to secure your mobile financial wallet and avoid compromise.",
                suggested_prompts=[
                    "How can I protect my wallet?",
                    "কিভাবে আমার ওয়ালেট সুরক্ষিত রাখব?",
                    "What if I lost my phone?"
                ]
            ),
            KnowledgeTopic(
                category="MULE_ACCOUNTS",
                label="Mule Accounts & Legal Risks",
                description="What is a money mule account and why lending your wallet is illegal.",
                suggested_prompts=[
                    "What is a mule account?",
                    "মিউল অ্যাকাউন্ট কি?",
                    "Can I let someone use my wallet for commission?"
                ]
            ),
            KnowledgeTopic(
                category="EXPLAINABILITY_AI",
                label="Explainable AI & SHAP",
                description="How SHAP values explain risk and why AI does not automatically block accounts.",
                suggested_prompts=[
                    "How does SHAP explain risk?",
                    "Can AI automatically block a transaction?",
                    "What is behavioral anomaly detection?"
                ]
            ),
            KnowledgeTopic(
                category="NETWORK_INTELLIGENCE",
                label="Suspicious Networks & Graph",
                description="How graph algorithms identify circular loops, smurfing, and mule clusters.",
                suggested_prompts=[
                    "What does suspicious network mean?",
                    "How does the network graph work?"
                ]
            )
        ]


_chat_service_instance: Optional[ChatService] = None

def get_chat_service() -> ChatService:
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ChatService()
    return _chat_service_instance

get_customer_chat_service = get_chat_service
