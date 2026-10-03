"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onClick?: () => void;
  accent?: "yellow" | "navy" | "rose" | "purple" | "blue";
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  onClick,
  accent = "yellow",
  className = "",
}) => {
  const accentIconBg = {
    yellow:
      "bg-[#FFFDF0] text-[#000000] border border-[#FFD602]/50 group-hover:bg-[#FFD602] group-hover:text-[#000000]",
    blue:
      "bg-[#EFF6FF] text-[#0054A6] border border-[#BFDBFE] group-hover:bg-[#007BFF] group-hover:text-white",
    navy:
      "bg-[#EDF0F3] text-[#002A54] border border-[#CED4DA] group-hover:bg-[#002A54] group-hover:text-white",
    rose:
      "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] group-hover:bg-[#DC2626] group-hover:text-white",
    purple:
      "bg-purple-50 text-purple-700 border border-purple-200 group-hover:bg-purple-700 group-hover:text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs hover:shadow-md hover:border-[#007BFF]/50 transition-all text-left flex flex-col justify-between group relative overflow-hidden select-none active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2",
        className
      )}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#F6F6F6] text-[#4E4E50] border border-[#CED4DA]">
          {badge}
        </span>
      )}

      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors shrink-0 shadow-2xs",
          accentIconBg[accent]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-0.5 w-full">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs sm:text-sm font-bold text-[#000000] tracking-tight group-hover:text-[#007BFF] transition-colors">
            {title}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#6C757D] group-hover:text-[#007BFF] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <p className="text-[11px] text-[#4E4E50] leading-snug line-clamp-2">
          {subtitle}
        </p>
      </div>
    </button>
  );
};
