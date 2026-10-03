"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle, AlertOctagon } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all focus-visible:ring-2 disabled:opacity-50 ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-500"
                : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-amber-500"
            }`}
          >
            {isLoading ? "Executing..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isDestructive ? (
            <AlertOctagon className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pt-1">
          {message}
        </p>
      </div>
    </Modal>
  );
};
