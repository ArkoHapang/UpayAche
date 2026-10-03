"use client";

import React from "react";
import { StatusBadge } from "./StatusBadge";
import { FolderLock, MessageSquare, Clock, ArrowRight, UserCheck } from "lucide-react";

interface InvestigationCardProps {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: "OPEN" | "INVESTIGATING" | "REVIEWED" | "CLOSED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  resolution?: string;
  assignedTo?: string;
  notesCount?: number;
  createdAt: string;
  onClick?: () => void;
  className?: string;
}

export const InvestigationCard: React.FC<InvestigationCardProps> = ({
  id,
  caseNumber,
  title,
  description,
  status,
  priority,
  resolution = "PENDING",
  assignedTo,
  notesCount = 0,
  createdAt,
  onClick,
  className = "",
}) => {
  const priorityColors = {
    CRITICAL: "border-rose-200 bg-rose-50 text-rose-800",
    HIGH: "border-orange-200 bg-orange-50 text-orange-800",
    MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
    LOW: "border-slate-200 bg-slate-100 text-slate-700",
  };

  const priorityStyle =
    priorityColors[priority.toUpperCase() as keyof typeof priorityColors] ||
    priorityColors.MEDIUM;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-3 ${className}`}
    >
      {/* Top: Case Number, Priority & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <FolderLock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="font-mono font-bold text-xs text-slate-900">
            {caseNumber}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${priorityStyle}`}
          >
            {priority}
          </span>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Meta Specs & Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 font-mono">
        <div className="flex items-center gap-3">
          {assignedTo && (
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <UserCheck className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[100px]">{assignedTo}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <MessageSquare className="w-3 h-3 text-slate-400" />
            <span>{notesCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{createdAt}</span>
        </div>
      </div>
    </div>
  );
};
