"""
UpayAche — In-Memory & Persistent Data Repository.
Loads synthetic data (transactions, wallets, devices, relationships)
and provides thread-safe state management for transactions, cases, notes, and audit logs.
"""

import os
import uuid
import logging
import threading
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd

logger = logging.getLogger("upayache.repository")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "synthetic"


class DataRepository:
    """
    Central repository for transactions, wallets, investigation cases, and notes.
    Loads real synthetic data from disk and manages live case lifecycles.
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or DATA_DIR
        self._lock = threading.RLock()
        
        # In-memory stores
        self.transactions: Dict[str, Dict[str, Any]] = {}
        self.wallets: Dict[str, Dict[str, Any]] = {}
        self.investigation_cases: Dict[str, Dict[str, Any]] = {}
        self.investigation_notes: Dict[str, List[Dict[str, Any]]] = {}
        self.audit_logs: List[Dict[str, Any]] = []

        self._load_data()
        self._seed_initial_cases()

    def _load_data(self):
        """Load synthetic CSV files into structured dictionaries."""
        with self._lock:
            # 1. Load Wallets
            wallets_path = self.data_dir / "wallets.csv"
            if wallets_path.exists():
                df_w = pd.read_csv(wallets_path)
                for _, row in df_w.iterrows():
                    w_dict = row.to_dict()
                    w_id = str(w_dict["id"])
                    self.wallets[w_id] = w_dict
                logger.info(f"Loaded {len(self.wallets)} wallets from {wallets_path}")
            else:
                logger.warning(f"Wallets file not found at {wallets_path}")

            # 2. Load Transactions
            tx_path = self.data_dir / "transactions.csv"
            if tx_path.exists():
                df_tx = pd.read_csv(tx_path)
                for _, row in df_tx.iterrows():
                    t_dict = row.to_dict()
                    t_id = str(t_dict["id"])
                    t_dict["amount"] = float(t_dict.get("amount", 0.0))
                    t_dict["fee"] = float(t_dict.get("fee", 0.0))
                    t_dict["is_fraud"] = int(t_dict.get("is_fraud", 0))
                    t_dict["is_anomaly"] = int(t_dict.get("is_anomaly", 0))

                    typ = t_dict.get("typology")
                    if pd.isna(typ) or typ in ("NORMAL", "NONE"):
                        t_dict["typology"] = None
                    else:
                        t_dict["typology"] = str(typ)

                    ef = t_dict.get("evidence_features")
                    if isinstance(ef, str):
                        try:
                            import ast
                            t_dict["evidence_features"] = ast.literal_eval(ef)
                        except Exception:
                            try:
                                t_dict["evidence_features"] = json.loads(ef)
                            except Exception:
                                t_dict["evidence_features"] = [s.strip() for s in ef.split(",") if s.strip()]
                    elif not isinstance(ef, list):
                        t_dict["evidence_features"] = []

                    self.transactions[t_id] = t_dict
                logger.info(f"Loaded {len(self.transactions)} transactions from {tx_path}")
            else:
                logger.warning(f"Transactions file not found at {tx_path}")

    def _seed_initial_cases(self):
        """Seed initial investigation cases from high-risk / fraudulent synthetic patterns."""
        with self._lock:
            # Find transactions marked as fraud or anomaly
            suspicious_txs = [
                tx for tx in self.transactions.values()
                if tx.get("is_fraud") == 1 or tx.get("is_anomaly") == 1
            ][:10]

            for idx, tx in enumerate(suspicious_txs, start=1):
                case_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"case-{tx['id']}"))
                case_number = f"CASE-2026-{1000 + idx:04d}"
                created_time = tx.get("timestamp") or datetime.now(timezone.utc).isoformat()
                
                # Determine initial status
                status = "OPEN" if idx <= 6 else ("INVESTIGATING" if idx <= 8 else "REVIEWED")
                priority = "CRITICAL" if tx.get("is_fraud") == 1 else "HIGH"

                self.investigation_cases[case_id] = {
                    "id": case_id,
                    "case_number": case_number,
                    "title": f"Suspicious Activity Alert: {tx.get('pattern_name', 'MFS Anomaly')}",
                    "description": (
                        f"Automated risk trigger on transaction {tx.get('tx_hash')}. "
                        f"Pattern: {tx.get('pattern_code')}. Amount: BDT {tx.get('amount'):,.2f}."
                    ),
                    "status": status,
                    "priority": priority,
                    "resolution": "PENDING",
                    "assigned_to": "analyst-01" if status != "OPEN" else None,
                    "target_wallet_id": tx.get("sender_wallet_id"),
                    "primary_transaction_id": tx["id"],
                    "created_at": created_time,
                    "updated_at": created_time,
                    "closed_at": None
                }

                # Seed an initial system note
                note_id = str(uuid.uuid4())
                self.investigation_notes[case_id] = [{
                    "id": note_id,
                    "case_id": case_id,
                    "author_id": "system-ml-engine",
                    "author_role": "SYSTEM",
                    "content": f"Case automatically instantiated from {tx.get('pattern_name')} trigger.",
                    "note_type": "SYSTEM",
                    "created_at": created_time
                }]

            logger.info(f"Initialized {len(self.investigation_cases)} active investigation cases.")

    # -------------------------------------------------------------------------
    # Transactions Queries & Mutations
    # -------------------------------------------------------------------------

    def get_transaction(self, tx_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            # Check by id or tx_hash
            if tx_id in self.transactions:
                return dict(self.transactions[tx_id])
            for tx in self.transactions.values():
                if tx.get("tx_hash") == tx_id:
                    return dict(tx)
            return None

    def get_transaction_by_hash(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        return self.get_transaction(tx_hash)

    def _compute_tx_risk(self, t: Dict[str, Any]) -> Tuple[float, str]:
        is_f = int(t.get("is_fraud", 0))
        is_a = int(t.get("is_anomaly", 0))
        amt = float(t.get("amount", 0.0))
        if is_f == 1:
            return 0.96, "CRITICAL"
        elif is_a == 1:
            return 0.78, "HIGH"
        elif amt >= 20000.0:
            return 0.58, "MEDIUM"
        else:
            return 0.08, "LOW"

    def list_transactions(
        self,
        limit: int = 50,
        offset: int = 0,
        wallet_id: Optional[str] = None,
        tx_type: Optional[str] = None,
        is_fraud: Optional[int] = None,
        is_anomaly: Optional[int] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = "timestamp",
        sort_desc: bool = True
    ) -> Tuple[List[Dict[str, Any]], int]:
        with self._lock:
            results = list(self.transactions.values())

            if search:
                q = search.lower().strip()
                results = [
                    t for t in results
                    if q in str(t.get("id", "")).lower()
                    or q in str(t.get("tx_hash", "")).lower()
                    or q in str(t.get("sender_wallet_id", "")).lower()
                    or q in str(t.get("receiver_wallet_id", "")).lower()
                    or q in str(t.get("pattern_name", "")).lower()
                ]

            if wallet_id:
                results = [
                    t for t in results
                    if t.get("sender_wallet_id") == wallet_id or t.get("receiver_wallet_id") == wallet_id
                ]
            if tx_type:
                results = [t for t in results if str(t.get("tx_type")).upper() == tx_type.upper()]
            if is_fraud is not None:
                results = [t for t in results if t.get("is_fraud") == is_fraud]
            if is_anomaly is not None:
                results = [t for t in results if t.get("is_anomaly") == is_anomaly]
            if risk_level:
                results = [
                    t for t in results
                    if self._compute_tx_risk(t)[1].upper() == risk_level.upper()
                ]
            if min_amount is not None:
                results = [t for t in results if t.get("amount", 0.0) >= min_amount]
            if max_amount is not None:
                results = [t for t in results if t.get("amount", 0.0) <= max_amount]
            if start_date:
                results = [t for t in results if str(t.get("timestamp", ""))[:10] >= start_date]
            if end_date:
                results = [t for t in results if str(t.get("timestamp", ""))[:10] <= end_date]

            # Sorting
            if sort_by == "amount":
                results.sort(key=lambda t: float(t.get("amount", 0.0)), reverse=sort_desc)
            elif sort_by == "risk_score":
                results.sort(key=lambda t: self._compute_tx_risk(t)[0], reverse=sort_desc)
            else:
                results.sort(key=lambda t: str(t.get("timestamp", "")), reverse=sort_desc)

            total = len(results)
            paginated = results[offset: offset + limit]
            return [dict(t) for t in paginated], total

    def get_wallet_transactions(self, wallet_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        txs, _ = self.list_transactions(wallet_id=wallet_id, limit=limit)
        return txs

    def save_transaction(self, tx_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            tx_id = tx_data.get("id") or str(uuid.uuid4())
            tx_data["id"] = tx_id
            if "timestamp" not in tx_data:
                tx_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            self.transactions[tx_id] = dict(tx_data)
            return dict(tx_data)

    # -------------------------------------------------------------------------
    # Wallets Queries
    # -------------------------------------------------------------------------

    def get_wallet(self, wallet_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if wallet_id in self.wallets:
                return dict(self.wallets[wallet_id])
            for w in self.wallets.values():
                if w.get("wallet_number") == wallet_id:
                    return dict(w)
            return None

    def list_wallets(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._lock:
            return [dict(w) for w in list(self.wallets.values())[:limit]]

    # -------------------------------------------------------------------------
    # Investigations & Notes Queries & Mutations
    # -------------------------------------------------------------------------

    def list_cases(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        with self._lock:
            cases = list(self.investigation_cases.values())
            if status:
                cases = [c for c in cases if c.get("status") == status]
            if priority:
                cases = [c for c in cases if c.get("priority") == priority]

            cases.sort(key=lambda c: str(c.get("created_at", "")), reverse=True)
            total = len(cases)
            return [dict(c) for c in cases[offset: offset + limit]], total

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if case_id in self.investigation_cases:
                c = dict(self.investigation_cases[case_id])
                c["notes"] = [dict(n) for n in self.investigation_notes.get(case_id, [])]
                return c
            return None

    def create_case(
        self,
        title: str,
        description: str,
        target_wallet_id: str,
        priority: str = "MEDIUM",
        primary_transaction_id: Optional[str] = None,
        creator_id: str = "analyst-01"
    ) -> Dict[str, Any]:
        with self._lock:
            case_id = str(uuid.uuid4())
            case_number = f"CASE-2026-{1000 + len(self.investigation_cases) + 1:04d}"
            now = datetime.now(timezone.utc).isoformat()

            new_case = {
                "id": case_id,
                "case_number": case_number,
                "title": title,
                "description": description,
                "status": "OPEN",
                "priority": priority,
                "resolution": "PENDING",
                "assigned_to": creator_id,
                "target_wallet_id": target_wallet_id,
                "primary_transaction_id": primary_transaction_id,
                "created_at": now,
                "updated_at": now,
                "closed_at": None
            }
            self.investigation_cases[case_id] = new_case
            self.investigation_notes[case_id] = []
            
            # Initial system note
            self.add_note(
                case_id=case_id,
                author_id=creator_id,
                author_role="ANALYST",
                content=f"Case opened by {creator_id}.",
                note_type="ANALYST"
            )

            # Opportunistically persist to Supabase if configured
            try:
                from app.db.supabase_client import get_supabase_client
                client = get_supabase_client()
                if client.is_configured:
                    db_case = {
                        "id": new_case["id"],
                        "case_number": new_case["case_number"],
                        "title": new_case["title"],
                        "description": new_case["description"],
                        "status": new_case["status"],
                        "priority": new_case["priority"],
                        "resolution": new_case["resolution"],
                    }
                    client.insert_case(db_case)
            except Exception as e:
                logger.debug(f"Supabase case sync skipped: {e}")

            return self.get_case(case_id) # type: ignore

    def update_case_status(
        self,
        case_id: str,
        new_status: str,
        resolution: Optional[str] = None,
        assigned_to: Optional[str] = None,
        analyst_comment: Optional[str] = None,
        user_role: str = "ANALYST",
        user_id: str = "analyst-01"
    ) -> Dict[str, Any]:
        """
        Transition case state machine strictly adhering to:
        [OPEN] -> [INVESTIGATING] -> [REVIEWED] -> [CLOSED]
        Direct OPEN -> CLOSED is forbidden.
        CLOSED requires resolution != PENDING.
        CLOSED -> INVESTIGATING allowed only for ADMIN.
        """
        with self._lock:
            if case_id not in self.investigation_cases:
                raise KeyError(f"Case '{case_id}' not found.")

            case = self.investigation_cases[case_id]
            curr_status = case["status"]

            # Validate transitions
            valid = False
            if curr_status == "OPEN" and new_status == "INVESTIGATING":
                valid = True
            elif curr_status == "INVESTIGATING" and new_status == "REVIEWED":
                valid = True
            elif curr_status == "REVIEWED" and new_status == "CLOSED":
                if not resolution or resolution == "PENDING":
                    raise ValueError("Closing a case requires explicit resolution (CONFIRMED_FRAUD, FALSE_POSITIVE, or SUSPICIOUS_MONITOR).")
                valid = True
            elif curr_status == "CLOSED" and new_status in ("INVESTIGATING", "OPEN"):
                if user_role != "ADMIN":
                    raise PermissionError("Only ADMIN users can reopen a closed case.")
                valid = True
            elif curr_status == new_status:
                valid = True

            if not valid:
                raise ValueError(
                    f"Illegal state transition from '{curr_status}' to '{new_status}'. "
                    f"Cases must transition OPEN -> INVESTIGATING -> REVIEWED -> CLOSED."
                )

            now = datetime.now(timezone.utc).isoformat()
            case["status"] = new_status
            case["updated_at"] = now
            if resolution and resolution != "PENDING":
                case["resolution"] = resolution
            if assigned_to is not None:
                old_assignee = case.get("assigned_to")
                case["assigned_to"] = assigned_to
                if old_assignee != assigned_to:
                    self.add_note(
                        case_id=case_id,
                        author_id=user_id,
                        author_role=user_role,
                        content=f"Case assigned to {assigned_to} (previously {old_assignee or 'unassigned'}).",
                        note_type="SYSTEM"
                    )
            if new_status == "CLOSED":
                case["closed_at"] = now

            if analyst_comment:
                self.add_note(
                    case_id=case_id,
                    author_id=user_id,
                    author_role=user_role,
                    content=f"[Status Change -> {new_status}] {analyst_comment}",
                    note_type="ANALYST"
                )

            # Opportunistically sync to Supabase if configured
            try:
                from app.db.supabase_client import get_supabase_client
                client = get_supabase_client()
                if client.is_configured:
                    updates: Dict[str, Any] = {
                        "status": new_status,
                        "updated_at": now
                    }
                    if resolution and resolution != "PENDING":
                        updates["resolution"] = resolution
                    client.update_case(case_id, updates)
            except Exception as e:
                logger.debug(f"Supabase update_case sync skipped: {e}")

            return self.get_case(case_id) # type: ignore

    def add_note(
        self,
        case_id: str,
        author_id: str,
        author_role: str,
        content: str,
        note_type: str = "ANALYST"
    ) -> Dict[str, Any]:
        with self._lock:
            if case_id not in self.investigation_cases:
                raise KeyError(f"Case '{case_id}' not found.")

            note_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            note = {
                "id": note_id,
                "case_id": case_id,
                "author_id": author_id,
                "author_role": author_role,
                "content": content,
                "note_type": note_type,
                "created_at": now
            }
            if case_id not in self.investigation_notes:
                self.investigation_notes[case_id] = []
            self.investigation_notes[case_id].append(note)

            # Update case updated_at
            self.investigation_cases[case_id]["updated_at"] = now

            # Opportunistically sync note to Supabase if configured
            try:
                from app.db.supabase_client import get_supabase_client
                client = get_supabase_client()
                if client.is_configured:
                    client.insert_note({
                        "id": note["id"],
                        "case_id": note["case_id"],
                        "content": note["content"],
                        "note_type": note["note_type"] if note["note_type"] in ("ANALYST", "SUPERVISOR", "AI_COPILOT", "SYSTEM") else "ANALYST",
                        "created_at": note["created_at"]
                    })
            except Exception as e:
                logger.debug(f"Supabase insert_note sync skipped: {e}")

            return note

    def reset_demo_state(self):
        """Reset repository in-memory stores and caches to pristine synthetic state."""
        with self._lock:
            self.transactions.clear()
            self.wallets.clear()
            self.investigation_cases.clear()
            self.investigation_notes.clear()
            self.audit_logs.clear()
            self._load_data()
            self._seed_initial_cases()
            logger.info("DataRepository reset to pristine synthetic demo state.")


_repo_instance: Optional[DataRepository] = None

def get_repository() -> DataRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = DataRepository()
    return _repo_instance
