"use client";

import React, { forwardRef, useId } from "react";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  loading?: boolean;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options = [],
      error,
      helperText,
      loading = false,
      containerClassName,
      disabled,
      required,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const hasError = Boolean(error);
    const isDisabled = disabled || loading;

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[#4E4E50] tracking-tight"
          >
            {label}
            {required && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={isDisabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            aria-busy={loading ? "true" : undefined}
            className={cn(
              "w-full h-10 px-3 pr-10 py-2 rounded-xl text-sm bg-white text-[#000000] border transition-all duration-150 appearance-none cursor-pointer",
              // Default and hover states
              "border-[#CED4DA] hover:border-[#6C757D]",
              // Focus-visible WCAG 2.2 AA compliant ring
              "focus-visible:outline-none focus-visible:border-[#007BFF] focus-visible:ring-2 focus-visible:ring-[#007BFF]/25",
              // Active state
              "active:border-[#0054A6]",
              // Disabled state
              "disabled:bg-[#F6F6F6] disabled:text-[#6C757D] disabled:cursor-not-allowed disabled:border-[#CED4DA]/80",
              // Error state
              hasError &&
                "border-[#DC2626] text-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/20",
              className
            )}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Right indicator: spinner, error icon, or ChevronDown */}
          <div className="absolute right-3 flex items-center pointer-events-none text-[#6C757D]">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#007BFF]" aria-hidden="true" />
            ) : hasError ? (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[#DC2626] font-medium flex items-center gap-1"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[#6C757D]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
