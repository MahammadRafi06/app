"use client";

import { Button } from "@/components/ui/button";
import { GitMerge, RefreshCw, X } from "lucide-react";

interface BulkActionsBarProps {
  count: number;
  onSyncAll: () => void;
  onRefreshAll: () => void;
  onClear: () => void;
  syncing?: boolean;
  refreshing?: boolean;
}

export function BulkActionsBar({
  count,
  onSyncAll,
  onRefreshAll,
  onClear,
  syncing,
  refreshing,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSyncAll} disabled={syncing} className="gap-1.5">
          <GitMerge className="h-3.5 w-3.5" />
          {syncing ? "Syncing..." : "Sync All"}
        </Button>
        <Button size="sm" variant="outline" onClick={onRefreshAll} disabled={refreshing} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          {refreshing ? "Refreshing..." : "Refresh All"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} className="gap-1.5">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
