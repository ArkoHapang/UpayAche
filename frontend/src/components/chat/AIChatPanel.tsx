"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  AlertTriangle,
  Globe,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import {
  sendChatMessage,
  fetchChatSessions,
  fetchChatHistory,
  deleteChatSession,
  submitChatFeedback,
  ChatMessageResponse,
  ChatCitation,
  ChatSessionItem,
  StructuredRiskEvidence,
  TieredInvestigationResponse
} from "@/lib/api";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatError from "./ChatError";
import ChatEmptyState from "./ChatEmptyState";
import { SUGGESTED_QUESTIONS } from "./SuggestedQuestion";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  confidence_tier?: "HIGH" | "MEDIUM" | "LOW" | string;
  suggested_actions?: string[];
  feedback?: number | null;
  created_at: string;
  structured_evidence?: StructuredRiskEvidence | null;
  tiered_response?: TieredInvestigationResponse | null;
}

export interface AIChatPanelHandle {
  sendMessage: (msg: string) => void;
  newConversation: () => void;
}

export interface AIChatPanelProps {
  initialSessionId?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  className?: string;
  showHeaderControls?: boolean;
}

export const AIChatPanel = React.forwardRef<AIChatPanelHandle, AIChatPanelProps>(({
  initialSessionId,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
  className = "",
  showHeaderControls = true
}, ref) => {
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, errorMsg]);

  // Load existing session history if initialSessionId is provided
  useEffect(() => {
    if (initialSessionId) {
      loadSessionHistory(initialSessionId);
    }
  }, [initialSessionId]);

  const loadSessionHistory = async (sid: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const hist = await fetchChatHistory(sid);
      setSessionId(hist.session_id);
      const converted: MessageItem[] = (hist.messages || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          citations: m.citations,
          created_at: m.created_at
        }));
      setMessages(converted);
    } catch (err) {
      console.warn("Failed to load session history:", err);
      setErrorMsg("Could not load previous session history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSessions = async () => {
    setShowHistoryDrawer(true);
    setIsLoadingSessions(true);
    try {
      const items = await fetchChatSessions();
      setSessions(items);
    } catch (err) {
      console.warn("Failed to load chat sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSelectSession = (sid: string) => {
    setShowHistoryDrawer(false);
    if (sid === sessionId) return;
    loadSessionHistory(sid);
  };

  const handleNewConversation = () => {
    setSessionId(undefined);
    setMessages([]);
    setErrorMsg(null);
    setInputText("");
    setShowHistoryDrawer(false);
    inputRef.current?.focus();
  };

  const handleClearConversation = async () => {
    if (sessionId) {
      try {
        await deleteChatSession(sessionId);
      } catch (err) {
        console.debug("Remote session cleanup skipped:", err);
      }
    }
    handleNewConversation();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    const userMsgId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      role: "user",
      content: query,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      const res: ChatMessageResponse = await sendChatMessage(
        query,
        sessionId,
        undefined,
        selectedLanguage
      );

      if (!sessionId && res.session_id) {
        setSessionId(res.session_id);
      }

      const assistantMsg: MessageItem = {
        id: res.id,
        role: "assistant",
        content: res.content,
        citations: res.citations,
        confidence_tier: res.confidence_tier,
        suggested_actions: res.suggested_actions,
        created_at: res.created_at,
        structured_evidence: res.structured_evidence,
        tiered_response: res.tiered_response
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat message failed:", err);
      setErrorMsg(
        err?.message ||
          "Failed to receive response from UpayAche AI backend. Ensure backend is running at http://localhost:8000."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
    try {
      await submitChatFeedback(messageId, rating);
    } catch (err) {
      console.warn("Feedback recording skipped:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  React.useImperativeHandle(ref, () => ({
    sendMessage: (msg: string) => {
      handleSendMessage(msg);
    },
    newConversation: () => {
      handleNewConversation();
    }
  }));

  return (
    <div
      className={`relative flex flex-col h-full w-full bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden font-sans ${className}`}
      role="dialog"
      aria-label="UpayAche AI Assistant chat panel"
    >
      {/* ================= Header ================= */}
      <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0054A6] flex items-center justify-center text-white shadow-md shadow-[#007BFF]/20">
            <Bot className="w-4 h-4" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#FFD602] border-2 border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                UpayAche AI Assistant
              </h2>
            </div>
            <p className="text-[11px] text-[#007BFF] dark:text-blue-400 font-semibold truncate">
              Risk &amp; Security Help
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-label="Change chat language"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#007BFF]" />
              <span className="text-[11px] uppercase font-bold hidden sm:inline">
                {selectedLanguage}
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 z-50 text-xs">
                {(["auto", "en", "bn", "banglish"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(l);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedLanguage === l
                        ? "bg-[#007BFF]/10 text-[#007BFF] dark:text-blue-400 font-bold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {l === "auto" ? "Auto Detect" : l === "en" ? "English" : l === "bn" ? "বাংলা" : "Banglish"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* History / Sessions button */}
          <button
            type="button"
            onClick={handleOpenSessions}
            aria-label="View conversation history"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
            title="Conversation History"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          {/* New Conversation button */}
          <button
            type="button"
            onClick={handleNewConversation}
            aria-label="New conversation"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
            title="New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Clear / Restart button */}
          <button
            type="button"
            onClick={handleClearConversation}
            aria-label="Clear conversation"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
            title="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {showHeaderControls && (
            <>
              {onToggleMaximize && (
                <button
                  type="button"
                  onClick={onToggleMaximize}
                  aria-label={isMaximized ? "Restore chat window" : "Maximize chat window"}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close assistant"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= Session History Slide-in Drawer ================= */}
      {showHistoryDrawer && (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md z-30 flex flex-col animate-in fade-in-50 duration-200">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-[#007BFF]" />
              <span>Conversation History</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Close history drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <button
              type="button"
              onClick={handleNewConversation}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#007BFF]/50 text-[#007BFF] hover:bg-[#007BFF]/10 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Conversation</span>
            </button>

            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#007BFF]" />
                <span>Loading past sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No previous conversations found.
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                    s.id === sessionId
                      ? "bg-[#007BFF]/10 border-[#007BFF]/40 text-[#007BFF] font-semibold"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#007BFF]/30"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title || "Conversation"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(s.updated_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= Chat Body / Messages ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.length === 0 ? (
          <ChatEmptyState
            onSelectQuestion={(q) => handleSendMessage(q)}
            selectedLanguage={selectedLanguage}
            onLanguageChange={(lang) => setSelectedLanguage(lang)}
          />
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              id={m.id}
              role={m.role}
              content={m.content}
              citations={m.citations}
              confidenceTier={m.confidence_tier}
              suggestedActions={m.suggested_actions}
              feedback={m.feedback}
              createdAt={m.created_at}
              structuredEvidence={m.structured_evidence}
              tieredResponse={m.tiered_response}
              onFeedback={handleFeedback}
              onSuggestedClick={(q) => handleSendMessage(q)}
            />
          ))
        )}

        {isLoading && <TypingIndicator />}

        {errorMsg && (
          <ChatError
            message={errorMsg}
            onRetry={() => {
              const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
              if (lastUserMsg) handleSendMessage(lastUserMsg.content);
            }}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar (when there are messages, offer suggested questions above input) */}
      {messages.length > 0 && !isLoading && (
        <div className="px-3 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
            <Sparkles className="w-3 h-3 text-[#FFD602]" />
            Ask:
          </span>
          {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-[#007BFF]/10 hover:text-[#007BFF] dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ================= Message Input & Footer ================= */}
      <div className="shrink-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#007BFF] focus-within:border-transparent transition-all"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about transaction risk, scams, mule networks... (Enter to send)"
            disabled={isLoading}
            maxLength={1500}
            className="flex-1 bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 max-h-24 py-1 leading-relaxed"
          />

          <div className="flex items-center gap-1 shrink-0">
            {inputText.length > 50 && (
              <span className="text-[10px] text-slate-400 font-mono pr-1">
                {inputText.length}/1500
              </span>
            )}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              aria-label="Send message"
              className="p-2 rounded-lg bg-gradient-to-r from-[#007BFF] to-[#0054A6] hover:from-blue-600 hover:to-[#003875] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#007BFF]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Prototype Disclaimer */}
        <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500 font-sans flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-[#007BFF] shrink-0" />
          <span>UpayAche AI Assistant • Prototype for DIU CPC × upay AI Hackathon 2026 • Official care: 16268</span>
        </p>
      </div>
    </div>
  );
});

AIChatPanel.displayName = "AIChatPanel";

export default AIChatPanel;
