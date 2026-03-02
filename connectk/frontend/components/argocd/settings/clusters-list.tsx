"use client";

import { useState } from "react";
import { useClusters, useDeleteCluster } from "@/hooks/argocd/use-clusters";
import { type Cluster } from "@/lib/argocd-schemas";
import { ConnectionBadge } from "@/components/argocd/applications/status-badges";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { TableSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Trash2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/argocd-utils";
import Link from "next/link";

export function ClustersList() {
  const { data, isLoading, error, refetch } = useClusters();
  const deleteCluster = useDeleteCluster();
  const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);

  const clusters = data?.items ?? [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <p className="text-destructive text-sm">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{clusters.length} clusters</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {clusters.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No Clusters"
          description="No Kubernetes clusters are registered."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Server</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>K8s Version</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clusters.map((cluster) => {
                const connectionState =
                  cluster.connectionState ?? cluster.info?.connectionState;
                return (
                  <TableRow key={cluster.server} className="group">
                    <TableCell className="font-medium text-sm">
                      <Link
                        href={`/argocd-settings/clusters/${encodeURIComponent(cluster.server)}`}
                        className="text-primary hover:underline"
                      >
                        {cluster.name ?? cluster.server}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[250px] truncate">
                      {cluster.server}
                      {cluster.server === "https://kubernetes.default.svc" && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">in-cluster</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ConnectionBadge status={connectionState?.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {cluster.serverVersion ?? cluster.info?.serverVersion ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cluster.cacheInfo?.resourcesCount !== undefined
                        ? cluster.cacheInfo.resourcesCount.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cluster.cacheInfo?.lastCacheSyncTime
                        ? formatDate(cluster.cacheInfo.lastCacheSyncTime)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {cluster.server !== "https://kubernetes.default.svc" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cluster)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Remove Cluster"
        description={`Remove cluster "${deleteTarget?.name ?? deleteTarget?.server}" from FluxBoard?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget)
            deleteCluster.mutate(deleteTarget.server, { onSuccess: () => setDeleteTarget(null) });
        }}
        loading={deleteCluster.isPending}
      />
    </div>
  );
}
