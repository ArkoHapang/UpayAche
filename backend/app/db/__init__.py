"""
UpayAche — Database & Repository Module.
"""
try:
    from app.db.repository import DataRepository, get_repository
except ImportError:
    DataRepository, get_repository = None, None  # type: ignore

from app.db.supabase_client import SupabaseClient, get_supabase_client

__all__ = ["DataRepository", "get_repository", "SupabaseClient", "get_supabase_client"]


