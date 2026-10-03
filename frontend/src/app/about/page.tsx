"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Activity,
  Network,
  Lock,
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
  Sparkles,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#000000] flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#CED4DA]/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-sm">
              <ShieldAlert className="w-5 h-5 text-[#000000]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#002A54]">UpayAche</span>
                <span className="w-2 h-2 rounded-full bg-[#FFD602]" />
              </div>
              <p className="text-[10px] font-mono text-[#6C757D] uppercase tracking-wider">
                Risk & Scam Intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-xs font-semibold text-[#4E4E50] hover:text-[#007BFF] transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-xs font-bold text-[#007BFF] border-b-2 border-[#007BFF] pb-0.5">
              About & Architecture
            </Link>
            <Link href="/help" className="text-xs font-semibold text-[#4E4E50] hover:text-[#007BFF] transition-colors">
              Help & Knowledge
            </Link>
            <Link href="/dashboard" className="text-xs font-semibold text-[#4E4E50] hover:text-[#007BFF] transition-colors">
              Analyst Console
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-xs h-9 rounded-xl">
              <Link href="/login">
                Sign In / Demo
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs">
              <Link href="/dashboard">
                Live Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#CED4DA]/70 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0054A6] border border-[#BFDBFE]">
            <Sparkles className="w-3.5 h-3.5 text-[#007BFF]" />
            DIU CPC × upay AI Hackathon 2026 Prototype
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-[#002A54] tracking-tight leading-tight">
            See the risk. Understand the reason. Investigate the network.
          </h1>

          <p className="text-base sm:text-lg text-[#4E4E50] max-w-2xl mx-auto leading-relaxed">
            UpayAche is an AI-powered risk intelligence platform engineered for next-generation Mobile Financial Services (MFS) compliance, anomaly detection, and fraud prevention in Bangladesh.
          </p>

          <div className="p-3 max-w-2xl mx-auto rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <strong>Hackathon Prototype Disclaimer:</strong> Inspired by the upay digital finance ecosystem. UpayAche is an independent hackathon research submission and is not an official product of UCB Fintech / upay.
          </div>
        </div>
      </section>

      {/* Core Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#002A54] tracking-tight">
            Multi-Layered Intelligence Architecture
          </h2>
          <p className="text-xs sm:text-sm text-[#6C757D]">
            A defense-in-depth pipeline connecting real-time streaming ML, graph topology, and guarded LLM reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. XGBoost Risk Engine */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#007BFF] mb-2">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">1. Supervised XGBoost Engine</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                24-dimensional feature extraction evaluating velocity, nocturnal timing, amount ratios, and cash-out acceleration.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Scores each incoming MFS transaction from 0.00 to 1.00 with calibrated thresholds for LOW, MEDIUM, HIGH, and CRITICAL risk tiers.</p>
            </CardContent>
          </Card>

          {/* 2. Isolation Forest */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-2">
                <Activity className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">2. Behavioral Anomaly Engine</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                Unsupervised Isolation Forest capturing zero-day scam patterns without requiring historical fraud labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Flags novel account hijacking, rapid balance liquidation, and device-hopping anomalies that evade fixed heuristic rules.</p>
            </CardContent>
          </Card>

          {/* 3. 3D Network Graph */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-2">
                <Network className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">3. Graph & Cluster Forensics</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                NetworkX directed multigraph algorithms with interactive 3D WebGL visualization.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Detects circular layering cycles, fan-in/fan-out mule syndicates, component centrality, and high-risk wallet neighborhoods.</p>
            </CardContent>
          </Card>

          {/* 4. SHAP Explainability */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-2">
                <Eye className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">4. SHAP Feature Attribution</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                TreeExplainer additive feature attributions revealing exactly WHY a transaction was flagged.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Converts opaque machine learning probabilities into explainable, legally auditable factors for compliance teams.</p>
            </CardContent>
          </Card>

          {/* 5. Guarded Gemini Copilot */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 mb-2">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">5. Guarded Gemini Copilot</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                Google GenAI SDK assistant synthesizing structured evidence into investigative reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Operating under strict guardrails: never decides fraud alone, never touches raw database credentials, and outputs Pydantic schemas.</p>
            </CardContent>
          </Card>

          {/* 6. Customer Scam Chatbot */}
          <Card className="border-[#CED4DA] bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg text-[#002A54] font-bold">6. Customer Risk Assistant</CardTitle>
              <CardDescription className="text-xs text-[#6C757D]">
                Bilingual RAG-grounded customer assistance for scam prevention, OTP safety, and transaction awareness.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[#4E4E50] space-y-2">
              <p>Empowers everyday consumers to verify suspicious SMS requests, recognize mule coercion, and protect their accounts.</p>
            </CardContent>
          </Card>
        </div>

        {/* Responsible AI & Data Invariants */}
        <div className="bg-white border border-[#CED4DA] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-[#002A54] flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#007BFF]" />
            Responsible AI & Privacy Invariants
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4E4E50]">
            <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1">
              <span className="font-bold text-[#002A54] block">100% Synthetic Data</span>
              <p>Zero real customer identities. All wallets and transactions are synthetically generated for privacy compliance.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1">
              <span className="font-bold text-[#002A54] block">Masked PII</span>
              <p>Phone numbers are strictly masked (e.g. 017****1234) across both frontend views and AI copilot prompts.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 space-y-1">
              <span className="font-bold text-[#002A54] block">Append-Only Audit</span>
              <p>Every case state transition and privileged analyst action is immutably logged to an audit table with no UPDATE or DELETE.</p>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="text-center py-6">
          <Button asChild size="lg" className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold rounded-xl px-8 shadow-sm">
            <Link href="/dashboard">
              Launch Analyst Console
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#CED4DA]/70 py-6 px-4 text-center text-xs text-[#6C757D]">
        UpayAche • AI-Powered MFS Risk & Scam Intelligence • DIU CPC × upay AI Hackathon 2026 Prototype
      </footer>
    </div>
  );
}
