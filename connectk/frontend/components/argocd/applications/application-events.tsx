"use client";

import { useApplicationEvents } from "@/hooks/argocd/use-applications";
import { formatDate, formatRelativeDate } from "@/lib/argocd-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { Bell } from "lucide-react";

interface ApplicationEventsProps {
  appName: string;
}

export function ApplicationEvents({ appName }: ApplicationEventsProps) {
  const { data, isLoading, error } = useApplicationEvents(appName);

  if (isLoading) return <TableSkeleton rows={6} />;
  if (error) return <p className="text-destructive text-sm">{(error as Error).message}</p>;

  const events = (data?.items ?? []).sort((a, b) => {
    const ta = a.lastTimestamp ?? a.firstTimestamp ?? "";
    const tb = b.lastTimestamp ?? b.firstTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No Events"
        description="No Kubernetes events recorded for this application yet."
      />
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Type</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Object</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((evt) => (
            <TableRow key={`${evt.metadata.name}-${evt.metadata.resourceVersion}`}>
              <TableCell>
                <Badge
                  variant={evt.type === "Warning" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {evt.type ?? "Normal"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-sm">{evt.reason ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">
                {evt.involvedObject
                  ? `${evt.involvedObject.kind}/${evt.involvedObject.name}`
                  : "—"}
              </TableCell>
              <TableCell className="text-sm max-w-[300px]">
                <span className="line-clamp-2">{evt.message ?? "—"}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {evt.count ?? 1}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {evt.lastTimestamp
                  ? formatRelativeDate(evt.lastTimestamp)
                  : evt.firstTimestamp
                  ? formatRelativeDate(evt.firstTimestamp)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
