"""
UpayAche — Audit Logging Service.
Immutable append-only audit trail capturing security and compliance events.
Zero UPDATE or DELETE operations permitted by design.
"""

import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import threading

from app.schemas.audit import AuditLogResponse, AuditLogListResponse

logger = logging.getLogger("upayache.audit")


class AuditService:
    def __init__(self):
        self._lock = threading.RLock()
        self._logs: List[Dict[str, Any]] = []

    def log_event(
        self,
        actor_id: str,
        actor_role: str,
        action: str,
        resource_type: str,
        resource_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """Append an immutable audit entry."""
        with self._lock:
            log_id = str(uuid.uuid4())
            entry = {
                "id": log_id,
                "actor_id": actor_id,
                "actor_role": actor_role,
                "action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id),
                "metadata": metadata or {},
                "ip_address": ip_address,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            self._logs.append(entry)
            logger.info(f"[AUDIT] {actor_role}:{actor_id} -> {action} on {resource_type}:{resource_id}")

            # Asynchronously / opportunistically persist to Supabase if configured
            try:
                from app.db.supabase_client import get_supabase_client
                client = get_supabase_client()
                if client.is_configured:
                    client.insert_audit_log(entry)
            except Exception as e:
                logger.debug(f"Audit log Supabase remote persist skipped: {e}")

            return dict(entry)

    def list_logs(
        self,
        limit: int = 50,
        offset: int = 0,
        actor_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ) -> AuditLogListResponse:
        with self._lock:
            filtered = list(self._logs)
            if actor_id:
                filtered = [l for l in filtered if l.get("actor_id") == actor_id]
            if action:
                filtered = [l for l in filtered if l.get("action") == action]
            if resource_type:
                filtered = [l for l in filtered if l.get("resource_type") == resource_type]
            if resource_id:
                filtered = [l for l in filtered if str(l.get("resource_id")) == str(resource_id)]

            filtered.sort(key=lambda l: str(l.get("created_at", "")), reverse=True)
            total = len(filtered)
            paginated = filtered[offset: offset + limit]

            items = [
                AuditLogResponse(
                    id=l["id"],
                    actor_id=l["actor_id"],
                    actor_role=l["actor_role"],
                    action=l["action"],
                    resource_type=l["resource_type"],
                    resource_id=l["resource_id"],
                    metadata=l["metadata"],
                    ip_address=l.get("ip_address", "127.0.0.1"),
                    created_at=l["created_at"]
                )
                for l in paginated
            ]
            return AuditLogListResponse(items=items, total=total, limit=limit, offset=offset)


_audit_service_instance: Optional[AuditService] = None

def get_audit_service() -> AuditService:
    global _audit_service_instance
    if _audit_service_instance is None:
        _audit_service_instance = AuditService()
    return _audit_service_instance
