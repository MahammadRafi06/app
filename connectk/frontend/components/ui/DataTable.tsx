"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (item: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  selectable,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  pagination,
  emptyMessage = "No items found.",
  emptyAction,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((item) => selectedIds.has(item.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map((item) => item.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.(next);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === "asc"
      ? <ChevronUp className="w-3 h-3 ml-1 text-brand-600" />
      : <ChevronDown className="w-3 h-3 ml-1 text-brand-600" />;
  };

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectable && <th className="w-10 px-4 py-3" />}
                {columns.map((col) => (
                  <th key={col.key} className="table-header">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td className="px-4 py-3"><div className="skeleton w-4 h-4" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      <div className="skeleton h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("table-header", col.sortable && onSort && "cursor-pointer hover:bg-gray-100 select-none", col.className)}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && onSort && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-16 text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p>{emptyMessage}</p>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    onRowClick && "cursor-pointer",
                    selectedIds.has(item.id) && "bg-brand-50"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td
                      className="px-4 py-3"
                      onClick={(e) => { e.stopPropagation(); toggleOne(item.id); }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("table-cell", col.className)}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-white">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{" "}
            {pagination.totalItems} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-lg",
                    p === pagination.page
                      ? "bg-brand-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-ghost p-1.5 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
