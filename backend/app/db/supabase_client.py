"""
UpayAche — Supabase PostgREST Client Adapter.
Enforces Server-Side Privileged Integration:
Frontend -> FastAPI -> Supabase PostgreSQL.

CRITICAL SECURITY INVARIANTS:
1. This module runs SOLELY on the FastAPI backend server.
2. Uses SUPABASE_SERVICE_ROLE_KEY for server-to-server calls.
3. NEVER expose SUPABASE_SERVICE_ROLE_KEY or credentials to the browser or frontend.
4. Resilient graceful degradation: If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not
   provided or the remote cluster is unreachable, functions gracefully fall back
   to the local in-memory/CSV repository.
"""

import logging
from typing import Dict, List, Optional, Any

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore

from app.core.config import settings

logger = logging.getLogger("upayache.supabase")


class SupabaseClient:
    """
    Lightweight, dependency-free HTTP PostgREST client for Supabase PostgreSQL.
    Communicates securely with Supabase REST API using the backend service role key.
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        service_role_key: Optional[str] = None,
        timeout: float = 8.0
    ):
        self.url = (supabase_url or settings.SUPABASE_URL).rstrip("/")
        self.key = service_role_key or settings.SUPABASE_SERVICE_ROLE_KEY
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Verify whether valid Supabase server credentials are present."""
        return (
            httpx is not None
            and bool(self.url)
            and bool(self.key)
            and "your-project" not in self.url
            and "placeholder" not in self.url
            and "your-supabase-service-role-key" not in self.key
        )


    def _get_headers(self, prefer_return: bool = True) -> Dict[str, str]:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if prefer_return:
            headers["Prefer"] = "return=representation"
        return headers

    # -------------------------------------------------------------------------
    # Wallets
    # -------------------------------------------------------------------------

    def get_wallets(self, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/wallets?select=*&limit={limit}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Supabase get_wallets returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase get_wallets failed: {e}")
        return None

    # -------------------------------------------------------------------------
    # Transactions
    # -------------------------------------------------------------------------

    def get_transactions(self, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/transactions?select=*&order=timestamp.desc&limit={limit}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Supabase get_transactions returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase get_transactions failed: {e}")
        return None

    # -------------------------------------------------------------------------
    # Investigation Cases
    # -------------------------------------------------------------------------

    def get_cases(self) -> Optional[List[Dict[str, Any]]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/investigation_cases?select=*,notes:investigation_notes(*)&order=created_at.desc"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Supabase get_cases returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase get_cases failed: {e}")
        return None

    def insert_case(self, case_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/investigation_cases"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(endpoint, json=case_data, headers=self._get_headers())
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
                logger.warning(f"Supabase insert_case returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase insert_case failed: {e}")
        return None

    def update_case(self, case_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/investigation_cases?id=eq.{case_id}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.patch(endpoint, json=updates, headers=self._get_headers())
                if res.status_code in (200, 204):
                    data = res.json() if res.content else None
                    return data[0] if isinstance(data, list) and data else data
                logger.warning(f"Supabase update_case returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase update_case failed: {e}")
        return None

    # -------------------------------------------------------------------------
    # Investigation Notes
    # -------------------------------------------------------------------------

    def insert_note(self, note_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/investigation_notes"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(endpoint, json=note_data, headers=self._get_headers())
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
                logger.warning(f"Supabase insert_note returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase insert_note failed: {e}")
        return None

    # -------------------------------------------------------------------------
    # Audit Logs (Immutable Append-Only)
    # -------------------------------------------------------------------------

    def insert_audit_log(self, log_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/audit_logs"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(endpoint, json=log_data, headers=self._get_headers())
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
                logger.warning(f"Supabase insert_audit_log returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase insert_audit_log failed: {e}")
        return None

    # -------------------------------------------------------------------------
    # Knowledge Documents & Chunks (RAG)
    # -------------------------------------------------------------------------

    def upsert_knowledge_document(self, doc_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/knowledge_documents"
        headers = self._get_headers(prefer_return=True)
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(endpoint, json=doc_data, headers=headers)
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
                logger.warning(f"Supabase upsert_knowledge_document returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase upsert_knowledge_document failed: {e}")
        return None

    def delete_knowledge_chunks(self, document_id: str) -> bool:
        if not self.is_configured:
            return False
        endpoint = f"{self.url}/rest/v1/knowledge_chunks?document_id=eq.{document_id}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.delete(endpoint, headers=self._get_headers())
                return res.status_code in (200, 204)
        except Exception as e:
            logger.warning(f"Supabase delete_knowledge_chunks failed: {e}")
            return False

    def insert_knowledge_chunks(self, chunks_data: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        if not self.is_configured or not chunks_data:
            return None
        endpoint = f"{self.url}/rest/v1/knowledge_chunks"
        headers = self._get_headers(prefer_return=False)
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(endpoint, json=chunks_data, headers=headers)
                if res.status_code in (200, 201, 204):
                    return chunks_data
                logger.warning(f"Supabase insert_knowledge_chunks returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Supabase insert_knowledge_chunks failed: {e}")
        return None


# Global singleton instance
_supabase_client_instance: Optional[SupabaseClient] = None

def get_supabase_client() -> SupabaseClient:
    global _supabase_client_instance
    if _supabase_client_instance is None:
        _supabase_client_instance = SupabaseClient()
    return _supabase_client_instance

