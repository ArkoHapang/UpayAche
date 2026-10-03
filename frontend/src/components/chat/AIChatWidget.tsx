"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageSquare, X, Sparkles } from "lucide-react";
import AIChatPanel from "./AIChatPanel";

export interface AIChatWidgetProps {
  defaultOpen?: boolean;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  defaultOpen = false
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMaximized, setIsMaximized] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<any>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Listen for global open event with optional prompt from Help articles
  useEffect(() => {
    const handleOpenAI = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        setTimeout(() => {
          if (panelRef.current && typeof panelRef.current.sendMessage === "function") {
            panelRef.current.sendMessage(customEvent.detail.prompt);
          }
        }, 150);
      }
    };
    window.addEventListener("open-upayache-ai", handleOpenAI);
    return () => window.removeEventListener("open-upayache-ai", handleOpenAI);
  }, []);

  // If user is already on the dedicated /chat page, suppress the floating widget
  if (pathname === "/chat") {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button (when closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Subtle tooltip / prompt chip on desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md text-xs font-semibold text-slate-800 dark:text-slate-200 pointer-events-none transition-all">
            <span className="w-2 h-2 rounded-full bg-[#FFD602] animate-ping" />
            <span className="text-[#007BFF] font-bold">Ask UpayAche AI</span>
            <span className="text-slate-400 font-normal">• Risk &amp; Security</span>
          </div>

          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open UpayAche AI Assistant"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#007BFF] via-[#0054A6] to-[#003875] text-white shadow-2xl shadow-[#007BFF]/40 hover:shadow-[#007BFF]/60 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#007BFF]/40 ring-2 ring-white/20"
          >
            <Bot className="w-6 h-6 transition-transform group-hover:scale-110" />

            {/* Signature Golden Yellow Upay Indicator */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#FFD602] border-2 border-slate-900 rounded-full shadow-sm" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#FFD602] border-2 border-slate-900 rounded-full animate-ping opacity-75" />
          </button>
        </div>
      )}

      {/* Chat Panel Modal: Full-screen on mobile, floating on desktop */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 animate-in fade-in-50 zoom-in-95 ${
            isMaximized
              ? "inset-2 md:inset-6"
              : "inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[440px] md:h-[640px] md:max-h-[85vh]"
          }`}
        >
          <AIChatPanel
            ref={panelRef}
            onClose={() => {
              setIsOpen(false);
              triggerButtonRef.current?.focus();
            }}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
            className="h-full w-full rounded-none md:rounded-2xl"
          />
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
