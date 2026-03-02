"use client";

import { type ResourceNode, type ResourceStatus } from "@/lib/argocd-schemas";
import { formatRelativeDate } from "@/lib/argocd-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "./status-badges";
import { Terminal, FileText } from "lucide-react";

interface PodsViewProps {
  resources: ResourceStatus[];
  treeNodes?: ResourceNode[];
  onViewLogs?: (pod: { name: string; namespace: string; containers: string[] }) => void;
  onOpenTerminal?: (pod: { name: string; namespace: string; container: string }) => void;
}

export function PodsView({ resources, treeNodes, onViewLogs, onOpenTerminal }: PodsViewProps) {
  const pods = resources.filter((r) => r.kind === "Pod");

  if (pods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        <p>No pods found for this application.</p>
      </div>
    );
  }

  // Group pods by parent (ReplicaSet, StatefulSet, etc.)
  const groups = new Map<string, ResourceStatus[]>();
  for (const pod of pods) {
    const treeNode = treeNodes?.find((n) => n.kind === "Pod" && n.name === pod.name);
    const parentKey = treeNode?.parentRefs?.[0]
      ? `${treeNode.parentRefs[0].kind}/${treeNode.parentRefs[0].name}`
      : "Standalone";
    if (!groups.has(parentKey)) groups.set(parentKey, []);
    groups.get(parentKey)!.push(pod);
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{pods.length} pod(s)</div>
      {Array.from(groups.entries()).map(([parent, groupPods]) => (
        <Card key={parent}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{parent}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {groupPods.map((pod) => {
                const treeNode = treeNodes?.find((n) => n.kind === "Pod" && n.name === pod.name);
                const containers = (treeNode?.info ?? [])
                  .filter((i) => i.name.startsWith("container:"))
                  .map((i) => i.name.replace("container:", ""));
                const restarts = treeNode?.info?.find((i) => i.name === "Restart Count")?.value;
                const createdAt = treeNode?.createdAt;

                return (
                  <div key={pod.name} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <HealthBadge status={pod.health?.status} />
                      <span className="text-sm font-mono truncate">{pod.name}</span>
                      {pod.namespace && (
                        <Badge variant="outline" className="text-[10px] shrink-0">{pod.namespace}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {restarts && (
                        <span className="text-xs text-muted-foreground">
                          {restarts} restart{restarts !== "0" && restarts !== "1" ? "s" : ""}
                        </span>
                      )}
                      {createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(createdAt)}
                        </span>
                      )}
                      {onViewLogs && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onViewLogs({ name: pod.name, namespace: pod.namespace ?? "", containers })}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onOpenTerminal && containers.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onOpenTerminal({ name: pod.name, namespace: pod.namespace ?? "", container: containers[0] })}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
