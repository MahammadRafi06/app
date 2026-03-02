"use client";

import { useState } from "react";
import { type ResourceStatus, type ResourceNode } from "@/lib/argocd-schemas";
import { HealthBadge, SyncBadge } from "./status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink } from "lucide-react";

interface ResourceListProps {
  resources: ResourceStatus[];
  onSelect?: (resource: ResourceStatus) => void;
}

const ALL = "All";

export function ResourceList({ resources, onSelect }: ResourceListProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState(ALL);
  const [healthFilter, setHealthFilter] = useState(ALL);
  const [syncFilter, setSyncFilter] = useState(ALL);

  const kinds = [ALL, ...Array.from(new Set(resources.map((r) => r.kind))).sort()];
  const healthStatuses = [ALL, "Healthy", "Degraded", "Progressing", "Suspended", "Missing", "Unknown"];
  const syncStatuses = [ALL, "Synced", "OutOfSync", "Unknown"];

  const filtered = resources.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !r.kind.toLowerCase().includes(search.toLowerCase())) return false;
    if (kindFilter !== ALL && r.kind !== kindFilter) return false;
    if (healthFilter !== ALL && r.health?.status !== healthFilter) return false;
    if (syncFilter !== ALL && r.status !== syncFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="pl-9"
          />
        </div>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            {healthStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={syncFilter} onValueChange={setSyncFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sync" />
          </SelectTrigger>
          <SelectContent>
            {syncStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Kind</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Namespace</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Sync</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No resources match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={`${r.kind}-${r.namespace}-${r.name}`}
                  className="cursor-pointer group"
                  onClick={() => onSelect?.(r)}
                >
                  <TableCell className="font-mono text-xs">{r.kind}</TableCell>
                  <TableCell className="font-medium text-sm">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.namespace ?? "—"}
                  </TableCell>
                  <TableCell>
                    <HealthBadge status={r.health?.status} />
                  </TableCell>
                  <TableCell>
                    <SyncBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); onSelect?.(r); }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {resources.length} resources
      </p>
    </div>
  );
}
