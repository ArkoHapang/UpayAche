"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  RotateCcw,
  Layers,
  ShieldAlert,
  ChevronLeft,
  LayoutDashboard,
  Filter,
  Maximize2,
  Users,
  Zap,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraphNodeItem } from "@/lib/api";

interface GraphControlsToolbarProps {
  nodes: GraphNodeItem[];
  totalEdges: number;
  onSearchSelect: (nodeId: string) => void;
  onResetView: () => void;
  riskFilter: string;
  onRiskFilterChange: (filter: string) => void;
  topologyFilter?: string;
  onTopologyFilterChange?: (filter: string) => void;
  txTypeFilter: string;
  onTxTypeFilterChange: (type: string) => void;
  showNeighborsOnly: boolean;
  onToggleNeighborsOnly: () => void;
  highlightSuspiciousChains: boolean;
  onToggleSuspiciousChains: () => void;
  hops: number;
  onHopsChange: (hops: number) => void;
  isEgoView?: boolean;
  egoWalletLabel?: string;
  selectedNodeId?: string | null;
}

export default function GraphControlsToolbar({
  nodes,
  totalEdges,
  onSearchSelect,
  onResetView,
  riskFilter,
  onRiskFilterChange,
  topologyFilter = "ALL",
  onTopologyFilterChange,
  txTypeFilter,
  onTxTypeFilterChange,
  showNeighborsOnly,
  onToggleNeighborsOnly,
  highlightSuspiciousChains,
  onToggleSuspiciousChains,
  hops,
  onHopsChange,
  isEgoView,
  egoWalletLabel,
  selectedNodeId,
}: GraphControlsToolbarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const q = searchTerm.toLowerCase().trim();
    const match = nodes.find(
      (n) =>
        n.id.toLowerCase().includes(q) ||
        (n.label && n.label.toLowerCase().includes(q)) ||
        (n.metadata?.phone_number_masked && n.metadata.phone_number_masked.includes(q)) ||
        (n.metadata?.wallet_number && n.metadata.wallet_number.toLowerCase().includes(q))
    );
    if (match) {
      onSearchSelect(match.id);
    } else {
      alert("No matching wallet found in active 3D graph cluster.");
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Top Left Navigation & Info */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2 px-3 shadow-xl">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-900"
          title="Return to Dashboard"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-mono hidden md:inline">Dashboard</span>
        </Link>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
            <Layers className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white font-mono">
                {isEgoView ? `Ego Subgraph: ${egoWalletLabel || "Focused"}` : "3D Transaction Intelligence"}
              </span>
              <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[9px] font-mono py-0">
                WebGL
              </Badge>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {nodes.length} Wallets • {totalEdges} Transactions
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Controls & Filters */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2 px-3 shadow-xl">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search wallet / 017****..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-36 sm:w-44 pl-7 pr-3 py-1 text-xs font-mono bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
        </form>

        {/* Filter by Risk Level */}
        <div className="flex items-center gap-1">
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilterChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none"
            title="Filter by risk tier"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Threat</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low / Baseline</option>
          </select>
        </div>

        {/* Filter by Topology Archetype (Judge Feedback) */}
        {onTopologyFilterChange && (
          <div className="flex items-center gap-1">
            <select
              value={topologyFilter}
              onChange={(e) => onTopologyFilterChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
              title="Filter by topology archetype"
            >
              <option value="ALL">All Archetypes</option>
              <option value="HIGH_RISK">High-Risk Wallets</option>
              <option value="MULE_RING">Mule Rings / Cycles</option>
              <option value="FAN_IN">Fan-In Hubs</option>
              <option value="FAN_OUT">Fan-Out Hubs</option>
              <option value="ISOLATED">Isolated Wallets</option>
            </select>
          </div>
        )}

        {/* Filter by Transaction Type */}
        <div className="hidden lg:flex items-center gap-1">
          <select
            value={txTypeFilter}
            onChange={(e) => onTxTypeFilterChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none"
            title="Filter by transaction type"
          >
            <option value="ALL">All Channels</option>
            <option value="SEND_MONEY">Send Money</option>
            <option value="CASH_OUT">Cash Out</option>
            <option value="PAYMENT">Merchant Payment</option>
            <option value="CASH_IN">Cash In</option>
          </select>
        </div>

        {/* Expansion Radius Hops (1-hop, 2-hop, 3-hop) */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-0.5 text-[11px] font-mono text-slate-300">
          <span className="text-[10px] text-slate-400">Hops:</span>
          {[1, 2, 3].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onHopsChange(h)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                hops === h
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "hover:text-white"
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Show Neighbors Only Toggle (when node selected) */}
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleNeighborsOnly}
          disabled={!selectedNodeId}
          className={`h-7 px-2 text-[11px] font-mono border-slate-700 ${
            showNeighborsOnly
              ? "bg-cyan-600 text-white border-cyan-500 font-bold"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          }`}
          title="Isolate connected neighbors around selected wallet"
        >
          <Users className="w-3 h-3 mr-1" />
          Neighbors Only
        </Button>

        {/* Suspicious Chains Highlighting Toggle */}
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleSuspiciousChains}
          className={`h-7 px-2 text-[11px] font-mono border-slate-700 ${
            highlightSuspiciousChains
              ? "bg-rose-950/70 text-rose-300 border-rose-800 font-bold"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
          title="Toggle animated flow along fraudulent or circular chains"
        >
          <Zap className={`w-3 h-3 mr-1 ${highlightSuspiciousChains ? "text-rose-400" : ""}`} />
          Chains
        </Button>

        {/* Reset Camera View */}
        <Button
          onClick={onResetView}
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs font-mono border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
          title="Reset Camera View to Default"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
