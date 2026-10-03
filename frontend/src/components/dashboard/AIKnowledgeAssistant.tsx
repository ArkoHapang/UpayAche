"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  sources?: string[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "assistant",
    text: "Hello! I am your UpayAche Knowledge & MFS Intelligence Copilot. How can I assist you with fraud typologies, BFIU compliance guidelines, or risk scoring rules today?",
    timestamp: "Just now",
    sources: ["UpayAche Knowledge Base v1.0", "MFS Risk Guidelines 2026"],
  },
];

const SUGGESTED_QUERIES = [
  "How does UpayAche detect 3-hop mule rings?",
  "What triggers a CRITICAL risk score (>0.90)?",
  "Explain BFIU smurfing threshold rules",
  "What are nocturnal cash-out velocity factors?",
];

const KNOWLEDGE_RESPONSES: Record<string, { answer: string; sources: string[] }> = {
  mule: {
    answer:
      "UpayAche detects mule rings using NetworkX directed multigraph algorithms. When wallet A transfers to B, B to C, and C back to A within a narrow temporal window (e.g. < 4 hours) followed by rapid ATM cash-out, the system flags simple cycles and assigns high network concentration scores.",
    sources: ["NetworkX Multigraph Engine", "Mule Structuring Spec §4.2"],
  },
  critical: {
    answer:
      "A CRITICAL risk score (0.90 – 1.00) is triggered when multiple high-weight features co-occur: high 1-hour velocity (>5x baseline), nocturnal transaction hour (01:00 – 05:00 AM), new unverified device IMEI fingerprint, and rapid balance depletion (>85% cash-out within 30 minutes).",
    sources: ["XGBoost Classifier v1.0.0", "SHAP Feature Calibration §2.1"],
  },
  bfiu: {
    answer:
      "Under Bangladesh Bank / BFIU guidelines, reporting entities must identify structuring designed to evade BDT 25,000 / 50,000 single-transaction thresholds. UpayAche's unsupervised Isolation Forest detects sub-threshold smurfing patterns automatically without requiring static amount thresholds.",
    sources: ["BFIU Circular No. 28", "Isolation Forest Anomaly Engine"],
  },
  nocturnal: {
    answer:
      "Nocturnal cash-out velocity evaluates transactions occurring between 01:00 AM and 05:00 AM. Legitimate MFS transfers drop significantly during these hours, whereas automated mule syndicates frequently extract funds via agent cash-out during off-hours to avoid real-time human intervention.",
    sources: ["Temporal Feature Engineering §3", "Agent Cash-out Profiler"],
  },
};

export const AIKnowledgeAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let matched = KNOWLEDGE_RESPONSES.mule;

      if (lower.includes("critical") || lower.includes("score")) {
        matched = KNOWLEDGE_RESPONSES.critical;
      } else if (lower.includes("bfiu") || lower.includes("smurf") || lower.includes("rule")) {
        matched = KNOWLEDGE_RESPONSES.bfiu;
      } else if (lower.includes("nocturnal") || lower.includes("cash") || lower.includes("velocity")) {
        matched = KNOWLEDGE_RESPONSES.nocturnal;
      }

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: matched.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: matched.sources,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#007BFF] text-white hover:bg-[#0054A6] active:bg-[#003D7A] shadow-xs text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] select-none"
        title="Open AI Knowledge & Compliance Assistant"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#FFD602]" />
        <span>Ask AI Assistant</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD602] animate-pulse" />
      </button>

      {/* Floating / Docked Chatbot Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/40 backdrop-blur-2xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-3xl border border-[#CED4DA] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#CED4DA]/70 bg-gradient-to-r from-[#002A54] to-[#0054A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-xs">
                  <Bot className="w-4 h-4 text-[#000000]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">UpayAche Knowledge Copilot</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="text-[10px] text-[#EDF0F3]/80 font-mono block">
                    MFS Typology & Compliance Knowledge
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note about separation */}
            <div className="px-4 py-2 bg-[#FFFDF0] border-b border-[#FFD602]/40 text-[10px] text-[#78350F] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#FFD602] shrink-0" />
              <span>
                <strong>Knowledge Base:</strong> For specific transaction dossiers, use the Case Investigation Copilot.
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col space-y-1 max-w-[85%]",
                    m.sender === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl leading-relaxed",
                      m.sender === "user"
                        ? "bg-[#007BFF] text-white rounded-br-xs font-medium"
                        : "bg-[#F6F6F6] text-[#000000] border border-[#CED4DA]/70 rounded-bl-xs"
                    )}
                  >
                    {m.text}
                  </div>

                  {m.sources && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.sources.map((s) => (
                        <span
                          key={s}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EDF0F3] text-[#4E4E50]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-[#6C757D] font-mono px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1 text-[11px] text-[#6C757D] font-mono p-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1">Synthesizing compliance knowledge...</span>
                </div>
              )}
            </div>

            {/* Suggested Chips */}
            <div className="p-3 border-t border-[#CED4DA]/50 bg-[#F6F6F6] space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#6C757D] uppercase block">
                Suggested Questions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-white border border-[#CED4DA] text-[#4E4E50] hover:text-[#007BFF] hover:border-[#007BFF] transition-colors truncate max-w-full text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-[#CED4DA] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about MFS typologies, scoring rules..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#CED4DA] focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isTyping}
                className="h-9 px-3 bg-[#007BFF] hover:bg-[#0054A6] text-white shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
