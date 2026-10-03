"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  ArrowLeftRight,
} from "lucide-react";
import {
  AppShell,
  PageHeader,
  MetricCard,
  RiskBadge,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
  Button,
  Badge,
} from "@/components/design-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  fetchTransactions,
  TransactionItem,
  TransactionListParams,
} from "@/lib/api";

export default function TransactionsPage() {
  const router = useRouter();

  // Data state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 20;

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: TransactionListParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort_by: sortBy,
        sort_desc: sortDesc,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (riskFilter !== "ALL") params.risk_level = riskFilter;
      if (txTypeFilter !== "ALL") params.tx_type = txTypeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await fetchTransactions(params);
      setTransactions(res.items);
      setTotalCount(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load transactions";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDesc, riskFilter, txTypeFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRiskFilter("ALL");
    setTxTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSortBy("timestamp");
    setSortDesc(true);
    setPage(1);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Stats calculation
  const highRiskCount = transactions.filter(
    (t) => t.risk_level === "HIGH" || t.risk_level === "CRITICAL"
  ).length;
  const anomalyCount = transactions.filter((t) => t.is_anomaly === 1).length;

  return (
    <AppShell activePath="/transactions">
      <div className="space-y-6">
        <PageHeader
          title="Transaction Ledger"
          description="Live ML-scored transaction stream with supervised XGBoost risk classification and unsupervised Isolation Forest anomaly attributions."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Transactions" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-50 text-[#0054A6] border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-pulse" />
                Live Scored
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Ingested"
            value={totalCount > 0 ? totalCount.toLocaleString() : "1,000"}
            caption="Ledger stream records"
            icon={ArrowLeftRight}
          />
          <MetricCard
            label="High / Critical Risk"
            value={highRiskCount.toString()}
            caption="In current batch"
            icon={ShieldAlert}
            riskLevel="critical"
          />
          <MetricCard
            label="Behavioral Anomalies"
            value={anomalyCount.toString()}
            caption="Unsupervised flags"
            icon={Activity}
            riskLevel="medium"
          />
          <MetricCard
            label="Active Page"
            value={`${page} / ${totalPages}`}
            caption="20 items per page"
            icon={Layers}
          />
        </div>

        {/* Search & Filter Toolbar Card */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D]" />
                  <input
                    type="text"
                    placeholder="Search by Tx ID, Hash, Sender, Receiver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-[#F6F6F6] border border-[#CED4DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007BFF]/20 focus:border-[#007BFF] text-[#000000]"
                  />
                </div>

                {/* Submit Search */}
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Filter Stream
                </Button>

                {/* Reset Filters */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-xs h-9 rounded-xl text-[#4E4E50]"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#6C757D]" />
                  Reset
                </Button>
              </div>

              {/* Secondary Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#CED4DA]/60">
                {/* Risk Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-[#4E4E50] block mb-1">Risk Tier</label>
                  <select
                    value={riskFilter}
                    onChange={(e) => {
                      setRiskFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="CRITICAL">CRITICAL (&ge; 0.90)</option>
                    <option value="HIGH">HIGH (0.75 - 0.89)</option>
                    <option value="MEDIUM">MEDIUM (0.45 - 0.74)</option>
                    <option value="LOW">LOW (&lt; 0.45)</option>
                  </select>
                </div>

                {/* Transaction Type Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-[#4E4E50] block mb-1">MFS Operation</label>
                  <select
                    value={txTypeFilter}
                    onChange={(e) => {
                      setTxTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="ALL">All Operations</option>
                    <option value="SEND_MONEY">Send Money</option>
                    <option value="CASH_OUT">Cash Out (Agent)</option>
                    <option value="CASH_IN">Cash In</option>
                    <option value="MERCHANT_PAY">Merchant Payment</option>
                    <option value="BILL_PAY">Bill Payment</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-[11px] font-semibold text-[#4E4E50] block mb-1">Sort Field</label>
                  <select
                    value={`${sortBy}_${sortDesc}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "timestamp_true") {
                        setSortBy("timestamp");
                        setSortDesc(true);
                      } else if (val === "timestamp_false") {
                        setSortBy("timestamp");
                        setSortDesc(false);
                      } else if (val === "amount_true") {
                        setSortBy("amount");
                        setSortDesc(true);
                      } else if (val === "risk_score_true") {
                        setSortBy("risk_score");
                        setSortDesc(true);
                      }
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="timestamp_true">Newest First</option>
                    <option value="timestamp_false">Oldest First</option>
                    <option value="risk_score_true">Highest Risk First</option>
                    <option value="amount_true">Highest Amount First</option>
                  </select>
                </div>

                {/* Date range shortcut */}
                <div>
                  <label className="text-[11px] font-semibold text-[#4E4E50] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <ErrorState
            title="Failed to Load Transactions"
            message={error}
            onRetry={loadData}
          />
        )}

        {/* Main Transaction Ledger Table Card */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F6F6] text-[#6C757D] font-mono uppercase text-[10px] border-b border-[#CED4DA]">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Receiver</th>
                  <th className="py-3 px-4 text-right">Amount (BDT)</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Anomaly</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CED4DA]/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <LoadingState text="Streaming ML-classified transaction records..." />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <EmptyState
                        title="No Transactions Found"
                        description="No transactions matched your search query or filter criteria."
                        actionLabel="Reset Filters"
                        onAction={handleResetFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Transaction ID */}
                      <td className="py-3 px-4 font-mono font-medium text-[#000000]">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/transactions/${tx.id}`}
                            className="text-[#0054A6] hover:text-[#007BFF] hover:underline font-bold"
                          >
                            {tx.tx_hash || tx.id.slice(0, 14)}
                          </Link>
                          <button
                            onClick={() => copyToClipboard(tx.tx_hash || tx.id, tx.id)}
                            className="text-[#6C757D] hover:text-[#000000] p-0.5"
                            title="Copy ID"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#6C757D] font-sans font-medium">{tx.tx_type}</span>
                      </td>

                      {/* Sender */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-[#000000] font-semibold">
                          {tx.sender_phone_masked || "017****0000"}
                        </div>
                        <div className="text-[10px] text-[#6C757D]">
                          {tx.sender_wallet_id.slice(0, 10)}...
                        </div>
                      </td>

                      {/* Receiver */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-[#000000] font-semibold">
                          {tx.receiver_phone_masked || "018****0000"}
                        </div>
                        <div className="text-[10px] text-[#6C757D]">
                          {tx.receiver_wallet_id.slice(0, 10)}...
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono text-right font-black text-[#000000]">
                        ৳{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {tx.fee > 0 && (
                          <div className="text-[10px] text-[#6C757D] font-normal">
                            Fee: ৳{tx.fee.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[#4E4E50] text-[11px]">
                        <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                        <div className="text-[#6C757D]">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</div>
                      </td>

                      {/* Risk Level */}
                      <td className="py-3 px-4">
                        <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                      </td>

                      {/* Anomaly */}
                      <td className="py-3 px-4">
                        {tx.is_anomaly === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ANOMALOUS
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-[#6C757D]">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={tx.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-[#0054A6] hover:text-[#007BFF] hover:bg-blue-50 font-bold rounded-lg"
                        >
                          <Link href={`/transactions/${tx.id}`}>
                            Investigate
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-[#007BFF]" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Controls Card */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#CED4DA] p-3 shadow-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="text-xs h-8 px-3 border-[#CED4DA] rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-xs font-mono text-[#4E4E50]">
            Page <span className="font-bold text-[#000000]">{page}</span> of{" "}
            <span className="font-bold text-[#000000]">{totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="text-xs h-8 px-3 border-[#CED4DA] rounded-xl"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
