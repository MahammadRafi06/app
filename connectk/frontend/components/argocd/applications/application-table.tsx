"use client";

import Link from "next/link";
import { type Application } from "@/lib/argocd-schemas";
import { formatRelativeDate, repoUrlToDisplayName } from "@/lib/argocd-utils";
import { HealthBadge, SyncBadge, PhaseBadge } from "./status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, GitMerge, RefreshCw, Trash2, ExternalLink, Star } from "lucide-react";

interface ApplicationTableProps {
  apps: Application[];
  onSync?: (app: Application) => void;
  onRefresh?: (app: Application) => void;
  onDelete?: (app: Application) => void;
  selected?: Set<string>;
  onSelect?: (name: string) => void;
  favorites?: string[];
  onToggleFavorite?: (name: string) => void;
}

export function ApplicationTable({
  apps,
  onSync,
  onRefresh,
  onDelete,
  selected,
  onSelect,
  favorites,
  onToggleFavorite,
}: ApplicationTableProps) {
  const hasSelection = !!onSelect;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {hasSelection && <TableHead className="w-10" />}
            {onToggleFavorite && <TableHead className="w-8" />}
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Project</TableHead>
            <TableHead className="font-semibold">Health</TableHead>
            <TableHead className="font-semibold">Sync</TableHead>
            <TableHead className="font-semibold">Destination</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
            <TableHead className="font-semibold">Last Synced</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const source = app.spec.source ?? app.spec.sources?.[0];
            const phase = app.status?.operationState?.phase;
            const isOperating = phase === "Running";
            const isFav = favorites?.includes(app.metadata.name);

            return (
              <TableRow key={app.metadata.name} className="group">
                {hasSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selected?.has(app.metadata.name)}
                      onCheckedChange={() => onSelect?.(app.metadata.name)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                )}
                {onToggleFavorite && (
                  <TableCell>
                    <button onClick={() => onToggleFavorite(app.metadata.name)}>
                      <Star
                        className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground opacity-0 group-hover:opacity-100"} transition-opacity`}
                      />
                    </button>
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <Link
                    href={`/applications/${encodeURIComponent(app.metadata.name)}`}
                    className="hover:text-primary transition-colors"
                  >
                    {app.metadata.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {app.spec.project}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <HealthBadge status={app.status?.health?.status} />
                    {isOperating && <PhaseBadge phase={phase} />}
                  </div>
                </TableCell>
                <TableCell>
                  <SyncBadge status={app.status?.sync?.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span className="font-mono text-xs">
                    {app.spec.destination.namespace && (
                      <>{app.spec.destination.namespace}/</>
                    )}
                  </span>
                  <span className="text-xs">
                    {app.spec.destination.name ?? app.spec.destination.server ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {source ? (
                    <>
                      {repoUrlToDisplayName(source.repoURL)}
                      {source.path && ` / ${source.path}`}
                      {source.chart && ` (${source.chart})`}
                    </>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {app.status?.operationState?.finishedAt
                    ? formatRelativeDate(app.status.operationState.finishedAt)
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/applications/${encodeURIComponent(app.metadata.name)}`}
                          className="gap-2"
                        >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
