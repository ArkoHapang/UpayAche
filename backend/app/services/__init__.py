"""
UpayAche — Backend Services Package.
"""

try:
    from app.services.network_service import WalletNetworkService, get_network_service
except ImportError:
    WalletNetworkService, get_network_service = None, None  # type: ignore

try:
    from app.services.explainability_service import (
        RiskExplainabilityService,
        get_risk_explainability_service
    )
except ImportError:
    RiskExplainabilityService, get_risk_explainability_service = None, None  # type: ignore

try:
    from app.services.auth_service import AuthService, get_auth_service
except ImportError:
    AuthService, get_auth_service = None, None  # type: ignore

try:
    from app.services.transaction_service import TransactionService, get_transaction_service
except ImportError:
    TransactionService, get_transaction_service = None, None  # type: ignore

try:
    from app.services.risk_service import RiskAnalyticsService, get_risk_analytics_service
except ImportError:
    RiskAnalyticsService, get_risk_analytics_service = None, None  # type: ignore

try:
    from app.services.investigation_service import InvestigationService, get_investigation_service
except ImportError:
    InvestigationService, get_investigation_service = None, None  # type: ignore

try:
    from app.services.ai_service import AICopilotService, get_ai_service
except ImportError:
    AICopilotService, get_ai_service = None, None  # type: ignore

try:
    from app.services.rag_service import RAGService, get_rag_service
except ImportError:
    RAGService, get_rag_service = None, None  # type: ignore

try:
    from app.services.chat_service import ChatService, get_chat_service
except ImportError:
    ChatService, get_chat_service = None, None  # type: ignore

try:
    from app.services.evidence_compiler import RiskEvidenceCompiler, get_risk_evidence_compiler
except ImportError:
    RiskEvidenceCompiler, get_risk_evidence_compiler = None, None  # type: ignore

__all__ = [
    "WalletNetworkService",
    "get_network_service",
    "RiskExplainabilityService",
    "get_risk_explainability_service",
    "AuthService",
    "get_auth_service",
    "TransactionService",
    "get_transaction_service",
    "RiskAnalyticsService",
    "get_risk_analytics_service",
    "InvestigationService",
    "get_investigation_service",
    "AICopilotService",
    "get_ai_service",
    "RAGService",
    "get_rag_service",
    "ChatService",
    "get_chat_service",
    "IngestionService",
    "get_ingestion_service",
    "RiskEvidenceCompiler",
    "get_risk_evidence_compiler"
]

