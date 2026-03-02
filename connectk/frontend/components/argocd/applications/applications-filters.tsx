"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { type Project } from "@/lib/argocd-schemas";

type ViewMode = "grid" | "table";

interface ApplicationsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  healthFilter: string;
  onHealthChange: (v: string) => void;
  syncFilter: string;
  onSyncChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projects: Project[];
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  totalCount: number;
  filteredCount: number;
}

const HEALTH_OPTIONS = ["All", "Healthy", "Degraded", "Progressing", "Suspended", "Missing", "Unknown"];
const SYNC_OPTIONS = ["All", "Synced", "OutOfSync", "Unknown"];

export function ApplicationsFilters({
  search,
  onSearchChange,
  healthFilter,
  onHealthChange,
  syncFilter,
  onSyncChange,
  projectFilter,
  onProjectChange,
  projects,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}: ApplicationsFiltersProps) {
  const hasFilters =
    search ||
    (healthFilter && healthFilter !== "All") ||
    (syncFilter && syncFilter !== "All") ||
    (projectFilter && projectFilter !== "All");

  function clearFilters() {
    onSearchChange("");
    onHealthChange("All");
    onSyncChange("All");
    onProjectChange("All");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Health filter */}
        <Select value={healthFilter} onValueChange={onHealthChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            {HEALTH_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sync filter */}
        <Select value={syncFilter} onValueChange={onSyncChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sync status" />
          </SelectTrigger>
          <SelectContent>
            {SYNC_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project filter */}
        <Select value={projectFilter} onValueChange={onProjectChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.metadata.name} value={p.metadata.name}>
                {p.metadata.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => onViewModeChange("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {hasFilters
            ? `${filteredCount} of ${totalCount} applications`
            : `${totalCount} application${totalCount !== 1 ? "s" : ""}`}
        </span>
        {hasFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>
    </div>
  );
}
