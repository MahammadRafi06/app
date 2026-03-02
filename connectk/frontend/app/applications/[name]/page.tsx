"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useApplication,
  useApplicationTree,
  useRefreshApplication,
  useTerminateOperation,
} from "@/hooks/argocd/use-applications";
import { type ResourceNode, type ResourceStatus } from "@/lib/argocd-schemas";
import { Header } from "@/components/argocd/layout/header";
import { HealthBadge, SyncBadge, PhaseBadge } from "@/components/argocd/applications/status-badges";
import { ApplicationSummary } from "@/components/argocd/applications/application-summary";
import { ApplicationDiff } from "@/components/argocd/applications/application-diff";
import { ApplicationParameters } from "@/components/argocd/applications/application-parameters";
import { ApplicationEvents } from "@/components/argocd/applications/application-events";
import { ApplicationEditPanel } from "@/components/argocd/applications/application-edit-panel";
import { BadgesDialog } from "@/components/argocd/applications/badges-dialog";
import { PodsView } from "@/components/argocd/applications/pods-view";
import { NetworkView } from "@/components/argocd/applications/network-view";
import { ResourceTree } from "@/components/argocd/applications/resource-tree";
import { ResourceList } from "@/components/argocd/applications/resource-list";
import { ResourceDetailsPanel } from "@/components/argocd/applications/resource-details-panel";
import { PodLogsViewer } from "@/components/argocd/applications/pod-logs-viewer";
import { SyncDialog } from "@/components/argocd/applications/sync-dialog";
import { DeleteDialog } from "@/components/argocd/applications/delete-dialog";
import { RollbackDialog } from "@/components/argocd/applications/rollback-dialog";
import { DetailSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  MoreVertical,
  GitMerge,
  RefreshCw,
  Trash2,
  History,
  StopCircle,
  Pencil,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function ApplicationDetailPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const decodedName = decodeURIComponent(name);

  const { data: app, isLoading, error } = useApplication(decodedName);
  const { data: tree } = useApplicationTree(decodedName);
  const refresh = useRefreshApplication();
  const terminate = useTerminateOperation();

  const [syncOpen, setSyncOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ResourceNode | null>(null);
  const [nodeDetailsOpen, setNodeDetailsOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<{ name: string; containers: string[]; namespace: string } | null>(null);

  if (isLoading) {
    return (
      <>
        <Header title="Loading..." />
        <DetailSkeleton />
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Header title="Application" />
        <div className="p-6">
          <p className="text-destructive">{(error as Error)?.message ?? "Application not found."}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/applications")}>
            Back to Applications
          </Button>
        </div>
      </>
    );
  }

  const isOperating = app.status?.operationState?.phase === "Running";
  const resources = app.status?.resources ?? [];
  const pods = resources.filter((r) => r.kind === "Pod");
  const treeNodes = tree?.nodes ?? [];

  function handleNodeClick(node: ResourceNode) {
    setSelectedNode(node);
    setNodeDetailsOpen(true);
    if (node.kind === "Pod") {
      const containers = (node.info ?? [])
        .filter((i) => i.name.startsWith("container:"))
        .map((i) => i.name.replace("container:", ""));
      setSelectedPod({ name: node.name, containers, namespace: node.namespace ?? "" });
    }
  }

  function handleResourceSelect(res: ResourceStatus) {
    setSelectedNode({
      kind: res.kind,
      name: res.name,
      namespace: res.namespace,
      group: res.group,
      version: res.version,
      health: res.health,
    });
    setNodeDetailsOpen(true);
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <HealthBadge status={app.status?.health?.status} />
      <SyncBadge status={app.status?.sync?.status} />
      {isOperating && <PhaseBadge phase={app.status?.operationState?.phase} />}

      <Button
        size="sm"
        onClick={() => setSyncOpen(true)}
        className="gap-1.5"
      >
        <GitMerge className="h-3.5 w-3.5" />
        Sync
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => refresh.mutate({ name: decodedName })}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => refresh.mutate({ name: decodedName, hard: true })}
          >
            <RefreshCw className="h-4 w-4" />
            Hard Refresh
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setRollbackOpen(true)}>
            <History className="h-4 w-4" />
            Rollback
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setBadgesOpen(true)}>
            <Award className="h-4 w-4" />
            Status Badge
          </DropdownMenuItem>
          {isOperating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-amber-600"
                onClick={() => terminate.mutate(decodedName)}
              >
                <StopCircle className="h-4 w-4" />
                Terminate Sync
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <Header title={decodedName} actions={headerActions} />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link href="/applications" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              Applications
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedName}</span>
          </nav>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
              <TabsTrigger value="tree">Resource Tree</TabsTrigger>
              <TabsTrigger value="resources">
                Resources {resources.length > 0 && `(${resources.length})`}
              </TabsTrigger>
              <TabsTrigger value="pods">
                Pods {pods.length > 0 && `(${pods.length})`}
              </TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <ApplicationSummary app={app} />
            </TabsContent>

            <TabsContent value="diff">
              <ApplicationDiff appName={decodedName} />
            </TabsContent>

            <TabsContent value="tree">
              {tree ? (
                <ResourceTree tree={tree} onNodeClick={handleNodeClick} />
              ) : (
                <p className="text-muted-foreground text-sm">Loading resource tree...</p>
              )}
            </TabsContent>

            <TabsContent value="resources">
              <ResourceList resources={resources} onSelect={handleResourceSelect} />
            </TabsContent>

            <TabsContent value="pods">
              <PodsView
                resources={resources}
                treeNodes={treeNodes}
                onViewLogs={(pod) => setSelectedPod(pod)}
              />
            </TabsContent>

            <TabsContent value="network">
              <NetworkView resources={resources} />
            </TabsContent>

            <TabsContent value="events">
              <ApplicationEvents appName={decodedName} />
            </TabsContent>

            <TabsContent value="logs" className="space-y-3">
              {pods.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{pods.length} pod(s)</span>
                  </div>

                  {selectedPod ? (
                    <div className="h-[500px]">
                      <PodLogsViewer
                        appName={decodedName}
                        podName={selectedPod.name}
                        containers={selectedPod.containers}
                        namespace={selectedPod.namespace}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click on a pod in the Pods tab or Resource Tree to view logs.
                    </p>
                  )}

                  {pods.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {pods.map((pod) => (
                        <Button
                          key={pod.name}
                          variant={selectedPod?.name === pod.name ? "secondary" : "outline"}
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() =>
                            setSelectedPod({
                              name: pod.name,
                              containers: [],
                              namespace: pod.namespace ?? "",
                            })
                          }
                        >
                          {pod.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No pods found for this application.</p>
              )}
            </TabsContent>

            <TabsContent value="parameters">
              <ApplicationParameters app={app} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <SyncDialog app={app} open={syncOpen} onOpenChange={setSyncOpen} />
      <DeleteDialog
        app={app}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/applications")}
      />
      <RollbackDialog app={app} open={rollbackOpen} onOpenChange={setRollbackOpen} />
      <ApplicationEditPanel app={app} open={editOpen} onOpenChange={setEditOpen} />
      <BadgesDialog appName={decodedName} open={badgesOpen} onOpenChange={setBadgesOpen} />
      <ResourceDetailsPanel
        appName={decodedName}
        node={selectedNode}
        open={nodeDetailsOpen}
        onOpenChange={setNodeDetailsOpen}
      />
    </>
  );
}
