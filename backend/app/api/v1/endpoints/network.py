"""
UpayAche — Wallet Network Intelligence REST API Endpoints.
Provides structured graph data, ego-networks, topological metrics,
connected components, high-risk clusters, and transaction chain tracing.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, Path

from app.graph.schemas import (
    NetworkGraphResponse,
    WalletNetworkSummary,
    TransactionChain
)
from app.schemas.network import (
    WalletNodeResponse,
    WalletNeighborsResponse,
    HighRiskNetworkResponse,
    NetworkSubgraphResponse
)
from app.services.network_service import WalletNetworkService, get_network_service
from app.core.security import CurrentUser, get_current_user, require_role

async def verify_network_access(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Ensure CUSTOMER role is strictly prohibited from accessing network graph intelligence,
    wallet topologies, clusters, and neighbor information.
    """
    if current_user.role == "CUSTOMER":
        raise HTTPException(
            status_code=403,
            detail="Customer role is forbidden from accessing network intelligence and other wallets."
        )
    if current_user.role not in ("ADMIN", "ANALYST", "VIEWER"):
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: role '{current_user.role}' lacks permissions for network intelligence."
        )
    return current_user

router = APIRouter(
    prefix="/network",
    tags=["Wallet Network Intelligence"],
    dependencies=[Depends(verify_network_access)]
)


# -----------------------------------------------------------------------------
# Phase 9 Specified Endpoints
# -----------------------------------------------------------------------------

@router.get(
    "/wallet/{id}",
    response_model=WalletNodeResponse,
    summary="Get Wallet Node Details",
    description="Returns topological attributes, degree, in/outflow volume, and risk tier for specified wallet."
)
async def get_wallet_node(
    id: str = Path(..., description="Target wallet UUID"),
    current_user: CurrentUser = Depends(get_current_user),
    service: WalletNetworkService = Depends(get_network_service)
) -> WalletNodeResponse:
    try:
        return service.get_wallet_node(id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get(
    "/wallet/{id}/neighbors",
    response_model=WalletNeighborsResponse,
    summary="Get Wallet Connected Neighbors",
    description="Returns list of adjacent counterparty wallets with transaction volume, frequency, and flow direction."
)
async def get_wallet_neighbors(
    id: str = Path(..., description="Target wallet UUID"),
    current_user: CurrentUser = Depends(get_current_user),
    service: WalletNetworkService = Depends(get_network_service)
) -> WalletNeighborsResponse:
    try:
        return service.get_wallet_neighbors(id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get(
    "/high-risk",
    response_model=HighRiskNetworkResponse,
    summary="Get High-Risk Network Nodes",
    description="Identifies top suspicious nodes and mule clusters in the graph."
)
async def get_high_risk_network(
    min_risk: float = Query(default=0.65, ge=0.0, le=1.0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user),
    service: WalletNetworkService = Depends(get_network_service)
) -> HighRiskNetworkResponse:
    return service.get_high_risk_network(min_risk=min_risk, limit=limit)


@router.get(
    "/subgraph",
    response_model=NetworkSubgraphResponse,
    summary="Extract Graph Subgraph",
    description="Extracts multi-wallet neighborhood subgraph filtered by wallet IDs, expansion depth, and risk."
)
async def get_subgraph(
    wallet_id: Optional[str] = Query(default=None, description="Optional seed wallet ID"),
    depth: int = Query(default=1, ge=1, le=3),
    min_risk: float = Query(default=0.0, ge=0.0, le=1.0),
    current_user: CurrentUser = Depends(get_current_user),
    service: WalletNetworkService = Depends(get_network_service)
) -> NetworkSubgraphResponse:
    w_ids = [wallet_id] if wallet_id else None
    return service.get_subgraph(wallet_ids=w_ids, depth=depth, min_risk=min_risk)


# -----------------------------------------------------------------------------
# Phase 7 Endpoints (Preserved for compatibility)
# -----------------------------------------------------------------------------

@router.get(
    "/graph",
    response_model=NetworkGraphResponse,
    summary="Get Overview Network Graph",
    description="Returns global or high-degree core transaction network graph."
)
async def get_overview_network_graph(
    limit: int = Query(default=75, ge=10, le=200, description="Maximum number of nodes in graph"),
    service: WalletNetworkService = Depends(get_network_service)
) -> NetworkGraphResponse:
    try:
        return service.get_full_network(limit_nodes=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate overview graph: {str(exc)}")


@router.get(
    "/graph/{wallet_id}",
    response_model=NetworkGraphResponse,
    summary="Get Wallet Ego-Network Graph",
    description="Returns structured 1-hop or k-hop directed ego transaction graph around specified wallet."
)
async def get_wallet_ego_graph(
    wallet_id: str,
    hops: int = Query(default=1, ge=1, le=3, description="Neighborhood expansion radius (hops)"),
    max_nodes: int = Query(default=50, ge=2, le=100, description="Maximum nodes in returned subgraph"),
    service: WalletNetworkService = Depends(get_network_service)
) -> NetworkGraphResponse:
    try:
        return service.get_ego_network(wallet_id=wallet_id, hops=hops, max_nodes=max_nodes)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract network graph: {str(exc)}")


@router.get(
    "/metrics/{wallet_id}",
    response_model=WalletNetworkSummary,
    summary="Get Wallet Topological Intelligence Metrics",
    description="Calculates degree, in/outflow volume, network concentration, suspicious neighbors, and PageRank."
)
async def get_wallet_metrics(
    wallet_id: str,
    service: WalletNetworkService = Depends(get_network_service)
) -> WalletNetworkSummary:
    try:
        return service.get_wallet_metrics(wallet_id=wallet_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to compute network metrics: {str(exc)}")


@router.get(
    "/components",
    response_model=Dict[str, Any],
    summary="Get Connected Components Overview",
    description="Returns network-wide weakly connected component statistics."
)
async def get_components(
    service: WalletNetworkService = Depends(get_network_service)
) -> Dict[str, Any]:
    return service.get_connected_components_summary()


@router.get(
    "/cycles",
    response_model=List[List[str]],
    summary="Get Circular Layering Loops",
    description="Returns detected circular transaction cycles indicative of layering."
)
async def get_cycles(
    service: WalletNetworkService = Depends(get_network_service)
) -> List[List[str]]:
    return service.get_circular_layering_cycles()


@router.get(
    "/chains/{wallet_id}",
    response_model=List[TransactionChain],
    summary="Trace Directed Transaction Chains",
    description="Traces multi-hop forward money flow chains originating from target wallet."
)
async def get_transaction_chains(
    wallet_id: str,
    max_depth: int = Query(default=4, ge=1, le=6),
    service: WalletNetworkService = Depends(get_network_service)
) -> List[TransactionChain]:
    try:
        return service.trace_chains(wallet_id=wallet_id, max_depth=max_depth)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to trace transaction chains: {str(exc)}")


@router.get(
    "/mule-rings",
    response_model=List[Dict[str, Any]],
    summary="Get Detected Mule Rings",
    description="Returns detected circular mule rings with participant roles and loop volumes."
)
async def get_mule_rings(
    service: WalletNetworkService = Depends(get_network_service)
) -> List[Dict[str, Any]]:
    return service.get_mule_rings()


@router.get(
    "/fan-hubs",
    response_model=Dict[str, Any],
    summary="Get Fan-In and Fan-Out Hubs",
    description="Returns fan-in aggregators and fan-out dispersers."
)
async def get_fan_hubs(
    service: WalletNetworkService = Depends(get_network_service)
) -> Dict[str, Any]:
    return service.get_fan_hubs()


@router.get(
    "/shortest-path",
    response_model=Optional[Dict[str, Any]],
    summary="Find Shortest Suspicious Path",
    description="Finds shortest directed path between source and target, or source and nearest suspicious mule wallet."
)
async def get_shortest_path(
    source_wallet_id: str = Query(..., description="Source wallet ID"),
    target_wallet_id: Optional[str] = Query(None, description="Optional target wallet ID"),
    service: WalletNetworkService = Depends(get_network_service)
) -> Optional[Dict[str, Any]]:
    res = service.get_shortest_suspicious_path(source_wallet_id=source_wallet_id, target_wallet_id=target_wallet_id)
    if not res:
        return None
    return res
