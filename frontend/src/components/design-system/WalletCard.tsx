"use client";

import React from "react";
import { RiskBadge } from "./RiskBadge";
import { Wallet, Smartphone, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import { RiskLevelToken } from "@/lib/tokens";

interface WalletCardProps {
  walletNumber: string;
  maskedPhone?: string;
  balance: number;
  currency?: string;
  riskTier: RiskLevelToken | string;
  riskScore?: number;
  deviceCount?: number;
  velocity1Hour?: number;
  status?: string;
  onViewNetwork?: () => void;
  className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  walletNumber,
  maskedPhone,
  balance,
  currency = "BDT",
  riskTier,
  riskScore,
  deviceCount = 1,
  velocity1Hour = 0,
  status = "ACTIVE",
  onViewNetwork,
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4 ${className}`}
    >
      {/* Top: Wallet Identity & Risk Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
            <Wallet className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900 tracking-tight">
                {maskedPhone || walletNumber}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {status}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 block truncate">
              ID: {walletNumber}
            </span>
          </div>
        </div>

        <RiskBadge level={riskTier} score={riskScore} size="sm" />
      </div>

      {/* Center: Current Balance */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Available MFS Balance
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            ৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">{currency}</span>
      </div>

      {/* Meta Specs: Devices & Hourly Velocity */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-slate-600">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>{deviceCount} Device{deviceCount > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-slate-600">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>{velocity1Hour} tx / 1h</span>
        </div>
      </div>

      {/* Action Footer */}
      {onViewNetwork && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onViewNetwork}
            className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-amber-600 transition-colors"
          >
            <span>Trace Network Ego Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
