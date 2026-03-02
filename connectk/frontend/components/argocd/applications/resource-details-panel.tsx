"use client";

import { useState } from "react";
import { type ResourceNode } from "@/lib/argocd-schemas";
import { useResource, useManagedResources, useDeleteResource } from "@/hooks/argocd/use-applications";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { YamlEditor } from "@/components/argocd/shared/yaml-editor";
import { DiffViewer } from "@/components/argocd/shared/diff-viewer";
import { HealthBadge } from "./status-badges";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, RefreshCw } from "lucide-react";

interface ResourceDetailsPanelProps {
  appName: string;
  node: ResourceNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResourceDetailsPanel({
  appName,
  node,
  open,
  onOpenChange,
}: ResourceDetailsPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteRes = useDeleteResource();

  const params = node
    ? {
        namespace: node.namespace ?? "",
        resourceName: node.name,
        group: node.group,
        version: node.version ?? "v1",
        kind: node.kind,
      }
    : null;

  const { data: resourceData, isLoading, refetch } = useResource(
    appName,
    params,
    !!params && open
  );

  const managedParams = node
    ? { namespace: node.namespace ?? "", name: node.name, group: node.group, kind: node.kind, version: node.version ?? "v1" }
    : undefined;
  const { data: managedData } = useManagedResources(appName, managedParams, !!managedParams && open);

  type ManagedItem = { targetState?: string; normalizedLiveState?: string; name?: string; kind?: string };
  const managedItem = ((managedData?.items ?? []) as ManagedItem[]).find(
    (i) => i.name === node?.name && i.kind === node?.kind
  );

  const liveManifest = resourceData?.manifest ?? "";
  const targetState = managedItem?.targetState ?? "";
  const normalizedLiveState = managedItem?.normalizedLiveState ?? "";
  const hasDiff = !!normalizedLiveState && !!targetState;

  function handleDelete() {
    if (!node || !params) return;
    deleteRes.mutate(
      { appName, params },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-base">{node?.name ?? "Resource"}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs">{node?.kind}</span>
                  {node?.namespace && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-xs">{node.namespace}</span>
                    </>
                  )}
                  {node?.health?.status && (
                    <HealthBadge status={node.health.status} />
                  )}
                </SheetDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="live" className="h-full flex flex-col">
              <TabsList className="px-6 pt-2 justify-start rounded-none border-b bg-transparent h-auto">
                <TabsTrigger value="live">Live Manifest</TabsTrigger>
                {hasDiff && <TabsTrigger value="diff">Diff</TabsTrigger>}
                {targetState && <TabsTrigger value="desired">Desired</TabsTrigger>}
                {node?.info && node.info.length > 0 && (
                  <TabsTrigger value="info">Info</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="live" className="flex-1 p-4 overflow-hidden">
                {isLoading ? (
                  <Skeleton className="h-full" />
                ) : (
                  <YamlEditor
                    value={
                      liveManifest
                        ? JSON.stringify(JSON.parse(liveManifest), null, 2)
                        : "# No manifest available"
                    }
                    readOnly
                    height="100%"
                    language="json"
                  />
                )}
              </TabsContent>
              {hasDiff && (
                <TabsContent value="diff" className="flex-1 p-4 overflow-hidden">
                  <DiffViewer
                    original={tryFormatJson(normalizedLiveState)}
                    modified={tryFormatJson(targetState)}
                    language="json"
                    height="100%"
                  />
                </TabsContent>
              )}
              {targetState && (
                <TabsContent value="desired" className="flex-1 p-4 overflow-hidden">
                  <YamlEditor
                    value={tryFormatJson(targetState)}
                    readOnly
                    height="100%"
                    language="json"
                  />
                </TabsContent>
              )}
              {node?.info && node.info.length > 0 && (
                <TabsContent value="info" className="p-4">
                  <div className="divide-y rounded-lg border">
                    {node.info.map((item) => (
                      <div key={item.name} className="flex gap-4 px-3 py-2 text-sm">
                        <span className="w-40 shrink-0 text-muted-foreground">{item.name}</span>
                        <span className="font-mono text-xs break-all">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${node?.kind}`}
        description={`This will delete ${node?.kind} "${node?.name}" from the cluster. This action cannot be undone.`}
        confirmLabel="Delete Resource"
        onConfirm={handleDelete}
        loading={deleteRes.isPending}
      />
    </>
  );
}

function tryFormatJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}
