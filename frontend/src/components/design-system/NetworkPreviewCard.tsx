"use client";

import React from "react";
import { Network, Share2, AlertCircle, ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface NetworkPreviewCardProps {
  walletId: string;
  degree: number;
  inboundCount: number;
  outboundCount: number;
  suspiciousNeighbors: number;
  hasCycle?: boolean;
  pageRank?: number;
  onExploreGraph?: () => void;
  className?: string;
}

export const NetworkPreviewCard: React.FC<NetworkPreviewCardProps> = ({
  walletId,
  degree,
  inboundCount,
  outboundCount,
  suspiciousNeighbors,
  hasCycle = false,
  pageRank,
  onExploreGraph,
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Network className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 tracking-tight block">
              Graph Topology Preview
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              Target: {walletId}
            </span>
          </div>
        </div>

        {hasCycle && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            Cycle Detected
          </span>
        )}
      </div>

      {/* Grid of Graph Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Degree</span>
          <span className="text-base font-extrabold text-slate-900 font-mono">{degree}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">In / Out</span>
          <div className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-slate-800">
            <span className="text-emerald-600">{inboundCount}</span>
            <span className="text-slate-300">/</span>
            <span className="text-amber-600">{outboundCount}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Risk Nodes</span>
          <span className={`text-base font-extrabold font-mono ${suspiciousNeighbors > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {suspiciousNeighbors}
          </span>
        </div>
      </div>

      {/* PageRank & Footer */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
        <span className="text-[11px] font-mono text-slate-400">
          {pageRank !== undefined ? `PageRank: ${pageRank.toFixed(4)}` : "Direct Multigraph"}
        </span>

        {onExploreGraph && (
          <button
            type="button"
            onClick={onExploreGraph}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors"
          >
            <span>Open 3D Visualizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
