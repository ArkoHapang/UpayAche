"""
UpayAche — Master End-to-End Integration Test Suite.

Validates the two complete end-to-end data flows using real application engines:

FLOW 1: RISK & INVESTIGATION LIFECYCLE
Synthetic transaction
  --> Transaction API (POST /api/v1/transactions/analyze)
  --> XGBoost risk scoring
  --> Isolation Forest anomaly detection
  --> SHAP explanation
  --> Network analysis (GET /api/v1/network/wallet/{id}, GET /api/v1/network/subgraph)
  --> Supabase persistence (Repository verification)
  --> Dashboard (GET /api/v1/risk/summary, GET /api/v1/risk/trends)
  --> Transaction details (GET /api/v1/transactions/{id}, GET /api/v1/risk/{id})
  --> Investigation case (POST /api/v1/investigations, OPEN --> INVESTIGATING)
  --> AI Investigation Assistant (POST /api/v1/ai/investigate)
  --> Analyst notes (POST /api/v1/investigations/{id}/notes)
  --> Case resolution (INVESTIGATING --> REVIEWED --> CLOSED)
  --> Audit log (GET /api/v1/audit/logs)

FLOW 2: CUSTOMER AI ASSISTANT & KNOWLEDGE PIPELINE
Customer
  --> AI Assistant (POST /api/v1/chat/message)
  --> Supabase chat session (GET /api/v1/chat/sessions, GET /api/v1/chat/sessions/{id})
  --> Knowledge retrieval (RAG hybrid vector + keyword search)
  --> Gemini
  --> Grounded answer
  --> Citation
  --> Feedback (POST /api/v1/chat/feedback)

Invariants:
- All stages process real application data (no mock/fake placeholders).
- Zero secret disclosure.
- State machine transition integrity preserved.
"""

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
import pytest
from starlette.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.db.repository import get_repository
from app.services.audit_service import get_audit_service


@pytest.fixture(scope="module")
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def repo():
    return get_repository()


@pytest.fixture(scope="module")
def analyst_headers():
    return {"Authorization": "Bearer test-analyst-token"}


@pytest.fixture(scope="module")
def admin_headers():
    return {"Authorization": "Bearer test-admin-token"}


@pytest.fixture(scope="module")
def customer_headers():
    return {"Authorization": "Bearer test-customer-token"}


# =============================================================================
# FLOW 1: TRANSACTION RISK & INVESTIGATION LIFECYCLE
# =============================================================================

class TestFlow1RiskAndInvestigationLifecycle:
    """End-to-end integration test of the full risk engine, investigation, and audit trail."""

    def test_complete_risk_and_investigation_lifecycle(self, client, repo, analyst_headers, admin_headers):
        print("\n=======================================================")
        print("STARTING FLOW 1: TRANSACTION RISK & INVESTIGATION LIFECYCLE")
        print("=======================================================")

        # ---------------------------------------------------------------------
        # 1. SYNTHETIC TRANSACTION
        # ---------------------------------------------------------------------
        print("\n[Step 1] Synthetic Transaction Generation")
        wallets = repo.list_wallets(limit=5)
        assert len(wallets) >= 2, "Repository must have pre-seeded or generated wallets"
        sender_wallet = wallets[0]
        receiver_wallet = wallets[1]

        synthetic_amount = 74500.00
        synthetic_tx_type = "CASH_OUT"
        synthetic_device = f"dev-synth-{uuid.uuid4().hex[:6]}"
        synthetic_timestamp = "2026-02-01T03:15:00Z" # Nocturnal hour to test velocity/temporal features

        print(f"  * Sender Wallet: {sender_wallet['id']} ({sender_wallet.get('phone_masked', '017****1001')})")
        print(f"  * Receiver Wallet: {receiver_wallet['id']} ({receiver_wallet.get('phone_masked', '017****1002')})")
        print(f"  * Amount: BDT {synthetic_amount:,.2f} ({synthetic_tx_type}) at {synthetic_timestamp}")

        # ---------------------------------------------------------------------
        # 2. TRANSACTION API
        # ---------------------------------------------------------------------
        print("\n[Step 2] Ingesting via Transaction API (/api/v1/transactions/analyze)")
        tx_req_payload = {
            "amount": synthetic_amount,
            "sender_wallet_id": sender_wallet["id"],
            "receiver_wallet_id": receiver_wallet["id"],
            "tx_type": synthetic_tx_type,
            "device_id": synthetic_device,
            "location_id": "loc-dhaka-gulshan",
            "timestamp": synthetic_timestamp
        }
        analyze_res = client.post("/api/v1/transactions/analyze", headers=analyst_headers, json=tx_req_payload)
        assert analyze_res.status_code == 200, f"Transaction analyze failed: {analyze_res.text}"
        tx_result = analyze_res.json()

        tx_id = tx_result["transaction_id"]
        assert tx_id is not None and len(tx_id) > 10, "Real transaction ID must be returned"
        print(f"  * Ingested Transaction ID: {tx_id}")

        # ---------------------------------------------------------------------
        # 3. XGBOOST RISK SCORING
        # ---------------------------------------------------------------------
        print("\n[Step 3] XGBoost Numerical Risk Scoring")
        risk_score = tx_result["risk_score"]
        risk_level = tx_result["risk_level"]
        is_fraud = tx_result["is_fraud"]

        assert isinstance(risk_score, float), "XGBoost risk score must be a float"
        assert 0.0 <= risk_score <= 1.0, "Risk score must be in normalized [0.0, 1.0] range"
        assert risk_level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert is_fraud in (0, 1)
        print(f"  * XGBoost Risk Score: {risk_score:.4f} ({risk_level}), Fraud Flag: {is_fraud}")

        # ---------------------------------------------------------------------
        # 4. ISOLATION FOREST ANOMALY DETECTION
        # ---------------------------------------------------------------------
        print("\n[Step 4] Isolation Forest Behavioral Anomaly Detection")
        anomaly_score = tx_result["anomaly_score"]
        is_anomaly = tx_result["is_anomaly"]

        assert isinstance(anomaly_score, float), "Anomaly score must be a float"
        assert is_anomaly in (0, 1)
        print(f"  * Isolation Forest Anomaly Score: {anomaly_score:.4f}, Anomaly Flag: {is_anomaly}")

        # ---------------------------------------------------------------------
        # 5. SHAP EXPLANATION
        # ---------------------------------------------------------------------
        print("\n[Step 5] SHAP Feature Attribution Breakdown")
        top_factors = tx_result.get("top_factors", [])
        assert len(top_factors) > 0, "SHAP top factors must be returned"
        print(f"  * Retrieved {len(top_factors)} SHAP contributing features:")
        for idx, factor in enumerate(top_factors[:3]):
            assert "feature" in factor
            assert "contribution" in factor
            assert "direction" in factor
            print(f"    {idx+1}. {factor['feature']}: {factor['contribution']:+.4f} ({factor['direction']})")

        # ---------------------------------------------------------------------
        # 6. NETWORK ANALYSIS
        # ---------------------------------------------------------------------
        print(f"\n[Step 6] Network Graph Topology Analysis (Wallet: {sender_wallet['id']})")
        wallet_node_res = client.get(f"/api/v1/network/wallet/{sender_wallet['id']}", headers=analyst_headers)
        assert wallet_node_res.status_code == 200, f"Wallet node query failed: {wallet_node_res.text}"
        node_metrics = wallet_node_res.json()
        assert "in_degree" in node_metrics
        assert "out_degree" in node_metrics
        assert "total_inflow" in node_metrics
        assert "total_outflow" in node_metrics
        print(f"  * In-degree: {node_metrics['in_degree']}, Out-degree: {node_metrics['out_degree']}, Inflow: BDT {node_metrics['total_inflow']:,.2f}, Outflow: BDT {node_metrics['total_outflow']:,.2f}")

        # Check multi-hop subgraph
        subgraph_res = client.get("/api/v1/network/subgraph?depth=2", headers=analyst_headers)
        assert subgraph_res.status_code == 200
        subgraph_data = subgraph_res.json()
        assert len(subgraph_data["nodes"]) > 0
        assert len(subgraph_data["edges"]) > 0
        print(f"  * 3D Graph Subgraph: {len(subgraph_data['nodes'])} nodes, {len(subgraph_data['edges'])} directed edges")

        # ---------------------------------------------------------------------
        # 7. SUPABASE / REPOSITORY PERSISTENCE
        # ---------------------------------------------------------------------
        print(f"\n[Step 7] Repository Persistence Verification (ID: {tx_id})")
        persisted_tx = repo.get_transaction(tx_id)
        assert persisted_tx is not None, "Transaction record must be persisted in repository"
        assert persisted_tx["id"] == tx_id
        assert float(persisted_tx["amount"]) == synthetic_amount
        assert persisted_tx["sender_wallet_id"] == sender_wallet["id"]
        assert persisted_tx["receiver_wallet_id"] == receiver_wallet["id"]
        print(f"  * Confirmed persisted record in database: Hash={persisted_tx.get('tx_hash')}, Amount={persisted_tx['amount']}")

        # ---------------------------------------------------------------------
        # 8. DASHBOARD
        # ---------------------------------------------------------------------
        print("\n[Step 8] Dashboard Aggregations & Trends")
        summary_res = client.get("/api/v1/risk/summary", headers=analyst_headers)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert summary["total_analyzed"] > 0
        assert "average_risk_score" in summary
        print(f"  * Total Analyzed: {summary['total_analyzed']}, Average Risk: {summary['average_risk_score']:.4f}")

        trends_res = client.get("/api/v1/risk/trends?timeframe=7d", headers=analyst_headers)
        assert trends_res.status_code == 200
        assert len(trends_res.json()["points"]) > 0
        print(f"  * Risk Trends Time-series Points: {len(trends_res.json()['points'])}")

        # ---------------------------------------------------------------------
        # 9. TRANSACTION DETAILS
        # ---------------------------------------------------------------------
        print(f"\n[Step 9] Transaction Detailed View & Risk Breakdown (/api/v1/transactions/{tx_id})")
        detail_res = client.get(f"/api/v1/transactions/{tx_id}", headers=analyst_headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == tx_id

        risk_view_res = client.get(f"/api/v1/risk/{tx_id}", headers=analyst_headers)
        assert risk_view_res.status_code == 200
        risk_view = risk_view_res.json()
        assert risk_view["transaction_id"] == tx_id
        assert "top_contributing_features" in risk_view
        print(f"  * Verified deep transaction breakdown: Status={detail['status']}, Top Factors={len(risk_view['top_contributing_features'])}")

        # ---------------------------------------------------------------------
        # 10. INVESTIGATION CASE CREATION & STATE MACHINE (OPEN -> INVESTIGATING)
        # ---------------------------------------------------------------------
        print("\n[Step 10] Investigation Case Lifecycle")
        case_create_payload = {
            "title": f"Forensic Investigation for TX-{tx_id[:8]}",
            "description": f"Auto-escalated investigation for synthetic transaction {tx_id} with risk score {risk_score:.4f}.",
            "primary_transaction_id": tx_id,
            "target_wallet_id": sender_wallet["id"],
            "priority": "HIGH"
        }
        case_res = client.post("/api/v1/investigations", headers=analyst_headers, json=case_create_payload)
        assert case_res.status_code == 201, f"Case creation failed: {case_res.text}"
        case_obj = case_res.json()
        case_id = case_obj["id"]
        assert case_obj["status"] == "OPEN", "Initial case state must be OPEN"
        print(f"  * Case Created: {case_id} [Status: {case_obj['status']}, Priority: {case_obj['priority']}]")

        # State Transition: OPEN -> INVESTIGATING
        t1_res = client.patch(
            f"/api/v1/investigations/{case_id}",
            headers=analyst_headers,
            json={"status": "INVESTIGATING", "analyst_comment": "Analyst initiated forensic triage."}
        )
        assert t1_res.status_code == 200
        assert t1_res.json()["status"] == "INVESTIGATING"
        print(f"  * Transitioned: OPEN --> INVESTIGATING")

        # ---------------------------------------------------------------------
        # 11. AI INVESTIGATION ASSISTANT
        # ---------------------------------------------------------------------
        print("\n[Step 11] Guarded AI Copilot Synthesis (/api/v1/ai/investigate)")
        ai_req = {
            "case_id": case_id,
            "question": "What is the primary fraud typology hypothesis based on the SHAP feature contributions?",
            "focus_area": "MULE_STRUCTURING_ANALYSIS"
        }
        ai_res = client.post("/api/v1/ai/investigate", headers=analyst_headers, json=ai_req)
        assert ai_res.status_code == 200, f"AI copilot failed: {ai_res.text}"
        ai_data = ai_res.json()["data"]
        assert "typology_hypothesis" in ai_data
        assert "confidence_level" in ai_data
        assert ai_data["confidence_level"] in ("LOW", "MEDIUM", "HIGH")
        assert "recommended_actions" in ai_data
        assert len(ai_data["recommended_actions"]) > 0
        print(f"  * AI Typology Hypothesis: {ai_data['typology_hypothesis']}")
        print(f"  * Copilot Confidence Level: {ai_data['confidence_level']}")
        print(f"  * Action Recommendations: {ai_data['recommended_actions'][:2]}")

        # ---------------------------------------------------------------------
        # 12. ANALYST NOTES
        # ---------------------------------------------------------------------
        print(f"\n[Step 12] Analyst Forensic Notes (/api/v1/investigations/{case_id}/notes)")
        note_content = (
            f"Analyst review confirms anomalous nocturnal transaction of BDT {synthetic_amount:,.2f}. "
            f"SHAP velocity deviation and receiver profile cross-referenced with NetworkX subgraph."
        )
        note_res = client.post(
            f"/api/v1/investigations/{case_id}/notes",
            headers=analyst_headers,
            json={"content": note_content}
        )
        assert note_res.status_code == 201
        note_data = note_res.json()
        assert note_data["case_id"] == case_id
        assert note_data["content"] == note_content

        # Verify note is present in case record
        case_check_res = client.get(f"/api/v1/investigations/{case_id}", headers=analyst_headers)
        assert case_check_res.status_code == 200
        case_detail = case_check_res.json()
        assert len(case_detail["notes"]) >= 1
        assert any(n["id"] == note_data["id"] for n in case_detail["notes"])
        print(f"  * Persisted Analyst Note: ID={note_data['id']}, Author={note_data['author_id']}, Case Notes Count={len(case_detail['notes'])}")

        # ---------------------------------------------------------------------
        # 13. CASE RESOLUTION (INVESTIGATING -> REVIEWED -> CLOSED)
        # ---------------------------------------------------------------------
        print("\n[Step 13] Case Resolution State Transitions")
        # INVESTIGATING -> REVIEWED
        t2_res = client.patch(
            f"/api/v1/investigations/{case_id}",
            headers=analyst_headers,
            json={"status": "REVIEWED", "analyst_comment": "Case evidence compiled and forwarded for closure."}
        )
        assert t2_res.status_code == 200
        assert t2_res.json()["status"] == "REVIEWED"
        print(f"  * Transitioned: INVESTIGATING --> REVIEWED")

        # REVIEWED -> CLOSED (Requires explicit resolution)
        t3_res = client.patch(
            f"/api/v1/investigations/{case_id}",
            headers=analyst_headers,
            json={
                "status": "CLOSED",
                "resolution": "CONFIRMED_FRAUD",
                "analyst_comment": "Confirmed unauthorized nocturnal cash-out syndicate activity."
            }
        )
        assert t3_res.status_code == 200
        closed_case = t3_res.json()
        assert closed_case["status"] == "CLOSED"
        assert closed_case["resolution"] == "CONFIRMED_FRAUD"
        print(f"  * Transitioned: REVIEWED --> CLOSED (Resolution: {closed_case['resolution']})")

        # ---------------------------------------------------------------------
        # 14. AUDIT LOG VERIFICATION
        # ---------------------------------------------------------------------
        print("\n[Step 14] Immutable Audit Trail Verification")
        audit_res = client.get("/api/v1/audit/logs", headers=admin_headers)
        assert audit_res.status_code == 200
        audit_logs = audit_res.json()
        assert "logs" in audit_logs or "items" in audit_logs or isinstance(audit_logs, list)

        # Confirm audit events recorded in audit service
        all_events = get_audit_service().list_logs(limit=50).items
        action_names = [e.action for e in all_events]
        assert "TRANSACTION_ANALYZED" in action_names
        assert "CASE_STATUS_UPDATED" in action_names or "CASE_CREATED" in action_names
        print(f"  * Verified immutable audit log stream with {len(all_events)} recorded lifecycle events")
        print("\n[SUCCESS] FLOW 1 COMPLETE: All 14 stages successfully validated with real application data.")


# =============================================================================
# FLOW 2: CUSTOMER AI ASSISTANT & KNOWLEDGE RETRIEVAL PIPELINE
# =============================================================================

class TestFlow2CustomerAIAssistantPipeline:
    """End-to-end integration test of the Customer AI Chatbot and RAG semantic pipeline."""

    def test_complete_customer_ai_assistant_pipeline(self, client):
        print("\n=======================================================")
        print("STARTING FLOW 2: CUSTOMER AI ASSISTANT & KNOWLEDGE PIPELINE")
        print("=======================================================")

        # ---------------------------------------------------------------------
        # 1. CUSTOMER IDENTITY & SESSION INITIATION
        # ---------------------------------------------------------------------
        print("\n[Step 1] Customer Interaction Initiation")
        customer_id = "cust-01711223344"
        test_session_id = f"sess-e2e-{uuid.uuid4().hex[:8]}"
        user_inquiry = "Why was my transaction flagged for risk?"
        print(f"  * Customer ID: {customer_id}")
        print(f"  * Session ID: {test_session_id}")
        print(f"  * Inquiry: \"{user_inquiry}\"")

        # ---------------------------------------------------------------------
        # 2 & 3. AI ASSISTANT MESSAGE & SUPABASE CHAT SESSION
        # ---------------------------------------------------------------------
        print("\n[Steps 2 & 3] Processing via Chat API (/api/v1/chat/message)")
        chat_payload = {
            "message": user_inquiry,
            "session_id": test_session_id,
            "language": "en"
        }
        chat_res = client.post("/api/v1/chat/message", json=chat_payload)
        assert chat_res.status_code == 200, f"Chat message processing failed: {chat_res.text}"
        chat_data = chat_res.json()

        message_id = chat_data["id"]
        session_id = chat_data["session_id"]
        assert session_id == test_session_id
        assert message_id is not None
        print(f"  * Message ID: {message_id}")
        print(f"  * Session Verified: {session_id}")

        # Verify chat session persistence
        sessions_list_res = client.get("/api/v1/chat/sessions")
        assert sessions_list_res.status_code == 200
        session_items = sessions_list_res.json()["sessions"]
        matching_session = next((s for s in session_items if s["id"] == session_id), None)
        assert matching_session is not None, "Created session must appear in session ledger"
        print(f"  * Confirmed Session in Store: Title=\"{matching_session['title']}\", Messages={matching_session['message_count']}")

        # Verify chat history
        history_res = client.get(f"/api/v1/chat/sessions/{session_id}")
        assert history_res.status_code == 200
        history_data = history_res.json()
        assert len(history_data["messages"]) >= 2 # 1 user message + 1 assistant response
        print(f"  * Verified Conversation History: {len(history_data['messages'])} recorded turns")

        # ---------------------------------------------------------------------
        # 4. KNOWLEDGE RETRIEVAL (RAG CITATIONS)
        # ---------------------------------------------------------------------
        print("\n[Step 4] Hybrid Semantic & Keyword Knowledge Retrieval")
        citations = chat_data.get("citations", [])
        assert len(citations) > 0, "Grounding citations must be retrieved from verified knowledge base"
        primary_citation = citations[0]
        assert "title" in primary_citation
        assert "source" in primary_citation
        assert "category" in primary_citation
        assert "similarity_score" in primary_citation
        print(f"  * Primary Retrieved Citation: \"{primary_citation['title']}\"")
        print(f"  * Source Document: {primary_citation['source']} [{primary_citation['category']}]")
        print(f"  * Vector Cosine Similarity Score: {primary_citation['similarity_score']:.3f}")

        # ---------------------------------------------------------------------
        # 5. GEMINI GROUNDED ANSWER GENERATION
        # ---------------------------------------------------------------------
        print("\n[Step 5] Grounded Answer Verification")
        answer_content = chat_data["content"]
        assert len(answer_content) > 50, "Assistant response must be comprehensive"
        # Must reflect grounding keywords
        assert any(k in answer_content.lower() for k in ["velocity", "outlier", "nocturnal", "mule", "flag", "risk"])
        # Invariant checks: Zero secret disclosure
        assert "postgres" not in answer_content.lower()
        assert "password" not in answer_content.lower()
        assert "service_role" not in answer_content.lower()
        # Must contain hackathon disclaimer
        assert "disclaimer" in chat_data
        assert "UpayAche" in chat_data["disclaimer"]
        print(f"  * Grounded Response Snippet: \"{answer_content[:140]}...\"")
        print(f"  * Confidence Tier: {chat_data['confidence_tier']}")

        # ---------------------------------------------------------------------
        # 6. CITATION CONTRACT
        # ---------------------------------------------------------------------
        print("\n[Step 6] Citation Transparency & Provenance")
        assert len(citations) >= 1
        for c in citations:
            assert c["snippet"] is not None and len(c["snippet"]) > 10
            print(f"  * Citation [{c['document_id']}]: {c['title']} (Score: {c['similarity_score']})")

        # ---------------------------------------------------------------------
        # 7. USER FEEDBACK
        # ---------------------------------------------------------------------
        print(f"\n[Step 7] User Feedback Submission (/api/v1/chat/feedback)")
        feedback_payload = {
            "message_id": message_id,
            "rating": 1, # Thumbs up
            "feedback_text": "Extremely clear explanation of why high velocity causes a temporary risk flag."
        }
        feedback_res = client.post("/api/v1/chat/feedback", json=feedback_payload)
        assert feedback_res.status_code == 200, f"Feedback submission failed: {feedback_res.text}"
        feedback_data = feedback_res.json()
        assert feedback_data["status"] in ("RECORDED", "SUCCESS")
        assert feedback_data["message_id"] == message_id

        # Verify audit event for feedback
        recent_events = get_audit_service().list_logs(limit=50).items
        feedback_events = [e for e in recent_events if e.action == "CHAT_FEEDBACK_RECORDED"]
        assert len(feedback_events) > 0, "Audit trail must record customer feedback submission"
        print(f"  * Feedback successfully recorded in session store and audit ledger.")

        print("\n[SUCCESS] FLOW 2 COMPLETE: Customer interaction, RAG retrieval, Gemini grounding, and feedback fully validated.")
        print("=======================================================\n")
