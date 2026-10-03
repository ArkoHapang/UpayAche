"""
UpayAche — Transactions Schemas.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TransactionResponse(BaseModel):
    id: str
    tx_hash: Optional[str] = None
    sender_wallet_id: str
    receiver_wallet_id: str
    tx_type: str
    amount: float
    fee: float = 0.0
    status: str = "COMPLETED"
    device_id: Optional[str] = None
    location_id: Optional[str] = None
    timestamp: str
    pattern_id: Optional[int] = None
    pattern_code: Optional[str] = None
    pattern_name: Optional[str] = None
    is_fraud: int = 0
    is_anomaly: int = 0
    risk_score: float = 0.08
    risk_level: str = "LOW"
    sender_phone_masked: Optional[str] = None
    receiver_phone_masked: Optional[str] = None



class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    limit: int
    offset: int


class AnalyzeTransactionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in BDT")
    sender_wallet_id: str = Field(..., description="Originating wallet ID")
    receiver_wallet_id: str = Field(..., description="Destination wallet ID")
    tx_type: str = Field(default="P2P", description="P2P, CASH_OUT, PAYMENT, CASH_IN")
    device_id: Optional[str] = Field(default="dev-default", description="Device hardware identifier")
    location_id: Optional[str] = Field(default="loc-default", description="Location identifier")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp")


class AnalyzeTransactionResponse(BaseModel):
    transaction_id: str
    risk_score: float
    risk_level: str
    is_fraud: int
    anomaly_score: float
    is_anomaly: int
    top_factors: List[Dict[str, Any]]
    summary: str
