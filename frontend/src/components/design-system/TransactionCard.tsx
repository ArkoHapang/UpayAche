"use client";

import React from "react";
import { RiskBadge } from "./RiskBadge";
import { ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { RiskLevelToken } from "@/lib/tokens";

interface TransactionCardProps {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  currency?: string;
  txType: string;
  riskLevel: RiskLevelToken | string;
  riskScore?: number;
  isAnomaly?: boolean;
  timestamp: string;
  onClick?: () => void;
  className?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  sender,
  receiver,
  amount,
  currency = "BDT",
  txType,
  riskLevel,
  riskScore,
  isAnomaly,
  timestamp,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-3 ${className}`}
    >
      {/* Top Header: Wallets & Risk Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 truncate">
          <span className="truncate">{sender}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{receiver}</span>
        </div>
        <RiskBadge level={riskLevel} score={riskScore} size="sm" />
      </div>

      {/* Center: Amount & Type */}
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            ৳ {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 font-mono ml-1">{currency}</span>
        </div>

        <span className="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-mono font-medium text-slate-600 uppercase">
          {txType}
        </span>
      </div>

      {/* Bottom: Anomaly Flag & Timestamp */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{timestamp}</span>
        </div>

        {isAnomaly && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
            <AlertTriangle className="w-2.5 h-2.5" />
            Anomaly
          </span>
        )}
      </div>
    </div>
  );
};
