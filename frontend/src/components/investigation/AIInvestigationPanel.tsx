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
  Lock
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
        queryText
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
      `**Summary**: ${report.summary || report.executive_summary}\n\n` +
      `**Grounded Evidence**:\n${(report.evidence || []).map((e) => `- ${e}`).join("\n")}\n\n` +
      `**Risk Factors**:\n${(report.relevant_risk_factors || []).map((r) => `- ${r}`).join("\n")}\n\n` +
      `**Recommended Compliance Actions**:\n${report.recommended_actions.map((a) => `- ${a}`).join("\n")}`;

    onAppendNote(content);
    setAppendedSuccess(true);
    setTimeout(() => setAppendedSuccess(false), 2500);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 font-sans shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                AI Investigation Assistant
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Guarded Gemini 1.5 • Human-in-the-Loop
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Evidence-grounded
          </Badge>
          <Badge className="bg-amber-950/60 text-amber-300 border border-amber-800 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            AI-generated
          </Badge>
          <span className="text-[10px] text-slate-400 font-mono">
            {caseNumber}
          </span>
        </div>

        {/* Clear Notice Banner */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[10px] text-slate-300 font-sans flex items-start gap-2 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Output strictly grounded in authorized database evidence. The assistant{" "}
            <strong>cannot</strong> execute financial transactions, modify database records, or block wallets.
          </span>
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

            {/* 1. Summary */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Executive Summary
                </span>
                <button
                  onClick={() => copyToClipboard(report.summary || report.executive_summary, "summary")}
                  className="text-slate-400 hover:text-white"
                  title="Copy Summary"
                >
                  {copiedSection === "summary" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {report.summary || report.executive_summary}
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Typology: <strong className="text-white">{report.typology_hypothesis}</strong></span>
                <span className="text-amber-400">Confidence: {report.confidence_level}</span>
              </div>
            </div>

            {/* 2. Grounded Evidence */}
            {report.evidence && report.evidence.length > 0 && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Grounded Evidence Items
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {report.evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Relevant Risk Factors */}
            {report.relevant_risk_factors && report.relevant_risk_factors.length > 0 && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  Relevant Risk Factors
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {report.relevant_risk_factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Relevant Network Information */}
            {report.relevant_network_information && report.relevant_network_information.length > 0 && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Relevant Network Topology
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {report.relevant_network_information.map((net, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <span>{net}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. Recommended Actions for Human Analyst */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Recommended Compliance Actions (Human Decision)
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {report.recommended_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-amber-400 font-bold">{idx + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

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
