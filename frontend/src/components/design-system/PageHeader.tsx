"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#CED4DA]/70",
        className
      )}
    >
      <div className="space-y-1 max-w-2xl">
        {/* Optional Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-1.5 text-xs text-[#6C757D] mb-1"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-[#CED4DA] shrink-0" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#007BFF] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#000000] font-medium" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#000000]">
            {title}
          </h1>
          {badge}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-[#4E4E50] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};
