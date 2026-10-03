"use client";

import React, { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className={cn(
          "w-full bg-white rounded-3xl border border-[#CED4DA]/70 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]",
          maxWidthClasses[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#CED4DA]/60 bg-white">
          <div className="space-y-0.5">
            <h2
              id="modal-title"
              className="text-base font-bold text-[#000000] tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-[#6C757D] hover:text-[#000000] hover:bg-[#F6F6F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-[#4E4E50] relative">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#007BFF]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-medium text-[#6C757D]">Loading content...</p>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#CED4DA]/60 bg-[#F6F6F6]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
