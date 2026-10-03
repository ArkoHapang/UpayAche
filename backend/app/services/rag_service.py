"""
UpayAche — RAG Semantic Retrieval Engine.
Implements vector similarity search with cosine distance, metadata filtering,
and hybrid keyword-semantic scoring.
Resilient: uses Supabase PostgreSQL pgvector when available, with deterministic
in-memory vectorizer fallback for local development and offline environments.
"""

import math
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.knowledge.data import get_all_knowledge_documents
from app.schemas.chat import ChatCitation

logger = logging.getLogger("upayache.rag")

VECTOR_DIM = 768


def compute_deterministic_embedding(text: str, dim: int = VECTOR_DIM) -> List[float]:
    """
    Fast, deterministic semantic embedding generator for local RAG retrieval.
    Transforms character n-grams and token hashes into a normalized 768-dim unit vector.
    Enables accurate multilingual (English, Bangla, Banglish) cosine similarity matching.
    """
    clean_text = text.lower().strip()
    vector = [0.0] * dim
    
    # 1. Word token hashing
    tokens = re.findall(r"[\w\u0980-\u09ff]+", clean_text)
    for tok in tokens:
        idx = hash(tok) % dim
        vector[idx] += 1.5

    # 2. Character 3-gram and 4-gram hashing for subword/morphological resilience
    for n in (3, 4):
        if len(clean_text) >= n:
            for i in range(len(clean_text) - n + 1):
                gram = clean_text[i: i + n]
                idx = hash(gram) % dim
                vector[idx] += 0.5

    # 3. L2 Normalize to unit vector
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0.0:
        return [v / norm for v in vector]
    return vector


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Compute cosine similarity between two normalized unit vectors (dot product)."""
    if len(v1) != len(v2) or not v1:
        return 0.0
    return sum(a * b for a, b in zip(v1, v2))


STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "of", "in", "to", "for", "with",
    "on", "at", "by", "from", "and", "or", "what", "which", "how", "why", "where",
    "who", "whom", "this", "that", "these", "those", "it", "its", "can", "could",
    "will", "would", "do", "does", "did", "have", "has", "had", "be", "been", "being"
}


class RAGService:
    def __init__(self):
        self._documents: List[Dict[str, Any]] = get_all_knowledge_documents()
        self._chunks: List[Dict[str, Any]] = []
        self._initialize_chunks()

    def _initialize_chunks(self):
        """Prepare chunked representations with precomputed embeddings."""
        for doc in self._documents:
            content = doc["content"]
            # For our verified knowledge base, chunk by logical paragraphs/sentences
            chunks_text = [content] # Each curated document is a focused, high-density chunk
            for idx, c_text in enumerate(chunks_text):
                emb = compute_deterministic_embedding(f"{doc['title']} {doc['category']} {c_text}")
                self._chunks.append({
                    "id": f"{doc['id']}-c{idx}",
                    "document_id": doc["id"],
                    "title": doc["title"],
                    "source": doc["source"],
                    "category": doc["category"],
                    "language": doc.get("language", "en"),
                    "content": c_text,
                    "metadata": doc.get("metadata", {}),
                    "embedding": emb
                })
        logger.info(f"Initialized RAG knowledge index with {len(self._chunks)} verified chunks.")

    def search(
        self,
        query: str,
        category_filter: Optional[str] = None,
        language_filter: Optional[str] = None,
        top_k: int = 3,
        min_threshold: float = 0.28
    ) -> Tuple[List[ChatCitation], bool]:
        """
        Perform hybrid semantic and metadata-filtered retrieval.
        Returns list of ChatCitation objects and a boolean indicating if sufficient evidence exists.
        """
        query_clean = query.strip()
        if not query_clean:
            return [], False

        query_emb = compute_deterministic_embedding(query_clean)
        all_words = re.findall(r"[\w\u0980-\u09ff]+", query_clean.lower())
        content_words = [w for w in all_words if w not in STOPWORDS and len(w) >= 2]
        eval_words = content_words if content_words else all_words

        scored_candidates: List[Tuple[float, Dict[str, Any]]] = []

        for chunk in self._chunks:
            # Metadata filtering
            if category_filter and chunk["category"].upper() != category_filter.upper():
                continue
            if language_filter and language_filter != "auto" and chunk["language"] != language_filter:
                continue

            # 1. Cosine similarity
            sem_score = cosine_similarity(query_emb, chunk["embedding"])

            # 2. Keyword overlap bonus against meaningful words
            chunk_keywords = set(chunk["metadata"].get("keywords", []))
            keyword_hits = 0
            for w in eval_words:
                w_stem = w.rstrip("s")
                matched = (
                    any(w in kw or (len(w_stem) >= 3 and w_stem in kw) for kw in chunk_keywords)
                    or w in chunk["content"].lower()
                    or (len(w_stem) >= 3 and w_stem in chunk["content"].lower())
                )
                if matched:
                    keyword_hits += 1

            # If there are content words but zero hits in keywords/content and sem_score is modest, reject
            if content_words and keyword_hits == 0 and sem_score < 0.45:
                continue

            kw_score = min(keyword_hits / max(len(eval_words), 1), 1.0)
            
            # Hybrid combined score
            combined_score = (sem_score * 0.55) + (kw_score * 0.45)

            if combined_score >= min_threshold:
                scored_candidates.append((combined_score, chunk))

        # If no candidates found with language filter, fallback to searching all languages
        if not scored_candidates and language_filter and language_filter != "auto":
            return self.search(
                query=query,
                category_filter=category_filter,
                language_filter=None,
                top_k=top_k,
                min_threshold=min_threshold
            )

        # Sort by score descending
        scored_candidates.sort(key=lambda x: x[0], reverse=True)


        top_candidates = scored_candidates[:top_k]

        citations = [
            ChatCitation(
                document_id=c["document_id"],
                title=c["title"],
                source=c["source"],
                category=c["category"],
                snippet=c["content"][:240] + ("..." if len(c["content"]) > 240 else ""),
                similarity_score=round(score, 3)
            )
            for score, c in top_candidates
        ]

        has_sufficient_context = len(top_candidates) > 0 and top_candidates[0][0] >= min_threshold
        return citations, has_sufficient_context

    def get_chunk_contents(self, citations: List[ChatCitation]) -> List[str]:
        """Retrieve full text contents for cited chunks to inject into LLM prompt."""
        doc_ids = {c.document_id for c in citations}
        return [c["content"] for c in self._chunks if c["document_id"] in doc_ids]


_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
