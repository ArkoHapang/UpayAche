"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  BrainCircuit,
  Activity,
  Network,
  Lock,
  CheckCircle2,
  ChevronRight,
  GitFork,
  Zap,
  SlidersHorizontal,
  Bot,
  Box,
  Eye,
  FileText,
  Scale,
  Users,
  Terminal,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  RiskBadge,
  StatusBadge,
  MetricCard,
} from "@/components/design-system";

export default function LandingPage() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Triage & Alert Ingestion",
      status: "OPEN",
      description:
        "High-velocity nocturnal cash-out triggers real-time supervised XGBoost alert with risk score > 0.90.",
      tag: "Automated Ingestion",
    },
    {
      title: "2. Deep Forensics & Copilot Analysis",
      status: "INVESTIGATING",
      description:
        "Analyst inspects additive SHAP attributions and invokes Guarded Gemini Copilot to synthesize structured evidence.",
      tag: "Human-in-the-Loop",
    },
    {
      title: "3. 3D Multigraph Exploration",
      status: "REVIEWED",
      description:
        "WebGL spatial canvas isolates circular smurfing cycles and identifies 4 linked agent mule accounts.",
      tag: "NetworkX Topology",
    },
    {
      title: "4. Immutable Resolution",
      status: "CLOSED",
      description:
        "Case transitions to CLOSED with resolution CONFIRMED_FRAUD. Permanent record written to append-only audit trail.",
      tag: "Audit Logging",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#000000] selection:bg-[#FFD602] selection:text-[#000000] font-sans antialiased">
      {/* =====================================================================
          HEADER (UPAY ECOSYSTEM STYLE)
          ===================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#CED4DA]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Product Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#000000]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#000000]">
                  UpayAche
                </span>
                <span className="w-2 h-2 rounded-full bg-[#007BFF]" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#0054A6] tracking-wider uppercase">
                Risk Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#4E4E50]">
            <a href="#risk-intelligence" className="hover:text-[#007BFF] transition-colors">
              Risk Engine
            </a>
            <a href="#anomaly-detection" className="hover:text-[#007BFF] transition-colors">
              Anomaly Detection
            </a>
            <a href="#network-intelligence" className="hover:text-[#007BFF] transition-colors">
              Network Graph
            </a>
            <a href="#explainable-ai" className="hover:text-[#007BFF] transition-colors">
              SHAP AI
            </a>
            <a href="#copilot" className="hover:text-[#007BFF] transition-colors">
              Gemini Copilot
            </a>
            <Link href="/about" className="hover:text-[#007BFF] transition-colors">
              About
            </Link>
            <Link href="/help" className="hover:text-[#007BFF] transition-colors">
              Help
            </Link>
            <Link href="/design-system" className="hover:text-[#007BFF] transition-colors">
              Design System
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              <Link href="/login">
                Sign In / Roles
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="text-xs font-semibold shadow-xs">
              <Link href="/dashboard">
                <span>Analyst Demo</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION (WHITE / LIGHT FINTECH MARKETING)
          ===================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F6F6F6] via-white to-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#CED4DA]/50">
        {/* Subtle Network Grid Ambient Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(#CED4DA 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Hackathon Prototype Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FFD602] bg-[#FFFDF0] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#FFD602] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#000000]">
              DIU CPC × upay AI Hackathon 2026 Prototype
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#000000] leading-[1.08] max-w-4xl mx-auto">
            See the risk. <br />
            <span className="text-[#007BFF]">Understand the reason.</span> <br />
            <span className="text-[#0054A6]">Investigate the network.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-[#4E4E50] max-w-2xl mx-auto leading-relaxed font-normal">
            AI-powered transaction risk detection, behavioral anomaly detection, network intelligence, and explainable investigations for modern MFS operations.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Button
              asChild
              size="lg"
              className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-sm shadow-md px-6 h-12 rounded-xl"
            >
              <Link href="/dashboard">
                Explore Risk Intelligence
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="accent"
              className="font-bold text-sm shadow-xs px-6 h-12 rounded-xl"
            >
              <Link href="/login">
                <Users className="w-4 h-4 mr-2" />
                Open Analyst Demo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-xs h-12 rounded-xl border-[#CED4DA] bg-white text-[#4E4E50] hover:text-[#000000]"
            >
              <Link href="/design-system">
                Design System Catalog
              </Link>
            </Button>
          </div>

          {/* Hero Live Telemetry Preview Card */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#CED4DA] shadow-md text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF0F3]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-xs font-mono font-bold text-[#000000]">
                    LIVE TELEMETRY STREAM • REAL-TIME MFS SCORING
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#6C757D]">
                    P99 Latency: <strong className="text-[#000000]">4.2ms</strong>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60">
                  <span className="text-[10px] font-mono text-[#6C757D] uppercase block">
                    Target Transaction
                  </span>
                  <span className="text-xs font-mono font-bold text-[#000000]">
                    0x89f2a71d...
                  </span>
                  <span className="text-[10px] text-[#4E4E50] block mt-0.5">
                    ৳ 45,000.00 (Cash-Out)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                  <span className="text-[10px] font-mono text-[#DC2626] uppercase block">
                    Supervised XGBoost
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-mono font-extrabold text-[#DC2626]">
                      0.942
                    </span>
                    <RiskBadge level="CRITICAL" size="sm" showDot={false} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-mono text-purple-700 uppercase block">
                    Isolation Forest
                  </span>
                  <span className="text-sm font-mono font-extrabold text-purple-900 block mt-0.5">
                    -0.248 (Anomaly)
                  </span>
                  <span className="text-[10px] text-purple-700 block">
                    Unseen nocturnal burst
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <span className="text-[10px] font-mono text-[#0054A6] uppercase block">
                    Multigraph Analysis
                  </span>
                  <span className="text-sm font-mono font-extrabold text-[#0054A6] block mt-0.5">
                    3-Hop Mule Ring
                  </span>
                  <span className="text-[10px] text-[#0054A6] block">
                    Cycle Detected = True
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 1: RISK INTELLIGENCE ARCHITECTURE
          ===================================================================== */}
      <section id="risk-intelligence" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <Badge variant="subtle" className="font-mono text-xs">
            1. Risk Intelligence Foundation
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000]">
            Tri-Layer MFS Financial Crime Defense
          </h2>
          <p className="text-sm sm:text-base text-[#4E4E50] leading-relaxed">
            Engineered with strict separation of concerns. Transaction streams pass through supervised gradient boosting, unsupervised behavioral outlier isolation, and directed network topology analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverable className="border-[#CED4DA]/80">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#007BFF] flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Supervised ML Risk Engine</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[#4E4E50]">
                Pre-trained XGBoost Classifier operating on 24-dimensional velocity, temporal, and monetary features. Generates calibrated probabilities with P99 latency below 8.5ms.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Model:</span>
                  <span className="font-bold text-[#000000]">XGBoost v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Recall Benchmark:</span>
                  <span className="font-bold text-[#10B981]">98.65%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hoverable className="border-[#CED4DA]/80">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Behavioral Anomaly Engine</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[#4E4E50]">
                Unsupervised Isolation Forest isolating unknown evasion techniques, sudden nocturnal disbursements, and multi-SIM device hopping that evade traditional static thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Algorithm:</span>
                  <span className="font-bold text-[#000000]">Isolation Forest</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Outlier Boundary:</span>
                  <span className="font-bold text-purple-700">&lt; -0.150 Score</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hoverable className="border-[#CED4DA]/80">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFFDF0] border border-[#FFD602] text-[#000000] flex items-center justify-center">
                <Network className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Network Graph Topology</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[#4E4E50]">
                NetworkX directed multigraph calculating in-degree/out-degree fan ratios, PageRank importance, and detecting circular smurfing rings across thousands of concurrent synthetic wallets.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Engine:</span>
                  <span className="font-bold text-[#000000]">NetworkX Multigraph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Cycle Detection:</span>
                  <span className="font-bold text-[#0054A6]">Simple Cycles / Rings</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: TRANSACTION RISK SCORING
          ===================================================================== */}
      <section className="py-16 bg-[#F6F6F6] border-y border-[#CED4DA]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Badge variant="subtle" className="font-mono text-xs">
                2. Supervised Scoring Engine
              </Badge>
              <h2 className="text-3xl font-extrabold text-[#000000] tracking-tight">
                Deterministic Risk Tiers Based on 24 Velocity Features
              </h2>
              <p className="text-sm text-[#4E4E50] leading-relaxed">
                Rather than treating fraud as a binary black box, UpayAche categorizes transactions into four deterministic risk bands. High and critical transactions automatically generate alerts in the compliance queue.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CED4DA]/70">
                  <div className="flex items-center gap-2">
                    <RiskBadge level="LOW" size="sm" />
                    <span className="text-xs text-[#4E4E50]">Score 0.00 – 0.39 • Normal P2P / Merchant Flow</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981]">AUTO-PASS</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CED4DA]/70">
                  <div className="flex items-center gap-2">
                    <RiskBadge level="MEDIUM" size="sm" />
                    <span className="text-xs text-[#4E4E50]">Score 0.40 – 0.69 • Moderate Velocity Elevation</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">WATCHLIST</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CED4DA]/70">
                  <div className="flex items-center gap-2">
                    <RiskBadge level="HIGH" size="sm" />
                    <span className="text-xs text-[#4E4E50]">Score 0.70 – 0.89 • Rapid Nocturnal Inflow Spikes</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#EA580C]">ALERT DISPATCH</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CED4DA]/70">
                  <div className="flex items-center gap-2">
                    <RiskBadge level="CRITICAL" size="sm" />
                    <span className="text-xs text-[#4E4E50]">Score 0.90 – 1.00 • Mule Layering & Rapid ATM Drain</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#DC2626]">CASE REQUIRED</span>
                </div>
              </div>
            </div>

            {/* Visual Feature Weight Breakdown */}
            <div className="p-6 rounded-3xl bg-white border border-[#CED4DA] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F3]">
                <h3 className="text-xs font-mono font-bold text-[#000000] uppercase">
                  Top Predictive Feature Velocities
                </h3>
                <span className="text-[10px] font-mono text-[#6C757D]">XGBoost Feature Importance</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#000000]">velocity_1hour (Inbound Burst)</span>
                    <span className="font-mono font-bold text-[#007BFF]">34.2%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF0F3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#007BFF] rounded-full" style={{ width: "34.2%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#000000]">nocturnal_cashout_ratio (01:00-05:00 AM)</span>
                    <span className="font-mono font-bold text-[#0054A6]">26.8%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF0F3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0054A6] rounded-full" style={{ width: "26.8%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#000000]">new_device_fingerprint_flag</span>
                    <span className="font-mono font-bold text-[#FFD602]">18.4%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF0F3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFD602] rounded-full" style={{ width: "18.4%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#000000]">balance_depletion_velocity</span>
                    <span className="font-mono font-bold text-[#DC2626]">12.5%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF0F3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#DC2626] rounded-full" style={{ width: "12.5%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: BEHAVIORAL ANOMALY DETECTION
          ===================================================================== */}
      <section id="anomaly-detection" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <Badge variant="subtle" className="font-mono text-xs">
            3. Behavioral Anomaly Engine
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000]">
            Detecting Novel Scam Patterns Beyond Static Rules
          </h2>
          <p className="text-sm sm:text-base text-[#4E4E50] leading-relaxed">
            Fraud syndicates often keep individual transactions just below static BDT limits. The unsupervised Isolation Forest establishes per-wallet baseline behavior to detect smurfing without manual thresholding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-3xl bg-white border border-[#CED4DA] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-[#DC2626] flex items-center justify-center font-bold">
                ✕
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#000000]">Traditional Static Rule Engines</h3>
                <span className="text-xs text-[#6C757D]">Rigid, high false positives</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-[#4E4E50]">
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">•</span>
                <span>Misses sub-threshold smurfing (e.g. 10 transfers of BDT 24,900 when alert limit is BDT 25,000).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">•</span>
                <span>Produces high false-alarm rates during genuine holiday salary disbursements.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">•</span>
                <span>Requires manual policy updates after scam syndicates adopt new techniques.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#007BFF]/50 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#007BFF] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#000000]">UpayAche Isolation Forest</h3>
                <span className="text-xs text-[#007BFF] font-semibold">Dynamic & behavioral</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-[#4E4E50]">
              <li className="flex items-start gap-2">
                <span className="text-[#007BFF] font-bold">•</span>
                <span>Isolates multidimensional outliers regardless of arbitrary threshold amounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#007BFF] font-bold">•</span>
                <span>Evaluates entropy deviations in counterparties, transaction frequencies, and hour-of-day.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#007BFF] font-bold">•</span>
                <span>Outputs continuous anomaly scores with zero manual rule reconfiguration.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: NETWORK INTELLIGENCE
          ===================================================================== */}
      <section id="network-intelligence" className="py-20 bg-[#002A54] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <Badge variant="accent" className="font-mono text-xs text-[#000000]">
              4. NetworkX Graph Intelligence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Uncovering Mule Rings & Smurfing Funnels
            </h2>
            <p className="text-sm sm:text-base text-[#EDF0F3]/80 leading-relaxed">
              Financial fraud is inherently collaborative. UpayAche constructs a directed multigraph representing all synthetic wallet interactions to expose hidden syndicates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#001B36] border border-[#003D7A] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold">
                <GitFork className="w-5 h-5 text-[#000000]" />
              </div>
              <h3 className="font-bold text-base text-white">Circular Flow Detection</h3>
              <p className="text-xs text-[#EDF0F3]/70 leading-relaxed">
                Applies Johnson’s cycle-finding algorithm to identify circular layering paths (A &rarr; B &rarr; C &rarr; A) engineered to wash illicit funds before final cash-out.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#001B36] border border-[#003D7A] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#007BFF] text-white flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Fan-In / Fan-Out Ratios</h3>
              <p className="text-xs text-[#EDF0F3]/70 leading-relaxed">
                Calculates in-degree versus out-degree disparities to automatically flag aggregator funnel wallets that receive micro-transfers from 20+ senders within hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#001B36] border border-[#003D7A] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">PageRank Centrality</h3>
              <p className="text-xs text-[#EDF0F3]/70 leading-relaxed">
                Computes topological centrality scores to rank the most influential syndicate controllers rather than only prosecuting disposable mule accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: EXPLAINABLE AI (SHAP ATTRIBUTIONS)
          ===================================================================== */}
      <section id="explainable-ai" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <Badge variant="subtle" className="font-mono text-xs">
              5. Explainable AI (XAI)
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-tight">
              Understand the Reason Behind Every Flag
            </h2>
            <p className="text-sm text-[#4E4E50] leading-relaxed">
              Compliance officers and forensic analysts cannot take enforcement action on unexplained probabilities. UpayAche calculates local SHAP (Shapley Additive exPlanations) values for every transaction.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-[#4E4E50]">
                  <strong>Mathematical Attribution:</strong> Game-theoretic Shapley decomposition ensures fair feature contribution.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-[#4E4E50]">
                  <strong>Directional Weighting:</strong> Identifies which factors pushed the score towards fraud (+) vs normal (-).
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-[#4E4E50]">
                  <strong>Audit-Proof Dossiers:</strong> Generates human-readable narratives for regulatory reporting.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive SHAP Visual Mockup */}
          <div className="p-6 rounded-3xl bg-white border border-[#CED4DA] shadow-md space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F3]">
              <div>
                <span className="text-[10px] text-[#6C757D] block">LOCAL SHAP EXPLANATION</span>
                <span className="font-bold text-[#000000]">TX-2026-089F2A</span>
              </div>
              <RiskBadge level="CRITICAL" score={0.942} size="sm" />
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#DC2626] block">velocity_1hour</span>
                  <span className="text-[10px] text-[#7F1D1D] font-sans">
                    7 txs in 1 hour exceeds wallet baseline by 6.2x
                  </span>
                </div>
                <span className="font-bold text-[#DC2626]">+0.384</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#DC2626] block">new_device_fingerprint</span>
                  <span className="text-[10px] text-[#7F1D1D] font-sans">
                    First access from unverified IMEI hardware fingerprint
                  </span>
                </div>
                <span className="font-bold text-[#DC2626]">+0.291</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#DC2626] block">amount_deviation_30d</span>
                  <span className="text-[10px] text-[#7F1D1D] font-sans">
                    BDT 45,000 exceeds 30-day average by 4.8x
                  </span>
                </div>
                <span className="font-bold text-[#DC2626]">+0.165</span>
              </div>

              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#065F46] block">kyc_verification_age</span>
                  <span className="text-[10px] text-[#065F46] font-sans">
                    Active verified NID account for &gt; 36 months
                  </span>
                </div>
                <span className="font-bold text-[#065F46]">-0.082</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: GUARDED GEMINI INVESTIGATION ASSISTANT
          ===================================================================== */}
      <section id="copilot" className="py-20 bg-[#F6F6F6] border-y border-[#CED4DA]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <Badge variant="subtle" className="font-mono text-xs">
              6. AI Investigation Assistant
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000]">
              Guarded Gemini Copilot via Google GenAI SDK
            </h2>
            <p className="text-sm sm:text-base text-[#4E4E50] leading-relaxed">
              Gemini acts strictly as an investigative assistant for the forensic compliance analyst. It operates under strict structural invariants with zero autonomous execution authority.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#CED4DA] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#007BFF] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#000000]">Structured Evidence Contracts</h3>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Gemini only receives pre-compiled, schema-validated JSON containing SHAP values, graph cycle metrics, and transaction timelines. Responses are enforced via Pydantic schemas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#CED4DA] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#000000]">Zero Autonomous Permissions</h3>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Gemini cannot execute database commands, transfer funds, block wallets, approve cases, or modify role permissions. The human analyst retains 100% decision authority.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#CED4DA] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFDF0] text-[#000000] border border-[#FFD602] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#000000]">Regulatory Dossier Synthesis</h3>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Translates complex mathematical graph findings into clear, formal compliance summaries ready for senior compliance review or lawful reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7: 3D NETWORK VISUALIZATION
          ===================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <Badge variant="subtle" className="font-mono text-xs">
              7. WebGL Spatial Visualizer
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-tight">
              Interactive 3D Ego Graph Analytics in WebGL
            </h2>
            <p className="text-sm text-[#4E4E50] leading-relaxed">
              Explore complex financial crime clusters in 3D. Built with React Three Fiber, Three.js, and `@react-three/drei`, analysts can navigate orbital topology, inspect suspicious neighbors, and trace transaction paths.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full border border-[#CED4DA] bg-[#F6F6F6] text-xs font-mono font-medium">
                Orbital Controls
              </span>
              <span className="px-3 py-1 rounded-full border border-[#CED4DA] bg-[#F6F6F6] text-xs font-mono font-medium">
                Node Halos by Risk Tier
              </span>
              <span className="px-3 py-1 rounded-full border border-[#CED4DA] bg-[#F6F6F6] text-xs font-mono font-medium">
                Cycle Highlighting
              </span>
              <span className="px-3 py-1 rounded-full border border-[#CED4DA] bg-[#F6F6F6] text-xs font-mono font-medium">
                Wallet Inspector Drawer
              </span>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" className="text-xs">
                <Link href="/network">
                  <Box className="w-3.5 h-3.5 mr-1.5" />
                  Launch 3D Network Viewer
                </Link>
              </Button>
            </div>
          </div>

          {/* Visual 3D Mesh Representation Preview */}
          <div className="p-8 rounded-3xl bg-[#001B36] border border-[#003D7A] shadow-md text-white text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-20 h-20 rounded-full bg-[#FFD602]/20 border border-[#FFD602] flex items-center justify-center mb-4">
              <Network className="w-10 h-10 text-[#FFD602]" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Spatial Node Graph</h3>
            <p className="text-xs text-[#EDF0F3]/70 max-w-sm">
              Rendering multi-hop transaction topologies with dynamic force-directed layouts.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 8: RESPONSIBLE AI & ZERO PII
          ===================================================================== */}
      <section className="py-16 bg-[#F6F6F6] border-y border-[#CED4DA]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-white border border-[#CED4DA] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDF0F3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#007BFF] flex items-center justify-center font-bold shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#000000]">
                    8. Responsible AI & Zero-PII Ethics Guarantee
                  </h2>
                  <p className="text-xs text-[#4E4E50]">
                    Strict compliance standards embedded into synthetic training and data management.
                  </p>
                </div>
              </div>
              <Badge variant="accent" className="font-mono text-xs">
                Zero PII Verified
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4E4E50]">
              <div className="space-y-1.5">
                <h3 className="font-bold text-[#000000]">100% Synthetic Datasets</h3>
                <p className="leading-relaxed">
                  Every account, transaction hash, and phone number is synthetically generated via localized Bangladeshi MFS distributions. Zero real customer records are touched.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-[#000000]">Universal Phone Masking</h3>
                <p className="leading-relaxed">
                  All customer telephone identifiers adhere strictly to <code>017****1234</code> masking format in API responses, graph nodes, and forensic inspector views.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-[#000000]">Append-Only Audit Trail</h3>
                <p className="leading-relaxed">
                  PostgreSQL <code>audit_logs</code> table disallows <code>UPDATE</code> and <code>DELETE</code> operations via Row Level Security (RLS) policies for immutable compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 9: ANALYST WORKFLOW (FINITE STATE MACHINE)
          ===================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <Badge variant="subtle" className="font-mono text-xs">
            9. Human-in-the-Loop Analyst Journey
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000]">
            Auditable Investigation State Machine
          </h2>
          <p className="text-sm sm:text-base text-[#4E4E50] leading-relaxed">
            Direct shortcuts like OPEN &rarr; CLOSED are strictly blocked by the backend API with HTTP 422. Every case progresses through an accountable, auditable workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step, idx) => (
            <div
              key={step.status}
              onClick={() => setActiveWorkflowStep(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                activeWorkflowStep === idx
                  ? "bg-white border-[#007BFF] shadow-md ring-2 ring-[#007BFF]/20"
                  : "bg-[#F6F6F6] border-[#CED4DA]/70 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={step.status} size="sm" />
                <span className="text-[10px] font-mono text-[#6C757D]">Step 0{idx + 1}</span>
              </div>
              <h3 className="font-bold text-sm text-[#000000] mb-1.5">{step.title}</h3>
              <p className="text-xs text-[#4E4E50] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 10: FINAL CTA BANNER
          ===================================================================== */}
      <section className="py-16 bg-[#007BFF] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            See the risk. Understand the reason. <br />
            <span className="text-[#FFD602]">Investigate the network with UpayAche.</span>
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
            DIU CPC × upay AI Hackathon 2026 prototype for next-generation MFS risk intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button
              asChild
              size="lg"
              variant="accent"
              className="text-[#000000] font-bold text-sm h-12 px-6 rounded-xl shadow-md"
            >
              <Link href="/dashboard">
                Launch Analyst Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-xs h-12 px-6 rounded-xl"
            >
              <Link href="/design-system">
                Explore Design System
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer className="border-t border-[#CED4DA]/70 bg-[#F6F6F6] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-[#6C757D]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#000000]">UpayAche</span>
              <span className="font-mono text-[11px] text-[#0054A6] font-semibold">
                Risk & Scam Intelligence
              </span>
            </div>
            <p className="max-w-xl text-[#4E4E50]">
              UpayAche is an independent student hackathon prototype inspired by the DIU CPC × upay AI Hackathon 2026.
              <br />
              <strong>NOT an official upay product.</strong> 100% Synthetic MFS Data — Zero Customer PII.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#4E4E50]">
            <Link href="/about" className="hover:text-[#007BFF]">About</Link>
            <Link href="/help" className="hover:text-[#007BFF]">Help & Knowledge</Link>
            <Link href="/dashboard" className="hover:text-[#007BFF]">Dashboard</Link>
            <Link href="/transactions" className="hover:text-[#007BFF]">Transactions</Link>
            <Link href="/investigations" className="hover:text-[#007BFF]">Investigations</Link>
            <Link href="/network" className="hover:text-[#007BFF]">3D Network</Link>
            <Link href="/models" className="hover:text-[#007BFF]">ML Models</Link>
            <Link href="/design-system" className="hover:text-[#007BFF]">Design System</Link>
            <Link href="/login" className="hover:text-[#007BFF]">Analyst Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
