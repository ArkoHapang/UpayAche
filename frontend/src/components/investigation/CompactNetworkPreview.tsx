"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Network,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Share2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchWalletMetrics,
  fetchWalletEgoGraph,
  WalletNetworkSummaryData,
  NetworkGraphData
} from "@/lib/api";

interface CompactNetworkPreviewProps {
  walletId: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  token?: string | null;
}

export default function CompactNetworkPreview({
  walletId,
  senderWalletId,
  receiverWalletId,
  token
}: CompactNetworkPreviewProps) {
  const [metrics, setMetrics] = useState<WalletNetworkSummaryData | null>(null);
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeWallet = walletId || senderWalletId || receiverWalletId || "W-1001";

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!activeWallet) return;
      setLoading(true);
      setError(null);
      try {
        const [mRes, gRes] = await Promise.allSettled([
          fetchWalletMetrics(activeWallet, token),
          fetchWalletEgoGraph(activeWallet, 1, 10, token),
        ]);

        if (!isMounted) return;

        if (mRes.status === "fulfilled") {
          setMetrics(mRes.value);
        }
        if (gRes.status === "fulfilled") {
          setGraphData(gRes.value);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load network intelligence.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeWallet, token]);

  const targetDisplay = metrics?.wallet_number || activeWallet;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Wallet Network Intelligence
              {metrics?.in_cycle && (
                <Badge variant="outline" className="border-rose-500/40 bg-rose-950/40 text-rose-300 text-[10px] font-mono">
                  Cycle Loop Detected
                </Badge>
              )}
            </h4>
            <p className="text-xs text-slate-400 font-mono">Target: {targetDisplay}</p>
          </div>
        </div>

        <Button asChild size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
          <Link href={`/network/${encodeURIComponent(activeWallet)}`}>
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Open Full Network
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs font-mono border border-slate-800/80 rounded-xl bg-slate-950/50 animate-pulse gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          Mapping topology & ego graph...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-amber-800/30 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <Button asChild size="sm" variant="outline" className="border-amber-700/50 text-amber-300 text-xs h-7">
            <Link href={`/network/${encodeURIComponent(activeWallet)}`}>
              Open Full Network
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Topology Canvas Preview (SVG) */}
          <div className="relative h-44 w-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center p-3">
            <svg className="w-full h-full" viewBox="0 0 400 160">
              {/* Background Grid */}
              <defs>
                <pattern id="compact-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#compact-grid)" />

              {/* Connected Lines from Center to Surrounding Nodes */}
              {/* Left sender */}
              <line x1="80" y1="80" x2="200" y2="80" stroke="url(#edge-grad)" strokeWidth="2.5" strokeDasharray="4 2" />
              {/* Right receiver */}
              <line x1="200" y1="80" x2="320" y2="80" stroke="#f59e0b" strokeWidth="2" />
              {/* Top satellite */}
              <line x1="200" y1="80" x2="200" y2="30" stroke="#475569" strokeWidth="1.5" />
              {/* Bottom satellite */}
              <line x1="200" y1="80" x2="260" y2="135" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="200" y1="80" x2="140" y2="135" stroke="#475569" strokeWidth="1.5" />

              {/* Satellite Node: Sender */}
              <g transform="translate(80, 80)">
                <circle r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">SENDER</text>
              </g>

              {/* Central Target Node */}
              <g transform="translate(200, 80)">
                <circle r="26" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="3" className="animate-pulse" />
                <circle r="32" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
                <text textAnchor="middle" dy="-3" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">TARGET</text>
                <text textAnchor="middle" dy="10" fill="#f59e0b" fontSize="8" fontFamily="monospace">{activeWallet.slice(-6)}</text>
              </g>

              {/* Satellite Node: Receiver */}
              <g transform="translate(320, 80)">
                <circle r="18" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">RCVR</text>
              </g>

              {/* Satellite Top Node */}
              <g transform="translate(200, 30)">
                <circle r="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                <text textAnchor="middle" dy="3" fill="#94a3b8" fontSize="8" fontFamily="monospace">N-1</text>
              </g>

              {/* Suspicious Neighbor Node */}
              <g transform="translate(260, 135)">
                <circle r="14" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                <text textAnchor="middle" dy="3.5" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">RISK</text>
              </g>

              {/* Regular Neighbor */}
              <g transform="translate(140, 135)">
                <circle r="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                <text textAnchor="middle" dy="3" fill="#94a3b8" fontSize="8" fontFamily="monospace">N-2</text>
              </g>
            </svg>

            {/* Overlay Status Pill */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300">
              Ego Nodes: <strong className="text-cyan-400">{graphData?.nodes?.length || metrics?.degree || 5}</strong> • Edges: <strong className="text-amber-400">{graphData?.edges?.length || 4}</strong>
            </div>

            <div className="absolute bottom-2 right-2">
              <Button asChild size="sm" variant="secondary" className="h-6 text-[10px] bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                <Link href={`/network/${encodeURIComponent(activeWallet)}`}>
                  Expand 3D View <ArrowRight className="w-2.5 h-2.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Network Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Total Degree</span>
              <span className="text-white font-bold text-sm">{metrics?.degree ?? "N/A"}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                In: {metrics?.inbound_transactions ?? 0} | Out: {metrics?.outbound_transactions ?? 0}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Suspicious Neighbors</span>
              <span className={`font-bold text-sm ${(metrics?.suspicious_neighbors_count ?? 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {metrics?.suspicious_neighbors_count ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {(metrics?.suspicious_neighbors_count ?? 0) > 0 ? "Flagged peers" : "Clean peers"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Network Concentration</span>
              <span className="text-white font-bold text-sm">
                {metrics?.network_concentration !== undefined ? `${(metrics.network_concentration * 100).toFixed(1)}%` : "N/A"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">HHI Index</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">PageRank Score</span>
              <span className="text-cyan-400 font-bold text-sm">
                {metrics?.pagerank !== undefined ? metrics.pagerank.toFixed(5) : "N/A"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Centrality</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
