"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  ExternalLink,
  Copy,
  Check,
  FolderLock,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Layers,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Users,
  Eye,
  Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraphNodeItem,
  GraphEdgeItem,
  createInvestigationCase,
  InvestigationCaseItem,
} from "@/lib/api";
import { RiskBadge } from "@/components/design-system";

interface WalletInspectorDrawerProps {
  selectedNode: GraphNodeItem | null;
  selectedEdge: GraphEdgeItem | null;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
  onToggleShowNeighbors?: () => void;
  isShowingNeighborsOnly?: boolean;
  linkedCase?: InvestigationCaseItem | null;
}

export default function WalletInspectorDrawer({
  selectedNode,
  selectedEdge,
  onClose,
  onFocusNode,
  onToggleShowNeighbors,
  isShowingNeighborsOnly = false,
  linkedCase,
}: WalletInspectorDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState<boolean>(false);
  const [caseCreated, setCaseCreated] = useState<InvestigationCaseItem | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateCase = async () => {
    if (!selectedNode) return;
    setIsCreatingCase(true);
    try {
      const res = await createInvestigationCase({
        title: `Investigation: Suspicious Cluster Wallet ${selectedNode.metadata?.wallet_number || selectedNode.label}`,
        description: `Instantiated from 3D Network Explorer. Connected degree: ${selectedNode.degree}. Suspicious neighbors: ${selectedNode.risk?.suspicious_neighbors_count}. Inflow: BDT ${selectedNode.total_inflow}.`,
        target_wallet_id: selectedNode.id,
        priority: selectedNode.risk?.risk_tier === "CRITICAL" ? "CRITICAL" : "HIGH",
      });
      setCaseCreated(res);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setIsCreatingCase(false);
    }
  };

  if (!selectedNode && !selectedEdge) return null;

  // ---------------------------------------------------------------------------
  // Transaction Edge Selected View
  // ---------------------------------------------------------------------------
  if (selectedEdge && !selectedNode) {
    return (
      <aside className="w-80 md:w-96 bg-slate-900/95 border-l border-slate-800 text-white p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl z-30 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold tracking-tight text-white font-mono">
                Transaction Edge Flow
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs font-mono">
            {/* Amount Banner */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Transferred Value</span>
              <div className="text-2xl font-black text-amber-400">
                ৳{selectedEdge.amount.toLocaleString()} BDT
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-1 flex items-center gap-2">
                <span>Channel: {selectedEdge.tx_type}</span>
                <span>•</span>
                <span className={selectedEdge.is_fraud === 1 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  {selectedEdge.is_fraud === 1 ? "FLAGGED FRAUD" : "SUCCESS"}
                </span>
              </div>
            </div>

            {/* Edge Direction */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Origin (Sender Wallet)</span>
                <span className="text-slate-200 font-semibold">{selectedEdge.source}</span>
              </div>
              <div className="text-slate-500 text-center font-bold text-[10px]">
                ↓ directed transfer flow ↓
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Destination (Receiver Wallet)</span>
                <span className="text-slate-200 font-semibold">{selectedEdge.target}</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Recorded Timestamp</span>
              <span className="text-slate-300">{new Date(selectedEdge.timestamp).toUTCString()}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Button asChild className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-9">
            <Link href={`/transactions/${selectedEdge.id}`}>
              Inspect Full Transaction
              <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // Wallet Node Selected View
  // ---------------------------------------------------------------------------
  const node = selectedNode!;
  const riskTier = node.risk?.risk_tier || "LOW";
  const isCrit = riskTier === "CRITICAL";

  // Calculate composite numeric risk score
  const computedRiskScore = (
    (node.risk?.network_concentration_score || 0.6) * 0.4 +
    (isCrit ? 0.92 : riskTier === "HIGH" ? 0.78 : riskTier === "MEDIUM" ? 0.45 : 0.12) * 0.6
  ).toFixed(3);

  const totalTransactions = (node.inbound_transactions || 0) + (node.outbound_transactions || 0) || node.transaction_count || node.degree;
  const activeCaseObj = caseCreated || linkedCase;

  return (
    <aside className="w-80 md:w-96 bg-slate-950/95 border-l border-slate-800/80 text-white p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl z-30 overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isCrit
                  ? "bg-rose-500 animate-pulse ring-2 ring-rose-400/40"
                  : riskTier === "HIGH"
                  ? "bg-amber-500"
                  : "bg-cyan-500"
              }`}
            />
            <h2 className="text-sm font-bold tracking-tight text-white font-mono">
              Selected Wallet Intelligence
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Wallet ID & Masked Phone (Zero Real PII) */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Wallet Identity</span>
            <button
              onClick={() => copyToClipboard(node.id, "node_id")}
              className="text-slate-400 hover:text-slate-200"
              title="Copy ID"
            >
              {copiedField === "node_id" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-lg font-black text-amber-400">
            {node.metadata?.phone_number_masked || node.label || "017****1234"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            UUID: {node.id}
          </div>
        </div>

        {/* 2. Risk Level & Risk Score Banner */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          {/* Risk Level */}
          <div
            className={`p-3 rounded-xl border ${
              isCrit
                ? "bg-rose-950/40 border-rose-800 text-rose-300"
                : riskTier === "HIGH"
                ? "bg-amber-950/40 border-amber-800 text-amber-300"
                : "bg-slate-900/60 border-slate-800 text-slate-200"
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold">Risk Level</span>
            <div className="mt-1">
              <RiskBadge level={riskTier} className="text-xs px-2 py-0.5 font-bold" />
            </div>
          </div>

          {/* Model-Calculated Risk Score */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">Risk Score</span>
            <span className="text-lg font-black text-slate-100 font-mono block mt-0.5">
              {computedRiskScore}
            </span>
          </div>
        </div>

        {/* 3. Transaction Count & Neighbor Count */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">Transaction Count</span>
            <span className="text-base font-bold text-white block mt-0.5">
              {totalTransactions} transfers
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">Neighbor Count</span>
            <span className="text-base font-bold text-cyan-400 block mt-0.5">
              {node.degree} counterparties
            </span>
          </div>
        </div>

        {/* 4. Network Metrics (Inflow, Outflow, PageRank, Suspicious Neighbors, Circular Flow) */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block pb-1 border-b border-slate-800">
            Topological Network Metrics
          </span>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              Total Inflow:
            </span>
            <span className="font-bold text-slate-200">
              ৳{node.total_inflow.toLocaleString()} BDT
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              Total Outflow:
            </span>
            <span className="font-bold text-slate-200">
              ৳{node.total_outflow.toLocaleString()} BDT
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              PageRank Influence:
            </span>
            <span className="font-bold text-cyan-300">
              {(node.risk?.pagerank || 0.012).toFixed(4)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Suspicious Neighbors:
            </span>
            <span className="font-bold text-rose-400">
              {node.risk?.suspicious_neighbors_count || 0} flagged
            </span>
          </div>
        </div>

        {/* Circular Layering Loop Alert */}
        {node.risk?.in_cycle && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2 font-mono">
            <Repeat className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 animate-spin" />
            <div>
              <span className="font-bold block">Circular Layering Loop:</span>
              Participates in a directed money loop, a primary indicator of rapid mule structuring.
            </div>
          </div>
        )}

        {/* 5. 3D Camera Focus & Show Neighbors Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onFocusNode(node.id)}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs h-8 font-mono"
          >
            <Crosshair className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Focus in 3D
          </Button>

          {onToggleShowNeighbors && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onToggleShowNeighbors}
              className={`border-slate-700 text-xs h-8 font-mono ${
                isShowingNeighborsOnly
                  ? "bg-cyan-600 text-white border-cyan-500 font-bold"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              {isShowingNeighborsOnly ? "Show All Nodes" : "Show Neighbors"}
            </Button>
          )}
        </div>

        {/* Active Investigation Case Card */}
        {activeCaseObj && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">CASE FILE</span>
              <span className="text-xs font-bold text-white">#{activeCaseObj.case_number}</span>
            </div>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-[10px]">
              {activeCaseObj.status}
            </Badge>
          </div>
        )}
      </div>

      {/* 6. Investigation Link & Action Buttons */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <Button
          asChild
          variant="outline"
          className="w-full border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs h-9 font-mono"
        >
          <Link href={`/transactions?wallet_id=${node.id}`}>
            <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Inspect Wallet Transactions
          </Link>
        </Button>

        {activeCaseObj ? (
          <Button
            asChild
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-9 font-mono shadow-md"
          >
            <Link href={`/investigations`}>
              <FolderLock className="w-3.5 h-3.5 mr-1.5" />
              Open Investigation Case
            </Link>
          </Button>
        ) : (
          <Button
            onClick={handleCreateCase}
            disabled={isCreatingCase}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-9 font-mono shadow-md"
          >
            <FolderLock className="w-3.5 h-3.5 mr-1.5 text-slate-950" />
            {isCreatingCase ? "Creating Investigation..." : "Open Investigation"}
          </Button>
        )}
      </div>
    </aside>
  );
}
