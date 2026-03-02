"use client";

import { useParams, useRouter } from "next/navigation";
import { useCluster, useInvalidateClusterCache, useDeleteCluster } from "@/hooks/argocd/use-clusters";
import { Header } from "@/components/argocd/layout/header";
import { DetailSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import { ConnectionBadge } from "@/components/argocd/applications/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, RefreshCw, Trash2, Server } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ClusterDetailPage() {
  const { server } = useParams<{ server: string }>();
  const router = useRouter();
  const decodedServer = decodeURIComponent(server);
  const { data: cluster, isLoading, error } = useCluster(decodedServer);
  const invalidateCache = useInvalidateClusterCache();
  const deleteCluster = useDeleteCluster();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <><Header title="Loading..." /><DetailSkeleton /></>;

  if (error || !cluster) {
    return (
      <>
        <Header title="Cluster" />
        <div className="p-6">
          <p className="text-destructive">{(error as Error)?.message ?? "Cluster not found."}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/argocd-settings/clusters")}>
            Back to Clusters
          </Button>
        </div>
      </>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => invalidateCache.mutate(decodedServer)}
        disabled={invalidateCache.isPending}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Invalidate Cache
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );

  const labels = Object.entries(cluster.labels ?? {});
  const annotations = Object.entries(cluster.annotations ?? {});

  return (
    <>
      <Header title={cluster.name || decodedServer} actions={headerActions} />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link href="/argocd-settings/clusters" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              Clusters
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{cluster.name || decodedServer}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 divide-y text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Server</span>
                  <code className="font-mono text-xs">{cluster.server}</code>
                </div>
                {cluster.name && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Name</span>
                    <span>{cluster.name}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  <ConnectionBadge status={cluster.connectionState?.status} />
                </div>
                {cluster.serverVersion && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">K8s Version</span>
                    <span>{cluster.serverVersion}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {(cluster.info || cluster.cacheInfo) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cluster Info</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y text-sm">
                  {cluster.info?.applicationsCount !== undefined && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Applications</span>
                      <span>{cluster.info.applicationsCount}</span>
                    </div>
                  )}
                  {cluster.cacheInfo && (
                    <>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Resources Count</span>
                        <span>{cluster.cacheInfo.resourcesCount ?? "—"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">APIs Count</span>
                        <span>{cluster.cacheInfo.apisCount ?? "—"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {(labels.length > 0 || annotations.length > 0) && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {labels.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {labels.map(([k, v]) => (
                          <Badge key={k} variant="outline" className="font-mono text-[10px]">{k}={v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {annotations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Annotations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {annotations.map(([k, v]) => (
                          <Badge key={k} variant="secondary" className="font-mono text-[10px]">
                            {k}: {v.length > 40 ? v.slice(0, 40) + "..." : v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {cluster.namespaces && cluster.namespaces.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Namespaces ({cluster.namespaces.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.namespaces.map((ns) => (
                      <Badge key={ns} variant="outline" className="text-xs">{ns}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Cluster"
        description={`This will remove cluster "${cluster.name || decodedServer}" from ArgoCD. Applications targeting this cluster will be affected.`}
        confirmLabel="Delete Cluster"
        onConfirm={() => deleteCluster.mutate(decodedServer, { onSuccess: () => router.push("/argocd-settings/clusters") })}
        loading={deleteCluster.isPending}
      />
    </>
  );
}
