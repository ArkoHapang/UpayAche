"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AppShell,
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Select,
  Drawer,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  MetricCard,
  RiskBadge,
  StatusBadge,
  TransactionCard,
  TransactionTable,
  TransactionRow,
  ServiceCard,
  ChartCard,
  AlertCard,
  WalletCard,
  InvestigationCard,
  AIInsightCard,
  NetworkPreviewCard,
  SearchBar,
  FilterBar,
  DataTable,
  EmptyState,
  LoadingState,
  ErrorState,
  ConfirmationDialog,
  Modal,
  Tooltip,
  AIAssistantButton,
} from "@/components/design-system";
import {
  ShieldAlert,
  ArrowRightLeft,
  Activity,
  Zap,
  Users,
  GitFork,
  BrainCircuit,
  Lock,
  Smartphone,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FolderOpen,
  PanelRight,
} from "lucide-react";

export default function DesignSystemPage() {
  // State for interactive components
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [inputVal, setInputVal] = useState("01711112222");
  const [inputError, setInputError] = useState("");
  const [loadingVariant, setLoadingVariant] = useState<
    "metric" | "table" | "card" | "spinner"
  >("metric");

  // Mock Transactions for Table & Cards
  const mockTransactions: TransactionRow[] = [
    {
      id: "tx-1",
      txHash: "0x89f2a71d",
      timestamp: "10:42:15 AM",
      senderWallet: "017****1001",
      receiverWallet: "018****2002",
      txType: "P2P",
      amount: 45000.0,
      riskLevel: "CRITICAL",
      riskScore: 0.942,
      isAnomaly: true,
    },
    {
      id: "tx-2",
      txHash: "0x34bc98e1",
      timestamp: "10:38:00 AM",
      senderWallet: "019****3003",
      receiverWallet: "017****4004",
      txType: "CASH_OUT",
      amount: 25000.0,
      riskLevel: "HIGH",
      riskScore: 0.785,
      isAnomaly: false,
    },
    {
      id: "tx-3",
      txHash: "0x12ea559a",
      timestamp: "10:25:30 AM",
      senderWallet: "015****5005",
      receiverWallet: "016****6006",
      txType: "MERCHANT_PAY",
      amount: 1250.0,
      riskLevel: "MEDIUM",
      riskScore: 0.421,
      isAnomaly: false,
    },
    {
      id: "tx-4",
      txHash: "0x98cf423b",
      timestamp: "10:14:10 AM",
      senderWallet: "017****7007",
      receiverWallet: "018****8008",
      txType: "P2P",
      amount: 500.0,
      riskLevel: "LOW",
      riskScore: 0.082,
      isAnomaly: false,
    },
  ];

  // Filter options
  const filterOptions = [
    { id: "all", label: "All Tiers", count: 48 },
    { id: "critical", label: "Critical Risk", count: 4 },
    { id: "high", label: "High Risk", count: 12 },
    { id: "medium", label: "Medium Risk", count: 18 },
    { id: "low", label: "Low Risk", count: 14 },
  ];

  const canonicalPalette = [
    { name: "--upay-primary", hex: "#007BFF", label: "Primary Blue", bg: "bg-[#007BFF]", text: "text-white" },
    { name: "--upay-accent", hex: "#FFD602", label: "Signature Yellow", bg: "bg-[#FFD602]", text: "text-black" },
    { name: "--upay-blue-dark", hex: "#0054A6", label: "Deep Blue", bg: "bg-[#0054A6]", text: "text-white" },
    { name: "--upay-secondary", hex: "#6C757D", label: "Secondary Gray", bg: "bg-[#6C757D]", text: "text-white" },
    { name: "--upay-text-primary", hex: "#000000", label: "Text Primary", bg: "bg-[#000000]", text: "text-white" },
    { name: "--upay-text-dark", hex: "#4E4E50", label: "Text Dark", bg: "bg-[#4E4E50]", text: "text-white" },
    { name: "--upay-border", hex: "#CED4DA", label: "Border Neutral", bg: "bg-[#CED4DA]", text: "text-black" },
    { name: "--upay-text-light", hex: "#EDF0F3", label: "Muted Tint", bg: "bg-[#EDF0F3]", text: "text-black" },
    { name: "--upay-surface-light", hex: "#F6F6F6", label: "Surface Light", bg: "bg-[#F6F6F6]", text: "text-black" },
    { name: "--upay-white", hex: "#FFFFFF", label: "Pure White", bg: "bg-[#FFFFFF]", text: "text-black", border: true },
  ];

  return (
    <AppShell activePath="/design-system">
      <div className="space-y-12 pb-16">
        {/* ===================================================================
            PAGE HEADER
            =================================================================== */}
        <PageHeader
          title="UpayAche Centralized Design System"
          description="Visual token layer, typography scale, 4px grid spacing, canonical Upay palette, and accessible UI component kit for MFS fraud intelligence."
          breadcrumbs={[
            { label: "Overview", href: "/" },
            { label: "Design System", href: "/design-system" },
            { label: "Token & Component Catalog" },
          ]}
          badge={
            <Badge variant="accent" className="font-mono text-xs shadow-2xs">
              Canonical Upay Ecosystem v2.0
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
                className="text-xs"
              >
                <PanelRight className="w-3.5 h-3.5 mr-1.5" />
                Open Drawer
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-xs"
              >
                Open Modal Inspector
              </Button>
            </div>
          }
        />

        {/* ===================================================================
            1. CANONICAL UPAY PALETTE & RISK SEMANTICS
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#000000] tracking-tight flex items-center gap-2">
                <span>1. Canonical Upay Brand Tokens & Risk Semantics</span>
                <Tooltip content="Canonical Upay branding colors paired strictly with preserved fintech risk semantics: Low (Green), Medium (Amber), High (Orange), Critical (Deep Red).">
                  <Info className="w-3.5 h-3.5 text-[#6C757D]" />
                </Tooltip>
              </h2>
              <p className="text-xs text-[#4E4E50]">
                Design tokens defined in <code>frontend/src/styles/design-tokens.css</code> and mapped to Tailwind utilities.
              </p>
            </div>
            <span className="text-xs font-mono text-[#6C757D]">tokens.colors.upay</span>
          </div>

          {/* Canonical Upay Colors Grid */}
          <div className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-bold text-[#4E4E50] uppercase tracking-wider block mb-3 font-mono">
                Canonical Upay Brand Palette:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {canonicalPalette.map((c) => (
                  <div
                    key={c.name}
                    className="p-3 rounded-xl border border-[#CED4DA]/70 space-y-2 bg-[#F6F6F6]"
                  >
                    <div
                      className={`h-10 w-full rounded-lg ${c.bg} ${c.text} flex items-center justify-center font-mono text-[11px] font-bold shadow-2xs ${
                        c.border ? "border border-[#CED4DA]" : ""
                      }`}
                    >
                      {c.hex}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#000000] truncate">{c.label}</div>
                      <div className="text-[10px] font-mono text-[#6C757D] truncate">{c.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Semantics */}
            <div className="pt-4 border-t border-[#CED4DA]/50 space-y-3">
              <span className="text-xs font-bold text-[#4E4E50] uppercase tracking-wider block font-mono">
                Preserved Fintech Risk Semantics:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level="LOW" score={0.065} size="md" />
                <RiskBadge level="MEDIUM" score={0.412} size="md" />
                <RiskBadge level="HIGH" score={0.784} size="md" />
                <RiskBadge level="CRITICAL" score={0.963} size="md" />
              </div>
            </div>

            {/* Investigation States */}
            <div className="pt-3 border-t border-[#CED4DA]/50 space-y-3">
              <span className="text-xs font-bold text-[#4E4E50] uppercase tracking-wider block font-mono">
                Investigation State Machine Badges:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="OPEN" />
                <StatusBadge status="INVESTIGATING" />
                <StatusBadge status="REVIEWED" />
                <StatusBadge status="CLOSED" />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            2. BUTTON COMPONENT MATRIX (ALL STATES)
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#000000] tracking-tight">
                2. Button Interactive Matrix & States
              </h2>
              <p className="text-xs text-[#4E4E50]">
                All interactive states: default, hover, focus-visible, active, disabled, and loading.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBtnLoading(!btnLoading)}
              className="text-xs font-mono"
            >
              Toggle Loading State
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-4">
            {/* Variants */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#6C757D] block">Variants:</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default" loading={btnLoading}>
                  Primary Action
                </Button>
                <Button variant="accent" loading={btnLoading}>
                  Accent Yellow
                </Button>
                <Button variant="secondary" loading={btnLoading}>
                  Secondary Gray
                </Button>
                <Button variant="outline" loading={btnLoading}>
                  Outline Border
                </Button>
                <Button variant="destructive" loading={btnLoading}>
                  Destructive
                </Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Inline Link</Button>
              </div>
            </div>

            {/* Sizes & Disabled State */}
            <div className="pt-3 border-t border-[#CED4DA]/50 space-y-2">
              <span className="text-xs font-semibold text-[#6C757D] block">Sizes & Disabled:</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small (sm)</Button>
                <Button size="default">Default Size</Button>
                <Button size="lg">Large Action (lg)</Button>
                <Button disabled>Disabled Action</Button>
                <Button loading loadingText="Submitting...">
                  Loading Trigger
                </Button>
              </div>
            </div>

            {/* AI Assistant & Copilot Trigger Buttons */}
            <div className="pt-3 border-t border-[#CED4DA]/50 space-y-2">
              <span className="text-xs font-semibold text-[#6C757D] block">
                AI Assistant / Chat Triggers (&lt;AIAssistantButton /&gt;):
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <AIAssistantButton
                  variant="inline"
                  label="Ask UpayAche AI"
                  badge="Copilot"
                  href="/chat"
                />
                <AIAssistantButton
                  variant="compact"
                  label="Quick Copilot"
                  href="/chat"
                />
                <AIAssistantButton
                  variant="inline"
                  label="Copilot Inactive"
                  disabled
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            3. FORM INPUTS & SELECT (ALL STATES)
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#000000] tracking-tight">
                3. Input & Select Controls (Interactive States)
              </h2>
              <p className="text-xs text-[#4E4E50]">
                Accessible inputs with label, helper, error, disabled, loading, and WCAG focus-visible rings.
              </p>
            </div>
            <span className="text-xs font-mono text-[#6C757D]">Components: &lt;Input /&gt; & &lt;Select /&gt;</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Standard Input */}
            <Input
              label="Standard Wallet Input"
              placeholder="e.g. 01711112222"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="Enter 11-digit Bangladeshi mobile number"
              required
            />

            {/* Input with Error State */}
            <Input
              label="Validation Error State"
              placeholder="Enter transaction amount"
              value="9999999"
              error="Exceeds daily single-wallet velocity limit of BDT 500,000"
              onChange={() => {}}
            />

            {/* Input Loading & Disabled */}
            <div className="space-y-3">
              <Input
                label="Disabled State"
                value="READ_ONLY_TOKEN_0x892"
                disabled
              />
              <Input
                label="Inference Loading State"
                placeholder="Verifying device..."
                loading
              />
            </div>
          </div>

          {/* Select Controls */}
          <div className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
            <Select
              label="Investigation Resolution"
              options={[
                { value: "CONFIRMED_FRAUD", label: "Confirmed Fraud Syndicate" },
                { value: "FALSE_POSITIVE", label: "Legitimate Transaction (False Positive)" },
                { value: "SUSPICIOUS_MONITOR", label: "Suspicious (Place on Watchlist)" },
              ]}
              required
            />

            <Select
              label="Select with Error"
              options={[{ value: "null", label: "-- Select Target Module --" }]}
              error="A target module must be selected prior to dispatch"
            />

            <Select
              label="Disabled Select"
              disabled
              options={[{ value: "ADMIN", label: "Enforced Policy Tier: Strict" }]}
            />
          </div>
        </section>

        {/* ===================================================================
            4. TABS NAVIGATION COMPONENT
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#000000] tracking-tight">
                4. Accessible Tabs Component System
              </h2>
              <p className="text-xs text-[#4E4E50]">
                Keyboard-accessible tabs with ARIA tablist/tabpanel standards and badge support.
              </p>
            </div>
            <span className="text-xs font-mono text-[#6C757D]">Component: &lt;Tabs /&gt;</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-6">
            {/* Line Tabs Variant */}
            <Tabs defaultValue="overview">
              <TabsList variant="line">
                <TabsTrigger value="overview" badge={4}>
                  Alert Overview
                </TabsTrigger>
                <TabsTrigger value="network">
                  Network Topology
                </TabsTrigger>
                <TabsTrigger value="shap">
                  SHAP Attributions
                </TabsTrigger>
                <TabsTrigger value="disabled" disabled>
                  Archived Dossiers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-4 rounded-xl bg-[#F6F6F6] text-xs text-[#4E4E50] border border-[#CED4DA]/60">
                <p className="font-semibold text-[#000000] mb-1">Active Alert Overview Tab</p>
                Showing real-time scored MFS alerts with composite risk assessment from XGBoost and Isolation Forest.
              </TabsContent>

              <TabsContent value="network" className="p-4 rounded-xl bg-[#F6F6F6] text-xs text-[#4E4E50] border border-[#CED4DA]/60">
                <p className="font-semibold text-[#000000] mb-1">Network Topology Tab</p>
                3D graph visualization powered by Three.js and NetworkX multigraph analytics.
              </TabsContent>

              <TabsContent value="shap" className="p-4 rounded-xl bg-[#F6F6F6] text-xs text-[#4E4E50] border border-[#CED4DA]/60">
                <p className="font-semibold text-[#000000] mb-1">SHAP Attributions Tab</p>
                Additive local explanations revealing feature weights driving flagged transactions.
              </TabsContent>
            </Tabs>

            {/* Pill Tabs Variant */}
            <div className="pt-4 border-t border-[#CED4DA]/50">
              <span className="text-xs font-semibold text-[#6C757D] block mb-2">Pill Variant:</span>
              <Tabs defaultValue="24h">
                <TabsList variant="pill">
                  <TabsTrigger value="1h">Last 1 Hour</TabsTrigger>
                  <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
                  <TabsTrigger value="7d">Past 7 Days</TabsTrigger>
                  <TabsTrigger value="30d">Past 30 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </section>

        {/* ===================================================================
            5. METRIC CARDS (ALL STATES: NORMAL, LOADING, EMPTY)
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000000] tracking-tight">
              5. Metric Cards (KPIs & Telemetry)
            </h2>
            <span className="text-xs font-mono text-[#6C757D]">Component: &lt;MetricCard /&gt;</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Live Transaction Velocity"
              value="2,480"
              suffix="tx/h"
              change={12.4}
              changeLabel="vs 1h ago"
              icon={Activity}
              riskLevel="medium"
            />
            <MetricCard
              label="Flagged High-Risk Volume"
              value="1,420,500"
              prefix="৳"
              change={28.6}
              changeLabel="vs yesterday"
              icon={ShieldAlert}
              riskLevel="critical"
            />
            {/* Empty Metric Card */}
            <MetricCard
              label="Watchlist Sync Delay"
              value="--"
              empty
              caption="Zero lag recorded"
              icon={Clock}
              riskLevel="low"
            />
            {/* Loading Metric Card */}
            <MetricCard
              label="Avg Model Inference Latency"
              value="4.2"
              loading
            />
          </div>
        </section>

        {/* ===================================================================
            6. SERVICE ACTION CARDS
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000000] tracking-tight">
              6. Financial Service & Forensic Action Cards
            </h2>
            <span className="text-xs font-mono text-[#6C757D]">Component: &lt;ServiceCard /&gt;</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <ServiceCard
              title="Mule Ring Scan"
              subtitle="Detect circular transfer cycles"
              icon={GitFork}
              accent="yellow"
              badge="Graph"
            />
            <ServiceCard
              title="Cash-Out Velocity"
              subtitle="Rapid nocturnal ATM extraction"
              icon={Zap}
              accent="rose"
              badge="ML"
            />
            <ServiceCard
              title="SHAP Attribution"
              subtitle="Explain transaction risk score"
              icon={BrainCircuit}
              accent="blue"
            />
            <ServiceCard
              title="Wallet Freeze"
              subtitle="Simulate compliance freeze"
              icon={Lock}
              accent="purple"
            />
            <ServiceCard
              title="Device Fingerprint"
              subtitle="Detect multi-SIM device swapping"
              icon={Smartphone}
              accent="yellow"
            />
            <ServiceCard
              title="Smurfing Filter"
              subtitle="Identify sub-threshold layering"
              icon={Users}
              accent="navy"
            />
          </div>
        </section>

        {/* ===================================================================
            7. SEARCH & FILTER CONTROLS
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000000] tracking-tight">
              7. Search & Filter Bar Controls
            </h2>
            <span className="text-xs font-mono text-[#6C757D]">Components: &lt;SearchBar /&gt; & &lt;FilterBar /&gt;</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              categories={["All Modules", "Wallets", "Transactions", "Cases"]}
            />
            <FilterBar
              options={filterOptions}
              activeId={activeFilter}
              onChange={setActiveFilter}
            />
          </div>
        </section>

        {/* ===================================================================
            8. DATA TABLE & RESPONSIVE LEDGER
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000000] tracking-tight">
              8. Transaction Feed & DataTable
            </h2>
            <span className="text-xs font-mono text-[#6C757D]">Component: &lt;DataTable /&gt;</span>
          </div>

          <DataTable
            columns={[
              {
                key: "id",
                header: "Transaction ID",
                render: (r) => (
                  <span className="font-mono font-bold text-[#000000]">{r.id}</span>
                ),
              },
              {
                key: "txHash",
                header: "Hash",
                render: (r) => (
                  <span className="font-mono text-[#6C757D]">{r.txHash}</span>
                ),
              },
              {
                key: "senderWallet",
                header: "Sender / Receiver",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {r.senderWallet} &rarr; {r.receiverWallet}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount (BDT)",
                align: "right",
                render: (r) => (
                  <span className="font-mono font-bold text-[#000000]">
                    ৳ {r.amount.toLocaleString()}
                  </span>
                ),
              },
              {
                key: "riskLevel",
                header: "Risk Tier",
                align: "center",
                render: (r) => (
                  <RiskBadge level={r.riskLevel} score={r.riskScore} size="sm" />
                ),
              },
            ]}
            data={mockTransactions}
            pageSize={4}
            onRowClick={(r) => alert(`Selected transaction: ${r.id}`)}
          />
        </section>

        {/* ===================================================================
            9. UTILITY & FEEDBACK STATES (EMPTY, LOADING, ERROR)
            =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000000] tracking-tight">
              9. Empty, Loading & Error States
            </h2>
            <span className="text-xs font-mono text-[#6C757D]">EmptyState, LoadingState, ErrorState</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EmptyState
              title="No Flagged Transactions"
              description="All high-risk transactions have been reviewed and verified by forensic compliance."
              actionLabel="Refresh Live Stream"
              onAction={() => alert("Refreshed data")}
            />

            <ErrorState
              title="FastAPI Gateway Latency Spike"
              message="HTTP 504: Graph telemetry calculation exceeded 10,000ms threshold."
              retryLabel="Reconnect Engine"
              onRetry={() => alert("Retrying connection")}
            />

            <div className="p-4 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#CED4DA]/40">
                <span className="text-xs font-bold text-[#000000]">Skeleton Previews</span>
                <div className="flex gap-1">
                  {(["metric", "card", "table", "spinner"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLoadingVariant(v)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        loadingVariant === v
                          ? "bg-[#007BFF] text-white"
                          : "bg-[#F6F6F6] text-[#4E4E50]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <LoadingState variant={loadingVariant} count={2} />
            </div>
          </div>
        </section>

        {/* ===================================================================
            INTERACTIVE MODAL & DRAWER DEMOS
            =================================================================== */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Forensic Evidence Inspector"
          description="Detailed transaction attributes evaluated by XGBoost and Isolation Forest."
          footer={
            <Button
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Close Inspector
            </Button>
          }
        >
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA] space-y-1">
              <div className="text-[#6C757D] text-[10px]">TRANSACTION HASH</div>
              <div className="font-bold text-[#000000]">0x89f2a71d87e024b89154a01c</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]">
                <span className="text-[#6C757D] text-[10px] block">SUPERVISED RISK</span>
                <span className="font-bold text-[#DC2626]">0.942 (CRITICAL)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]">
                <span className="text-[#6C757D] text-[10px] block">ANOMALY SCORE</span>
                <span className="font-bold text-purple-700">-0.248 (ANOMALY)</span>
              </div>
            </div>
          </div>
        </Modal>

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Analyst Investigation Drawer"
          description="Detailed wallet dossier and risk breakdown."
          footer={
            <Button size="sm" onClick={() => setIsDrawerOpen(false)}>
              Close Drawer
            </Button>
          }
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]">
              <span className="text-[10px] text-[#6C757D] block">TARGET WALLET</span>
              <strong className="text-sm text-[#000000]">017****2222</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0054A6]">
              <p className="font-bold mb-1">Mule Cluster Hub Detected</p>
              <p className="text-[11px] leading-relaxed">
                Wallet exhibits 14 incoming P2P connections within a 2-hour window followed by 92% cash-out ratio.
              </p>
            </div>
          </div>
        </Drawer>

        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            alert("Action confirmed successfully!");
            setIsConfirmOpen(false);
          }}
          title="Close Investigation Case?"
          message="Are you sure you want to transition case CASE-2026-1042 to CLOSED with resolution CONFIRMED_FRAUD? This action will be permanently logged in the audit trail."
          confirmLabel="Confirm & Resolve Case"
          isDestructive={false}
        />
      </div>
    </AppShell>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
