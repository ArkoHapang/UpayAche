"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  Layers,
  RefreshCw,
  AlertTriangle,
  FolderLock,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  fetchWalletEgoGraph,
  fetchActiveInvestigations,
  GraphNodeItem,
  GraphEdgeItem,
  InvestigationCaseItem,
} from "@/lib/api";
import WalletInspectorDrawer from "@/components/network/WalletInspectorDrawer";
import GraphControlsToolbar from "@/components/network/GraphControlsToolbar";
import { useAuth } from "@/context/AuthContext";

const NetworkCanvas3D = dynamic(
  () => import("@/components/network/NetworkCanvas3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B1120] text-slate-400 font-mono text-xs">
        <RefreshCw className="w-8 h-8 mb-3 animate-spin text-[#007BFF]" />
        <span>Focusing 3D Ego Network...</span>
      </div>
    ),
  }
);

function WalletNetworkInner() {
  const params = useParams();
  const router = useRouter();
  const walletId = params?.walletId as string;
  const { token } = useAuth();

  const [nodes, setNodes] = useState<GraphNodeItem[]>([]);
  const [edges, setEdges] = useState<GraphEdgeItem[]>([]);
  const [totalEdges, setTotalEdges] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<GraphNodeItem | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeItem | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [cases, setCases] = useState<InvestigationCaseItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");
  const [showNeighborsOnly, setShowNeighborsOnly] = useState<boolean>(false);
  const [highlightSuspiciousChains, setHighlightSuspiciousChains] = useState<boolean>(true);
  const [hops, setHops] = useState<number>(1);
  const [resetSignal, setResetSignal] = useState<number>(0);

  const loadEgoData = useCallback(async () => {
    if (!walletId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWalletEgoGraph(walletId, hops, 60, token);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setTotalEdges(data.total_edges || (data.edges ? data.edges.length : 0));

      // Pre-select focused wallet
      const targetNode = data.nodes?.find((n) => n.id === walletId);
      if (targetNode) {
        setSelectedNode(targetNode);
        setFocusedNodeId(targetNode.id);
      }

      // Check for active investigation cases
      try {
        const caseList = await fetchActiveInvestigations(token, 50);
        setCases(caseList);
      } catch (cErr) {
        console.warn("Could not fetch active cases:", cErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load wallet network graph";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [walletId, hops, token]);

  useEffect(() => {
    loadEgoData();
  }, [loadEgoData]);

  const filteredNodes = useMemo(() => {
    if (riskFilter === "ALL") return nodes;
    return nodes.filter((n) => n.risk?.risk_tier === riskFilter);
  }, [nodes, riskFilter]);

  const filteredEdges = useMemo(() => {
    if (txTypeFilter === "ALL") return edges;
    return edges.filter((e) => e.tx_type === txTypeFilter);
  }, [edges, txTypeFilter]);

  const handleSelectNode = (node: GraphNodeItem | null) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    if (node) {
      setFocusedNodeId(node.id);
    } else {
      setShowNeighborsOnly(false);
    }
  };

  const handleSelectEdge = (edge: GraphEdgeItem | null) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const handleResetView = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setFocusedNodeId(null);
    setShowNeighborsOnly(false);
    setRiskFilter("ALL");
    setTxTypeFilter("ALL");
    setResetSignal((prev) => prev + 1);
  };

  const handleSearchSelect = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setFocusedNodeId(node.id);
    }
  };

  const linkedCase = selectedNode
    ? cases.find((c) => c.target_wallet_id === selectedNode.id)
    : null;

  return (
    <div className="w-screen h-screen relative bg-[#0B1120] overflow-hidden flex flex-col font-sans select-none">
      <GraphControlsToolbar
        nodes={nodes}
        totalEdges={totalEdges}
        onSearchSelect={handleSearchSelect}
        onResetView={handleResetView}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        txTypeFilter={txTypeFilter}
        onTxTypeFilterChange={setTxTypeFilter}
        showNeighborsOnly={showNeighborsOnly}
        onToggleNeighborsOnly={() => setShowNeighborsOnly((prev) => !prev)}
        highlightSuspiciousChains={highlightSuspiciousChains}
        onToggleSuspiciousChains={() => setHighlightSuspiciousChains((prev) => !prev)}
        hops={hops}
        onHopsChange={setHops}
        isEgoView={true}
        egoWalletLabel={selectedNode?.metadata?.phone_number_masked || walletId}
        selectedNodeId={selectedNode?.id || null}
      />

      <div className="flex-1 w-full h-full relative">
        {isLoading && nodes.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-8 h-8 mb-3 animate-spin text-[#007BFF]" />
            <span>Extracting 3D Ego Graph from NetworkX backend...</span>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="p-5 max-w-md bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 font-mono text-xs flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-400" />
              <div>
                <span className="font-bold block mb-1">Graph Extraction Error:</span>
                {error}
              </div>
            </div>
          </div>
        ) : (
          <NetworkCanvas3D
            nodes={filteredNodes}
            edges={filteredEdges}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            focusedNodeId={focusedNodeId}
            showNeighborsOnly={showNeighborsOnly}
            highlightSuspiciousChains={highlightSuspiciousChains}
            resetSignal={resetSignal}
          />
        )}

        <div className="absolute bottom-5 left-5 z-20 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">
            Risk Classification & Flow Legend
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/40" />
              <span className="text-slate-300">Critical Threat (Pulse)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-300">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF]" />
              <span className="text-slate-300">Low / Standard</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[9px] text-slate-500">
            Node radius = Connection degree • Cone marker = Directed transfer • Red particle = Illicit chain flow
          </div>
        </div>
      </div>

      {(selectedNode || selectedEdge) && (
        <WalletInspectorDrawer
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
            setShowNeighborsOnly(false);
          }}
          onFocusNode={(nodeId) => setFocusedNodeId(nodeId)}
          onToggleShowNeighbors={() => setShowNeighborsOnly((prev) => !prev)}
          isShowingNeighborsOnly={showNeighborsOnly}
          linkedCase={linkedCase}
        />
      )}
    </div>
  );
}

export default function WalletNetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-[#0B1120] text-slate-400 font-mono text-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-[#007BFF]" />
        </div>
      }
    >
      <WalletNetworkInner />
    </Suspense>
  );
}
