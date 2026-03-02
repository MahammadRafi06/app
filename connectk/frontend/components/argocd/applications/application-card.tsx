"use client";

import Link from "next/link";
import { type Application } from "@/lib/argocd-schemas";
import { formatRelativeDate, repoUrlToDisplayName } from "@/lib/argocd-utils";
import { HealthBadge, SyncBadge, PhaseBadge } from "./status-badges";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreVertical,
  RefreshCw,
  GitMerge,
  Trash2,
  ExternalLink,
  Server,
  GitBranch,
  Star,
} from "lucide-react";

interface ApplicationCardProps {
  app: Application;
  onSync?: (app: Application) => void;
  onRefresh?: (app: Application) => void;
  onDelete?: (app: Application) => void;
  selected?: boolean;
  onSelect?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ApplicationCard({
  app,
  onSync,
  onRefresh,
  onDelete,
  selected,
  onSelect,
  favorite,
  onToggleFavorite,
}: ApplicationCardProps) {
  const source = app.spec.source ?? app.spec.sources?.[0];
  const health = app.status?.health?.status;
  const sync = app.status?.sync?.status;
  const phase = app.status?.operationState?.phase;
  const isOperating = phase === "Running";

  return (
    <Card className="group relative hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          health === "Healthy" ? "bg-emerald-500" :
          health === "Degraded" ? "bg-red-500" :
          health === "Progressing" ? "bg-blue-500" :
          health === "Suspended" ? "bg-amber-500" :
          "bg-slate-300 dark:bg-slate-600"
        )}
      />

      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-2 right-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="h-4 w-4"
          />
        </div>
      )}

      {/* Favorite star */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
          className={cn(
            "absolute top-2 left-3 z-10 transition-opacity",
            favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
        </button>
      )}

      <CardHeader className="pl-5 pr-3 pt-4 pb-2 flex flex-row items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/applications/${encodeURIComponent(app.metadata.name)}`}
            className="font-semibold text-sm hover:text-primary transition-colors truncate block"
          >
            {app.metadata.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {app.spec.project}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/applications/${encodeURIComponent(app.metadata.name)}`} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSync?.(app)} className="gap-2">
              <GitMerge className="h-4 w-4" />
              Sync
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefresh?.(app)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(app)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pl-5 pt-0 pb-4 space-y-3">
        {/* Status row */}
        <div className="flex flex-wrap gap-1.5">
          <HealthBadge status={health} />
          <SyncBadge status={sync} />
          {isOperating && <PhaseBadge phase={phase} />}
        </div>

        {/* Destination */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Server className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {app.spec.destination.namespace
              ? `${app.spec.destination.namespace} · ${
                  app.spec.destination.name ?? app.spec.destination.server ?? "unknown"
                }`
              : app.spec.destination.name ?? app.spec.destination.server ?? "unknown"}
          </span>
        </div>

        {/* Source */}
        {source && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {repoUrlToDisplayName(source.repoURL)}
              {source.targetRevision && ` @ ${source.targetRevision}`}
              {source.path && ` · ${source.path}`}
              {source.chart && ` (${source.chart})`}
            </span>
          </div>
        )}

        {/* Last sync */}
        {app.status?.operationState?.finishedAt && (
          <p className="text-[11px] text-muted-foreground">
            Synced {formatRelativeDate(app.status.operationState.finishedAt)}
          </p>
        )}

        {/* Auto-sync indicator */}
        {app.spec.syncPolicy?.automated && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            Auto-sync
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
