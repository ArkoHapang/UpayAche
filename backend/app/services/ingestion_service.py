"""
UpayAche — Knowledge Ingestion & Chunking Service.
Extracts verified knowledge from project documentation, README, ML, API, security,
and multilingual FAQ/scam playbooks.
Chunks, embeds, and stores documents into Supabase pgvector and in-memory RAG index.
Idempotent: Running ingestion repeatedly produces zero duplicate documents or chunks.
"""

import os
import re
import uuid
import hashlib
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone

from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.rag_service import compute_deterministic_embedding, get_rag_service

logger = logging.getLogger("upayache.ingestion")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"

CATEGORIES = [
    "risk", "transaction", "anomaly", "network", "scam", "security",
    "investigation", "AI", "ML", "SHAP", "customer-support", "privacy",
    "responsible-ai", "general"
]


class IngestionStats:
    def __init__(self):
        self.documents_processed = 0
        self.chunks_created = 0
        self.embeddings_created = 0
        self.documents_skipped = 0
        self.errors: List[str] = []

    def summary(self) -> Dict[str, Any]:
        return {
            "documents_processed": self.documents_processed,
            "chunks_created": self.chunks_created,
            "embeddings_created": self.embeddings_created,
            "documents_skipped": self.documents_skipped,
            "errors_count": len(self.errors),
            "errors": self.errors
        }


def generate_doc_id(source: str, title: str, category: str, language: str) -> str:
    """Generate a deterministic UUIDv5 for document idempotency."""
    key = f"upayache:doc:{source.strip()}:{title.strip()}:{category.strip()}:{language.strip()}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def generate_chunk_id(doc_id: str, chunk_index: int) -> str:
    """Generate a deterministic UUIDv5 for chunk idempotency."""
    key = f"upayache:chunk:{doc_id}:{chunk_index}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def chunk_text(text: str, max_chars: int = 700, min_chars: int = 150) -> List[str]:
    """
    Split text into logical, semantically coherent chunks.
    Respects markdown paragraphs and section boundaries.
    """
    # Split by double newline or headers
    raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n|(?=^#{2,4}\s)", text, flags=re.MULTILINE) if p.strip()]
    chunks: List[str] = []
    current_chunk = ""

    for p in raw_paragraphs:
        if not current_chunk:
            current_chunk = p
        elif len(current_chunk) + len(p) + 2 <= max_chars:
            current_chunk += "\n\n" + p
        else:
            if len(current_chunk) >= min_chars:
                chunks.append(current_chunk)
            current_chunk = p

    if current_chunk and len(current_chunk) >= min_chars:
        chunks.append(current_chunk)
    elif current_chunk and chunks:
        # Append remaining short text to previous chunk
        chunks[-1] += "\n\n" + current_chunk
    elif current_chunk:
        chunks.append(current_chunk)

    return chunks or [text[:max_chars]]


class IngestionService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.rag = get_rag_service()
        self._processed_hashes: Dict[str, str] = {}

    def load_seed_documents(self) -> List[Dict[str, Any]]:
        """
        Gathers raw knowledge documents from the 12 required sources:
        1. UpayAche project documentation
        2. UpayAche README
        3. API documentation
        4. ML model documentation
        5. Risk engine documentation
        6. Network analysis documentation
        7. SHAP explainability documentation
        8. Investigation workflow documentation
        9. Responsible AI/security documentation
        10. Synthetic-data documentation
        11. Customer FAQ content (English, Bangla, Banglish)
        12. Scam-awareness content (English, Bangla, Banglish)
        """
        raw_docs: List[Dict[str, Any]] = []

        # 1. Project README
        readme_path = PROJECT_ROOT / "README.md"
        if readme_path.exists():
            content = readme_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "UpayAche Overview & Core Architecture",
                "source": "README.md",
                "category": "general",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 2. PRD Documentation (Project Requirements & Investigation Workflow)
        prd_path = DOCS_DIR / "PRD.md"
        if prd_path.exists():
            content = prd_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "Product Requirements & Operator Workflows",
                "source": "docs/PRD.md",
                "category": "investigation",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 3. System Architecture Documentation
        arch_path = DOCS_DIR / "ARCHITECTURE.md"
        if arch_path.exists():
            content = arch_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "System Component & Dataflow Architecture",
                "source": "docs/ARCHITECTURE.md",
                "category": "AI",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 4. API Documentation
        api_path = DOCS_DIR / "API.md"
        if api_path.exists():
            content = api_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "REST API Contracts & Endpoints",
                "source": "docs/API.md",
                "category": "general",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 5. ML & Risk Engine Documentation
        ml_path = DOCS_DIR / "ML.md"
        if ml_path.exists():
            content = ml_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "ML Model Architecture & XGBoost Training",
                "source": "docs/ML.md",
                "category": "ML",
                "language": "en",
                "version": "v1.0",
                "content": content
            })
            raw_docs.append({
                "title": "ML Risk Engine & 24-Dimensional Features",
                "source": "docs/ML.md",
                "category": "risk",
                "language": "en",
                "version": "v1.0",
                "content": content
            })
            raw_docs.append({
                "title": "Behavioral Anomaly Detection (Isolation Forest)",
                "source": "docs/ML.md",
                "category": "anomaly",
                "language": "en",
                "version": "v1.0",
                "content": content
            })


        # 6. Graph & Network Analysis Documentation
        graph_path = DOCS_DIR / "GRAPH.md"
        if graph_path.exists():
            content = graph_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "Network Analysis & Graph Intelligence",
                "source": "docs/GRAPH.md",
                "category": "network",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 7. AI & SHAP Explainability Documentation
        ai_path = DOCS_DIR / "AI.md"
        if ai_path.exists():
            content = ai_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "SHAP Explainability & Gemini Copilot Guardrails",
                "source": "docs/AI.md",
                "category": "SHAP",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 8. Security & Responsible AI Documentation
        sec_path = DOCS_DIR / "SECURITY.md"
        if sec_path.exists():
            content = sec_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "Security Model, RBAC & Responsible AI Principles",
                "source": "docs/SECURITY.md",
                "category": "responsible-ai",
                "language": "en",
                "version": "v1.0",
                "content": content
            })
            raw_docs.append({
                "title": "Zero PII & Data Privacy Standards",
                "source": "docs/SECURITY.md",
                "category": "privacy",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 9. Synthetic Data & Database Documentation
        db_path = DOCS_DIR / "DATABASE.md"
        if db_path.exists():
            content = db_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "Synthetic Data Generation & Supabase Schema",
                "source": "docs/DATABASE.md",
                "category": "transaction",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 10. QA & Acceptance Testing
        qa_path = DOCS_DIR / "QA.md"
        if qa_path.exists():
            content = qa_path.read_text(encoding="utf-8")
            raw_docs.append({
                "title": "Quality Assurance & State Machine Testing",
                "source": "docs/QA.md",
                "category": "investigation",
                "language": "en",
                "version": "v1.0",
                "content": content
            })

        # 11. Customer FAQ Content (English, Bangla, Banglish)
        raw_docs.extend(self._get_customer_faq_documents())

        # 12. Scam Awareness Content (English, Bangla, Banglish)
        raw_docs.extend(self._get_scam_awareness_documents())

        return raw_docs

    def _get_customer_faq_documents(self) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Customer FAQ: Why Was My Transaction Flagged?",
                "source": "UpayAche Customer Support Guide",
                "category": "customer-support",
                "language": "en",
                "version": "v1.0",
                "content": (
                    "Why was my transaction flagged? In UpayAche, transactions are automatically flagged if our "
                    "ML engine detects unexpected transaction velocity (multiple transfers in a short window), an unusually large amount "
                    "compared to your previous history, nocturnal activity (between 1:00 AM and 5:00 AM), or routing through counterparties "
                    "associated with previous suspicious alerts. A flag does not cancel your transfer automatically; it triggers human analyst "
                    "review to keep your account safe from unauthorized takeovers."
                )
            },
            {
                "title": "গ্রাহক প্রশ্নোত্তর: আমার ট্রানজেকশন কেন ফ্ল্যাগ করা হয়েছে? (Bangla FAQ)",
                "source": "UpayAche বাংলা গ্রাহক সহায়তা",
                "category": "customer-support",
                "language": "bn",
                "version": "v1.0",
                "content": (
                    "আমার ট্রানজেকশন কেন ফ্ল্যাগ করা হয়েছে? আপনার অ্যাকাউন্টের সুরক্ষার জন্য UpayAche এর এআই রিস্ক ইঞ্জিন "
                    "লেনদেনের গতিবিধি পর্যবেক্ষণ করে। যদি হঠাৎ অনেক বেশি টাকা লেনদেন হয়, অল্প সময়ে বারবার ক্যাশ আউট করা হয়, অথবা গভীর রাতে "
                    "অস্বাভাবিক লেনদেন হয়, তবে সিস্টেম সতর্কতামূলকভাবে ফ্ল্যাগ করে। এর অর্থ টাকা আটকে যাওয়া নয়, বরং কোনো অপরাধী যেন আপনার "
                    "অ্যাকাউন্ট ব্যবহার করতে না পারে তা নিশ্চিত করা।"
                )
            },
            {
                "title": "Customer FAQ: Amar Transaction Flag Holo Keno? (Banglish FAQ)",
                "source": "UpayAche Banglish FAQ",
                "category": "customer-support",
                "language": "banglish",
                "version": "v1.0",
                "content": (
                    "Amar transaction flag holo keno? Apnar account er security er jonno UpayAche AI engine transaction analyze kore. "
                    "Jodi hotath apnar normal habit er cheye onek beshi taka pathano hoy, midnight e cash out kora hoy, ba shonge shonge bar bar "
                    "transfer kora hoy, tahole risk alert toiri hoy. Ete bhoy paoar kichu nei; eta apnar wallet er protection er jonno kora hoy."
                )
            },
            {
                "title": "Customer FAQ: PIN and OTP Security Best Practices",
                "source": "UpayAche Customer Support Guide",
                "category": "security",
                "language": "en",
                "version": "v1.0",
                "content": (
                    "How should I protect my wallet PIN and OTP? Always keep your 4-digit PIN confidential. Do not share your PIN with friends, "
                    "family, or agents. Official customer care will NEVER ask for your PIN or OTP. If anyone calls claiming you won a prize or that "
                    "your account will be frozen unless you share an OTP, hang up immediately. If your phone is lost, call official helpline 16268."
                )
            }
        ]

    def _get_scam_awareness_documents(self) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Scam Playbook: Recognizing OTP & Prize Phishing",
                "source": "UpayAche Anti-Fraud Playbook",
                "category": "scam",
                "language": "en",
                "version": "v1.0",
                "content": (
                    "Common MFS scam schemes: 1) Fake Lottery Calls: Callers claiming you won money from a telecom campaign and asking for your "
                    "OTP to disburse the prize. 2) Mistaken Cash-In: Fraudsters send a fake SMS that looks like an official cash-in message, then call "
                    "crying that they mistakenly sent money to your number and ask you to send it back. Always check your actual balance via *268# or app. "
                    "3) Emergency Relative Distress: Scammers claiming a loved one is in the hospital and needs urgent funds."
                )
            },
            {
                "title": "প্রতারণা সচেতনতা: ওটিপি এবং ভুয়া লটারি জালিয়াতি (Bangla Scam Guide)",
                "source": "UpayAche বাংলা সচেতনতা প্লেবুক",
                "category": "scam",
                "language": "bn",
                "version": "v1.0",
                "content": (
                    "এমএফএস প্রতারকদের চেনার উপায়: ১) ভুয়া লটারি কল: আপনি পুরস্কার জিতেছেন বলে ওটিপি চাওয়া হলে কখনই দিবেন না। "
                    "২) ভুল করে টাকা পাঠানো প্রতারণা: প্রতারকরা প্রথমে একটি ভুয়া এসএমএস পাঠায় যাতে মনে হয় টাকা এসেছে, এরপর ফোন করে কান্নাকাটি করে "
                    "টাকা ফেরত চায়। কোনো টাকা পাঠানোর আগে নিজের মূল ব্যালেন্স চেক করুন। ৩) আত্মীয়ের দুর্ঘটনার ভুয়া খবর: অপরিচিত কারো কথায় বিচলিত না হয়ে "
                    "সরাসরি আপনার আত্মীয়ের ব্যক্তিগত নম্বরে কল করে সত্যতা যাচাই করুন।"
                )
            },
            {
                "title": "Scam Awareness: OTP Share Korle Ki Hobe? (Banglish Scam Guide)",
                "source": "UpayAche Banglish Scam Playbook",
                "category": "scam",
                "language": "banglish",
                "version": "v1.0",
                "content": (
                    "OTP share korle ki hobe? Jodi apnar mobile e asha OTP (One Time Password) karo shathe share koren, tahole fraudster ra "
                    "apnar wallet access niye shob taka tulte parbe. Kono lottery ba customer care er name OTP chaile kokhono share korben na. "
                    "Mone rakhben: official upay helpline 16268 chara onno kono unknown number er kotha biswash korben na."
                )
            },
            {
                "title": "Mule Accounts: Legal Liabilities & Smurfing Risks",
                "source": "UpayAche Compliance & AML Bulletin",
                "category": "network",
                "language": "en",
                "version": "v1.0",
                "content": (
                    "What is a mule account? A mule account is a wallet used to receive and transfer illegal funds on behalf of fraudsters. "
                    "Criminals frequently recruit students or vulnerable individuals with promises of commissions (e.g. 5% reward). Under Bangladesh "
                    "Money Laundering Prevention Act, operating a mule wallet is a severe criminal offense resulting in account seizure and prosecution. "
                    "Never let anyone route funds through your personal MFS wallet."
                )
            }
        ]

    def ingest_all(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Executes idempotent knowledge ingestion across all 12 sources.
        Returns detailed summary statistics.
        """
        stats = IngestionStats()
        docs = self.load_seed_documents()
        logger.info(f"Starting knowledge ingestion for {len(docs)} source documents...")

        all_ingested_chunks: List[Dict[str, Any]] = []

        for doc_raw in docs:
            try:
                title = doc_raw["title"]
                source = doc_raw["source"]
                category = doc_raw["category"]
                language = doc_raw.get("language", "en")
                version = doc_raw.get("version", "v1.0")
                content = doc_raw["content"].strip()

                doc_id = generate_doc_id(source, title, category, language)
                content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

                # Idempotency check: Skip unchanged documents unless force_refresh is requested
                if not force_refresh and self._processed_hashes.get(doc_id) == content_hash:
                    stats.documents_skipped += 1
                    continue

                # 1. Chunk document
                chunks_text = chunk_text(content)
                if not chunks_text:
                    stats.documents_skipped += 1
                    continue

                stats.documents_processed += 1
                self._processed_hashes[doc_id] = content_hash

                # 2. Prepare database document payload
                now_str = datetime.now(timezone.utc).isoformat()
                doc_payload = {
                    "id": doc_id,
                    "title": title,
                    "source": source,
                    "category": category,
                    "content": content[:1200], # truncated summary for document table
                    "language": language,
                    "version": version,
                    "is_active": True,
                    "updated_at": now_str
                }

                # Store in Supabase if configured
                if self.supabase.is_configured:
                    self.supabase.upsert_knowledge_document(doc_payload)
                    self.supabase.delete_knowledge_chunks(doc_id)

                # 3. Process each chunk & compute embedding
                doc_chunks_payload = []
                for idx, c_text in enumerate(chunks_text):
                    chunk_id = generate_chunk_id(doc_id, idx)
                    # Compute 768-dim normalized embedding
                    emb = compute_deterministic_embedding(f"{title} {category} {c_text}")
                    stats.embeddings_created += 1
                    stats.chunks_created += 1

                    chunk_obj = {
                        "id": chunk_id,
                        "document_id": doc_id,
                        "chunk_index": idx,
                        "title": title,
                        "source": source,
                        "category": category,
                        "language": language,
                        "content": c_text,
                        "embedding": emb,
                        "metadata": {
                            "source": source,
                            "title": title,
                            "category": category,
                            "language": language,
                            "chunk_index": idx,
                            "total_chunks": len(chunks_text)
                        },
                        "created_at": now_str
                    }
                    doc_chunks_payload.append(chunk_obj)
                    all_ingested_chunks.append(chunk_obj)

                # Store chunks in Supabase if configured
                if self.supabase.is_configured and doc_chunks_payload:
                    supabase_chunks = [
                        {
                            "id": c["id"],
                            "document_id": c["document_id"],
                            "chunk_index": c["chunk_index"],
                            "content": c["content"],
                            "embedding": c["embedding"],
                            "metadata": c["metadata"],
                            "created_at": c["created_at"]
                        }
                        for c in doc_chunks_payload
                    ]
                    self.supabase.insert_knowledge_chunks(supabase_chunks)

            except Exception as e:
                err_msg = f"Failed to ingest document '{doc_raw.get('title', 'Unknown')}': {str(e)}"
                logger.error(err_msg)
                stats.errors.append(err_msg)

        # Update in-memory RAG index with the fresh chunks
        if all_ingested_chunks:
            self._update_rag_index(all_ingested_chunks)

        logger.info(
            f"Knowledge Ingestion Completed. "
            f"Processed: {stats.documents_processed} | Chunks: {stats.chunks_created} | "
            f"Embeddings: {stats.embeddings_created} | Skipped: {stats.documents_skipped} | "
            f"Errors: {len(stats.errors)}"
        )
        return stats.summary()

    def _update_rag_index(self, new_chunks: List[Dict[str, Any]]):
        """Update RAG service in-memory store dynamically."""
        existing_ids = {c["id"] for c in self.rag._chunks}
        for chunk in new_chunks:
            if chunk["id"] not in existing_ids:
                self.rag._chunks.append(chunk)
                existing_ids.add(chunk["id"])
            else:
                # Update existing chunk
                for idx, c in enumerate(self.rag._chunks):
                    if c["id"] == chunk["id"]:
                        self.rag._chunks[idx] = chunk
                        break
        logger.info(f"RAG in-memory index refreshed with {len(self.rag._chunks)} total chunks.")


_ingestion_service: Optional[IngestionService] = None

def get_ingestion_service() -> IngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = IngestionService()
    return _ingestion_service
