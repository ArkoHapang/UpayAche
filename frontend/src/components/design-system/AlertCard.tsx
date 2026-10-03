"use client";

import React from "react";
import { RiskBadge } from "./RiskBadge";
import { ShieldAlert, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { RiskLevelToken } from "@/lib/tokens";

interface AlertCardProps {
  id: string;
  title: string;
  description: string;
  riskLevel: RiskLevelToken | string;
  riskScore: number;
  triggerFactors: string[];
  timestamp: string;
  targetWallet?: string;
  onOpenCase?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  id,
  title,
  description,
  riskLevel,
  riskScore,
  triggerFactors,
  timestamp,
  targetWallet,
  onOpenCase,
  onDismiss,
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3 relative overflow-hidden ${className}`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
              Automated Sentinel Alert
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timestamp}
            </span>
          </div>
        </div>
        <RiskBadge level={riskLevel} score={riskScore} size="md" />
      </div>

      {/* Alert Content */}
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>

      {/* Target Wallet Reference */}
      {targetWallet && (
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
          <span className="text-slate-400">Target Wallet:</span>
          <span className="font-semibold text-slate-900">{targetWallet}</span>
        </div>
      )}

      {/* Trigger Factor Pills */}
      {triggerFactors.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {triggerFactors.map((factor, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium"
            >
              {factor}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Dismiss Alert
        </button>

        <button
          type="button"
          onClick={onOpenCase}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span>Open Case</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
