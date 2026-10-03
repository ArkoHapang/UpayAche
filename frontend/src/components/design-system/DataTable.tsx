"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  pageSize = 10,
  onRowClick,
  loading = false,
  error = null,
  onRetry,
  className = "",
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#CED4DA]/70 bg-white overflow-hidden shadow-xs space-y-0",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#CED4DA]/80 bg-[#F6F6F6] text-[#4E4E50] font-mono uppercase tracking-wider text-[10px]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-3 px-4 font-bold text-[#000000]",
                    alignClasses[col.align || "left"]
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF0F3]">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse">
                  {columns.map((col, colIdx) => (
                    <td key={`loading-${i}-${colIdx}`} className="py-3.5 px-4">
                      <div className="h-4 bg-[#EDF0F3] rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error state row
              <tr>
                <td colSpan={columns.length} className="py-8 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-[#DC2626]" />
                    <p className="text-xs font-semibold text-[#DC2626]">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="px-3 py-1 text-xs font-medium bg-[#007BFF] text-white rounded-lg hover:bg-[#0054A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              // Empty state row
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 px-4 text-center text-[#6C757D]"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-7 h-7 text-[#CED4DA]" />
                    <p className="text-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowKey = row.id ? String(row.id) : String(startIndex + rowIdx);
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onRowClick?.(row);
                      }
                    }}
                    className={cn(
                      "transition-colors duration-150 text-[#000000]",
                      isClickable &&
                        "cursor-pointer hover:bg-[#F6F6F6] focus-visible:outline-none focus-visible:bg-[#EFF6FF] focus-visible:ring-1 focus-visible:ring-[#007BFF]"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "py-3.5 px-4 text-[#4E4E50]",
                          alignClasses[col.align || "left"]
                        )}
                      >
                        {col.render
                          ? col.render(row, startIndex + rowIdx)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#CED4DA]/70 bg-[#F6F6F6] text-xs text-[#4E4E50] font-mono">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, data.length)} of{" "}
            {data.length} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#CED4DA] bg-white hover:bg-[#EDF0F3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-[#000000] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-[#000000]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#CED4DA] bg-white hover:bg-[#EDF0F3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-[#000000] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
