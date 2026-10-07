"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Send,
  Info,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  Languages,
  Clock,
  Coins,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  requestAICopilotInvestigation,
  AIInvestigationReportData,
} from "@/lib/api";
import { TieredEvidenceView } from "@/components/chat/TieredEvidenceView";

interface AIInvestigationPanelProps {
  caseId: string;
  caseNumber: string;
  targetWalletId?: string;
  primaryTransactionId?: string;
  onAppendNote?: (noteContent: string) => void;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Why was this transaction flagged?",
  "What are the strongest risk factors?",
  "What unusual behavior is present?",
  "What connected wallets should be reviewed?",
  "What evidence should the analyst verify?",
];

export default function AIInvestigationPanel({
  caseId,
  caseNumber,
  targetWalletId,
  primaryTransactionId,
  onAppendNote,
}: AIInvestigationPanelProps) {
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [language, setLanguage] = useState<"auto" | "en" | "bn">("auto");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AIInvestigationReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [appendedSuccess, setAppendedSuccess] = useState<boolean>(false);

  const handleQuery = async (queryText: string) => {
    setActiveQuestion(queryText);
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestAICopilotInvestigation(
        caseId,
        "MULE_STRUCTURING_ANALYSIS",
        queryText,
        null,
        language
      );
      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run AI investigation query";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleQuery(customPrompt.trim());
    setCustomPrompt("");
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleInsertIntoNotes = () => {
    if (!report || !onAppendNote) return;
    const content =
      `### [AI Investigation Synthesis — ${report.typology_hypothesis}]\n` +
      `**Analyst Inquiry**: ${activeQuestion || "Comprehensive Intelligence Synthesis"}\n\n` +
      `**What Happened**: ${report.what_happened || report.executive_summary}\n\n` +
      `**Why It May Be Risky**: ${report.why_risky || report.summary || "Elevated anomaly and transaction velocity"}\n\n` +
      `**What to Investigate Next**:\n${(report.what_to_investigate_next || report.recommended_actions).map((a) => `- ${a}`).join("\n")}\n\n` +
      `**Grounded Evidence**:\n${(report.evidence || []).map((e) => `- ${e}`).join("\n")}\n\n` +
      `**Advisory Label**: ${report.advisory_label || "AI-generated investigation assistance. Verify all conclusions against the evidence. Final decisions remain with authorized analysts."}`;

    onAppendNote(content);
    setAppendedSuccess(true);
    setTimeout(() => setAppendedSuccess(false), 2500);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 font-sans shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                AI Investigation Assistant
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Guarded Gemini • Human-in-the-Loop
              </span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              type="button"
              onClick={() => setLanguage("auto")}
              className={`px-1.5 py-0.5 rounded transition-all ${
                language === "auto" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="Auto-detect language"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-1.5 py-0.5 rounded transition-all ${
                language === "en" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="English output"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`px-1.5 py-0.5 rounded transition-all ${
                language === "bn" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="বাংলা আউটপুট"
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Status Indicators Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Evidence-grounded
          </Badge>
          <Badge className="bg-amber-950/60 text-amber-300 border border-amber-800 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Advisory Copilot
          </Badge>
          <span className="text-[10px] text-slate-400 font-mono">
            {caseNumber}
          </span>
        </div>

        {/* Mandatory Advisory Notice Banner */}
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 font-sans flex items-start gap-2 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-amber-300 font-semibold block">
              AI-generated investigation assistance. Verify all conclusions against the evidence. Final decisions remain with authorized analysts.
            </strong>
            <span className="text-[10px] text-slate-400 font-mono block">
              Zero automated action privilege: The assistant cannot block wallets, transfer funds, approve/deny transactions, or run code.
            </span>
          </div>
        </div>
      </div>

      {/* Main Scrollable Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Suggested Questions Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Suggested Investigation Inquiries
          </span>

          <div className="flex flex-col gap-1.5">
            {DEFAULT_SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(q)}
                disabled={isLoading}
                className={`text-left text-xs font-mono p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                  activeQuestion === q
                    ? "bg-amber-400/10 border-amber-400/60 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span>{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <form onSubmit={handleCustomSubmit} className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask custom question about this case..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isLoading}
              className="w-full pl-3 pr-9 py-2 text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!customPrompt.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-400 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-6 text-center text-slate-400 font-mono text-xs bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-amber-400" />
            <p>Compiling structured evidence & synthesizing intelligence report...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Inquiry Failed:</span>
              {error}
            </div>
          </div>
        )}

        {/* AI Response Card */}
        {report && !isLoading && (
          <div className="space-y-4">
            {/* Active Question Banner */}
            {activeQuestion && (
              <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs font-mono text-amber-300">
                <span className="text-[10px] text-amber-400/70 block uppercase font-bold">Inquiry Target:</span>
                &ldquo;{activeQuestion}&rdquo;
              </div>
            )}

            {/* Structured Evidence & 3-Tier Split (Model Result / Evidence / AI Explanation) */}
            {(report.tiered_response || report.structured_evidence) && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-1">
                <TieredEvidenceView
                  evidence={report.structured_evidence}
                  tieredResponse={report.tiered_response}
                />
              </div>
            )}

            {/* ================= SECTION A: FACTS FROM EVIDENCE ================= */}
            <div className="p-4 bg-slate-950/90 border border-cyan-500/30 rounded-xl space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                    Facts From Evidence
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono border-cyan-500/40 text-cyan-300 bg-cyan-950/30">
                  VERIFIED LEDGER &amp; ML
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Wallet IDs */}
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Wallet ID(s)</span>
                  <div className="text-white font-bold truncate">
                    {report.facts_from_evidence?.wallet_ids?.length
                      ? report.facts_from_evidence.wallet_ids.join(", ")
                      : targetWalletId || "Origin & Counterparty Wallets"}
                  </div>
                </div>

                {/* Transaction IDs */}
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Transaction ID(s)</span>
                  <div className="text-cyan-300 font-bold truncate">
                    {report.facts_from_evidence?.transaction_ids?.length
                      ? report.facts_from_evidence.transaction_ids.join(", ")
                      : primaryTransactionId || "TX-RECORD-VERIFIED"}
                  </div>
                </div>

                {/* Amounts */}
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Amounts</span>
                  <div className="text-emerald-400 font-bold">
                    {report.facts_from_evidence?.amounts?.length
                      ? report.facts_from_evidence.amounts.join(", ")
                      : (report.evidence?.find((e) => e.includes("Amount:")) || "Recorded Ledger Amount")}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Timestamps</span>
                  <div className="text-slate-300 truncate">
                    {report.facts_from_evidence?.timestamps?.length
                      ? report.facts_from_evidence.timestamps.join(", ")
                      : "System Event Timestamp"}
                  </div>
                </div>
              </div>

              {/* Verified Risk Signals */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Pre-Computed Risk Signals</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(report.facts_from_evidence?.risk_signals && report.facts_from_evidence.risk_signals.length > 0
                    ? report.facts_from_evidence.risk_signals
                    : report.key_suspicious_indicators
                  ).map((sig, sIdx) => (
                    <Badge
                      key={sIdx}
                      variant="outline"
                      className="text-[10px] font-mono border-slate-700 bg-slate-950/80 text-slate-200"
                    >
                      {sig}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= SECTION B: AI INTERPRETATION ================= */}
            <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-bold">
                    AI Interpretation
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono border-purple-500/40 text-purple-300 bg-purple-950/30">
                  PROBABILISTIC REASONING
                </Badge>
              </div>

              {/* Likely Explanation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="uppercase font-semibold">Likely Explanation</span>
                  <button
                    onClick={() => copyToClipboard(report.summary || report.executive_summary, "summary")}
                    className="text-slate-400 hover:text-white"
                    title="Copy Summary"
                  >
                    {copiedSection === "summary" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  {report.ai_interpretation?.likely_explanation || report.summary || report.executive_summary}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                  <span>Typology Hypothesis: <strong className="text-white">{report.typology_hypothesis}</strong></span>
                  <span className="text-amber-400">Confidence: {report.confidence_level}</span>
                </div>
              </div>
            </div>

            {/* ================= SECTION C: INVESTIGATION TRIAD ================= */}
            <div className="space-y-2.5">
              {/* 1. WHAT HAPPENED */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>What Happened</span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {report.what_happened || report.executive_summary}
                </p>
              </div>

              {/* 2. WHY IT MAY BE RISKY */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Why It May Be Risky</span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {report.why_risky || report.summary || (report.relevant_risk_factors?.join(". ") ?? "Anomalous fund acceleration departing from account baseline.")}
                </p>
              </div>

              {/* 3. WHAT TO INVESTIGATE NEXT */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>What To Investigate Next</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200 font-sans">
                  {(report.what_to_investigate_next && report.what_to_investigate_next.length > 0
                    ? report.what_to_investigate_next
                    : report.recommended_actions
                  ).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ================= SECTION D: BANGLA SUMMARY (বাংলায় সারসংক্ষেপ) ================= */}
            {(report.bangla_summary || report.bangla_explanation) && (
              <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-sans font-bold text-emerald-300 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-emerald-400" />
                    বাংলায় সারসংক্ষেপ ও তদন্ত নির্দেশিকা
                  </span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-300">
                    বাংলা সহায়তা
                  </Badge>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {report.bangla_explanation || report.bangla_summary}
                </p>
              </div>
            )}

            {/* Insert into Analyst Notes Button */}
            {onAppendNote && (
              <Button
                onClick={handleInsertIntoNotes}
                disabled={appendedSuccess}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-9 shadow-md flex items-center justify-center gap-1.5"
              >
                {appendedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Appended to Case Notes!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Insert Synthesis into Case Notes</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Safety Footer Invariant */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          Zero Financial Mutation Privilege
        </span>
        <span>Human Operator In-the-Loop</span>
      </div>
    </div>
  );
}
