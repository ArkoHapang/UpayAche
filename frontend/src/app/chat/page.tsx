"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Sparkles,
  ArrowLeft,
  BookOpen,
  PhoneCall,
  ShieldAlert,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import { fetchKnowledgeTopics, KnowledgeTopic } from "@/lib/api";
import { AIChatPanel, type AIChatPanelHandle } from "@/components/chat";

export default function CustomerChatPage() {
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const chatPanelRef = useRef<AIChatPanelHandle>(null);

  useEffect(() => {
    fetchKnowledgeTopics()
      .then((data) => setTopics(data))
      .catch((err) => console.warn("Topics fetch skipped:", err));
  }, []);

  const handleSelectPrompt = (prompt: string) => {
    chatPanelRef.current?.sendMessage(prompt);
  };

  const handleNewChat = () => {
    chatPanelRef.current?.newConversation();
  };

  return (
    <div className="min-h-screen bg-[#060A13] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0054A6] flex items-center justify-center text-white shadow-md shadow-[#007BFF]/20">
              <Bot className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#FFD602] border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">UpayAche AI Assistant</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#007BFF]/15 text-[#007BFF] dark:text-blue-400 font-bold uppercase tracking-wider">
                  Prototype
                </span>
              </div>
              <p className="text-[11px] text-[#007BFF] dark:text-blue-400 font-semibold">
                Risk &amp; Security Help
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/help"
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline-block"
          >
            Help & Knowledge
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline-block"
          >
            Analyst Dashboard
          </Link>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-xs bg-[#007BFF]/15 hover:bg-[#007BFF]/25 text-[#007BFF] dark:text-blue-400 border border-[#007BFF]/30 px-3 py-1.5 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Left Sidebar: Knowledge Topics & Official Support */}
        <div className="hidden lg:flex flex-col gap-4 col-span-1 overflow-hidden">
          {/* Official Support Guidance Card */}
          <div className="bg-[#0B1120] border border-amber-500/30 rounded-2xl p-4 shadow-sm shrink-0">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Prototype Disclaimer</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              UpayAche is an AI risk &amp; scam intelligence prototype for the <strong>DIU CPC × upay AI Hackathon 2026</strong>.
              It cannot perform balance transfers or account actions.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Official Helpline:</span>
              <a
                href="tel:16268"
                className="flex items-center gap-1 text-[#FFD602] font-mono font-bold hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>16268</span>
              </a>
            </div>
          </div>

          {/* Curated Knowledge Topics */}
          <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-4 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1 sticky top-0 bg-[#0B1120] pb-1 z-10">
              <BookOpen className="w-4 h-4 text-[#007BFF]" />
              <span>Explore Knowledge Topics</span>
            </div>

            {topics.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Loading knowledge topics...</p>
            ) : (
              topics.map((t) => (
                <div
                  key={t.category}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-[#007BFF]/40 transition-colors"
                >
                  <div className="text-xs font-bold text-slate-200">{t.label}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {t.suggested_prompts.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPrompt(p)}
                        className="group flex items-center justify-between text-left text-[11px] text-slate-300 hover:text-[#007BFF] transition-colors py-0.5"
                      >
                        <span className="truncate pr-1">→ {p}</span>
                        <ArrowRight className="w-3 h-3 text-[#007BFF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Main Chat Panel */}
        <div className="col-span-1 lg:col-span-3 flex flex-col bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden h-[78vh]">
          <AIChatPanel
            ref={chatPanelRef}
            showHeaderControls={false}
            className="h-full border-0 rounded-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
