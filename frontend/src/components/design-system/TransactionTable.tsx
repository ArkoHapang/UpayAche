"use client";

import React from "react";
import { RiskBadge } from "./RiskBadge";
import { ArrowRight, AlertTriangle, Eye } from "lucide-react";
import { RiskLevelToken } from "@/lib/tokens";

export interface TransactionRow {
  id: string;
  txHash: string;
  timestamp: string;
  senderWallet: string;
  receiverWallet: string;
  txType: string;
  amount: number;
  currency?: string;
  riskLevel: RiskLevelToken | string;
  riskScore: number;
  isAnomaly: boolean;
}

interface TransactionTableProps {
  transactions: TransactionRow[];
  onRowClick?: (tx: TransactionRow) => void;
  isLoading?: boolean;
  className?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onRowClick,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs border border-slate-200 rounded-2xl bg-white animate-pulse">
        Loading financial transaction ledger...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-2xl bg-white">
        No transaction records match the specified query.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 font-semibold">Tx Hash / Time</th>
              <th className="py-3 px-4 font-semibold">Counterparties</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold text-right">Amount (BDT)</th>
              <th className="py-3 px-4 font-semibold text-center">Risk Assessment</th>
              <th className="py-3 px-4 font-semibold text-center">Anomaly</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onRowClick?.(tx)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Hash & Timestamp */}
                <td className="py-3.5 px-4 font-mono">
                  <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                    {tx.txHash}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{tx.timestamp}</span>
                </td>

                {/* Counterparties */}
                <td className="py-3.5 px-4 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="truncate max-w-[110px]">{tx.senderWallet}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[110px]">{tx.receiverWallet}</span>
                  </div>
                </td>

                {/* Type */}
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-mono font-medium text-slate-600">
                    {tx.txType}
                  </span>
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                  ৳ {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* Risk Badge */}
                <td className="py-3.5 px-4 text-center">
                  <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                </td>

                {/* Anomaly Indicator */}
                <td className="py-3.5 px-4 text-center">
                  {tx.isAnomaly ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-semibold">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Anomaly
                    </span>
                  ) : (
                    <span className="text-slate-300 font-mono text-[11px]">—</span>
                  )}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label={`Inspect transaction ${tx.txHash}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
