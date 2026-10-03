"""
UpayAche — Transactions REST API Endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path
from app.schemas.transactions import (
    TransactionResponse,
    TransactionListResponse,
    AnalyzeTransactionRequest,
    AnalyzeTransactionResponse
)
from app.services.transaction_service import TransactionService, get_transaction_service
from app.core.security import CurrentUser, get_current_user, require_role

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List Transactions Ledger",
    description="Retrieve paginated transaction records with optional filters for wallet, type, fraud, anomaly, and amount."
)
async def list_transactions(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    wallet_id: Optional[str] = Query(default=None),
    tx_type: Optional[str] = Query(default=None),
    is_fraud: Optional[int] = Query(default=None),
    is_anomaly: Optional[int] = Query(default=None),
    min_amount: Optional[float] = Query(default=None),
    max_amount: Optional[float] = Query(default=None),
    search: Optional[str] = Query(default=None, description="Search transaction hash, ID, wallet, or pattern"),
    risk_level: Optional[str] = Query(default=None, description="LOW, MEDIUM, HIGH, or CRITICAL"),
    start_date: Optional[str] = Query(default=None, description="YYYY-MM-DD start filter"),
    end_date: Optional[str] = Query(default=None, description="YYYY-MM-DD end filter"),
    sort_by: str = Query(default="timestamp", description="timestamp, amount, or risk_score"),
    sort_desc: bool = Query(default=True, description="Sort descending if true"),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: TransactionService = Depends(get_transaction_service)
) -> TransactionListResponse:
    return service.list_transactions(
        limit=limit,
        offset=offset,
        wallet_id=wallet_id,
        tx_type=tx_type,
        is_fraud=is_fraud,
        is_anomaly=is_anomaly,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        risk_level=risk_level,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_desc=sort_desc
    )


@router.get(
    "/{id}",
    response_model=TransactionResponse,
    summary="Get Single Transaction",
    description="Fetch single transaction record by UUID or hash."
)
async def get_transaction(
    id: str = Path(..., description="Transaction UUID or tx_hash"),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: TransactionService = Depends(get_transaction_service)
) -> TransactionResponse:
    return service.get_transaction(id)


@router.post(
    "/analyze",
    response_model=AnalyzeTransactionResponse,
    summary="Analyze & Ingest Transaction",
    description="Runs multi-engine ML evaluation, generates SHAP feature attributions, and triggers auto-alert if critical."
)
async def analyze_transaction(
    req: AnalyzeTransactionRequest,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST"])),
    service: TransactionService = Depends(get_transaction_service)
) -> AnalyzeTransactionResponse:
    return service.analyze_transaction(req)
