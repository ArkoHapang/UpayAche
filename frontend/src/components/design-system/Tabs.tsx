"use client";

import React, { createContext, useContext, useState, useId } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : internalValue;

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSelect,
        baseId,
      }}
    >
      <div className={cn("w-full space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  variant?: "line" | "pill";
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = "",
  variant = "line",
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1",
        variant === "line" && "border-b border-[#CED4DA] pb-px",
        variant === "pill" &&
          "p-1 bg-[#F6F6F6] rounded-xl border border-[#CED4DA]/70 inline-flex",
        className
      )}
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  badge?: string | number;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  disabled = false,
  className = "",
  badge,
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");

  const isSelected = ctx.activeTab === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      disabled={disabled}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => ctx.setActiveTab(value)}
      className={cn(
        "relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 select-none",
        // Focus visible state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2",
        // Active click scale
        "active:scale-[0.98]",
        // State styling
        isSelected
          ? "text-[#007BFF] bg-[#EFF6FF] border border-[#BFDBFE]"
          : "text-[#6C757D] hover:text-[#000000] hover:bg-[#F6F6F6]",
        // Disabled state
        disabled &&
          "opacity-40 cursor-not-allowed pointer-events-none text-[#6C757D]",
        className
      )}
    >
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
            isSelected
              ? "bg-[#007BFF] text-white"
              : "bg-[#CED4DA] text-[#4E4E50]"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = "",
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");

  const isSelected = ctx.activeTab === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] rounded-lg",
        className
      )}
    >
      {children}
    </div>
  );
};
