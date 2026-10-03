"use client";

import React, { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  onSearch?: (val: string) => void;
  placeholder?: string;
  category?: string;
  categories?: string[];
  onCategoryChange?: (cat: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Search wallet 017..., tx_hash, or case number...",
  category,
  categories,
  onCategoryChange,
  loading = false,
  disabled = false,
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    onSearch?.("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(query);
    } else if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#CED4DA]/80 shadow-xs transition-all duration-150",
        // Focus-visible and focus-within state
        "focus-within:border-[#007BFF] focus-within:ring-2 focus-within:ring-[#007BFF]/20",
        disabled && "bg-[#F6F6F6] opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* Category Dropdown (if provided) */}
      {categories && categories.length > 0 && (
        <div className="shrink-0 pl-1">
          <select
            value={category || categories[0]}
            disabled={disabled}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="text-xs font-mono font-medium text-[#4E4E50] bg-[#F6F6F6] border border-[#CED4DA] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#007BFF] cursor-pointer disabled:cursor-not-allowed"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Input Icon or Loading Spinner */}
      {loading ? (
        <Loader2 className="w-4 h-4 text-[#007BFF] animate-spin ml-2 shrink-0" />
      ) : (
        <Search className="w-4 h-4 text-[#6C757D] ml-2 shrink-0" />
      )}

      {/* Input */}
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs text-[#000000] placeholder:text-[#6C757D] focus:outline-none py-1 disabled:cursor-not-allowed"
        aria-label="Search records"
      />

      {/* Clear Button */}
      {query && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-lg text-[#6C757D] hover:text-[#000000] hover:bg-[#F6F6F6] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#007BFF]"
          aria-label="Clear search query"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Keyboard Shortcut Hint */}
      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-[#CED4DA] bg-[#F6F6F6] font-mono text-[10px] text-[#6C757D] mr-1 shrink-0">
        ⌘K
      </span>
    </div>
  );
};
