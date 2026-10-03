"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  onMenuToggle?: () => void;
  userRole?: string;
  userName?: string;
  alertCount?: number;
  onSearchClick?: () => void;
  actions?: React.ReactNode;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onMenuToggle,
  userRole = "ANALYST",
  userName = "Compliance Analyst",
  alertCount = 2,
  onSearchClick,
  actions,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#CED4DA]/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Brand / Search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-[#4E4E50] hover:text-[#000000] hover:bg-[#F6F6F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold text-xs shadow-xs">
            <ShieldAlert className="w-4 h-4 text-[#000000]" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#000000]">
            UpayAche
          </span>
        </div>

        {/* Desktop Quick Search Trigger */}
        <div className="hidden sm:flex items-center">
          <button
            type="button"
            onClick={onSearchClick}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#CED4DA] bg-[#F6F6F6] text-[#6C757D] hover:text-[#000000] hover:bg-[#EDF0F3] transition-all text-xs w-64 text-left shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
          >
            <Search className="w-3.5 h-3.5 text-[#6C757D]" />
            <span className="truncate">Search wallet, tx, or case...</span>
            <kbd className="hidden lg:inline-block ml-auto px-1.5 py-0.5 rounded border border-[#CED4DA] bg-white font-mono text-[10px] text-[#6C757D]">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Actions, Engine Status, Notifications, Role Badge & Profile */}
      <div className="flex items-center gap-3">
        {/* Custom Actions (e.g. AI Assistant) */}
        {actions}

        {/* ML Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>ML Risk Engine Active</span>
        </div>

        {/* Notifications Icon with Badge */}
        <button
          type="button"
          className="p-2 rounded-xl text-[#4E4E50] hover:text-[#000000] hover:bg-[#F6F6F6] transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
          aria-label="View Alerts"
        >
          <Bell className="w-4 h-4 text-[#4E4E50]" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
          )}
        </button>

        {/* Help & Knowledge Center Link */}
        <Link
          href="/help"
          className="p-2 rounded-xl text-[#4E4E50] hover:text-[#000000] hover:bg-[#F6F6F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
          title="Help & Knowledge Base"
        >
          <HelpCircle className="w-4 h-4 text-[#4E4E50]" />
        </Link>

        {/* Role Badge */}
        <span
          className={cn(
            "hidden sm:inline-block font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border select-none",
            userRole === "ADMIN"
              ? "border-[#007BFF]/30 bg-[#EFF6FF] text-[#0054A6]"
              : userRole === "ANALYST"
              ? "border-[#FFD602]/80 bg-[#FFFDF0] text-[#78350F]"
              : "border-[#CED4DA] bg-[#F6F6F6] text-[#4E4E50]"
          )}
        >
          {userRole}
        </span>

        {/* User Avatar */}
        <Link
          href="/settings"
          title="Account & System Settings"
          className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-xl border border-[#CED4DA] hover:border-[#6C757D] hover:bg-[#F6F6F6] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
        >
          <div className="w-6 h-6 rounded-lg bg-[#007BFF] text-white flex items-center justify-center font-bold text-[10px]">
            {userName.charAt(0)}
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold text-[#000000] truncate max-w-[120px]">
            {userName}
          </span>
        </Link>
      </div>
    </header>
  );
};
