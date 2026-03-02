"use client";

import { useManagedResources } from "@/hooks/argocd/use-applications";
import { DiffViewer } from "@/components/argocd/shared/diff-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SyncBadge } from "./status-badges";

interface ApplicationDiffProps {
  appName: string;
}

export function ApplicationDiff({ appName }: ApplicationDiffProps) {
  const { data, isLoading } = useManagedResources(appName);

  if (isLoading) return <Skeleton className="h-64" />;

  type ManagedItem = { group?: string; kind: string; name: string; namespace?: string; normalizedLiveState?: string; targetState?: string; status?: string };
  const items = ((data?.items ?? []) as ManagedItem[]).filter(
    (r) => r.status === "OutOfSync"
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        <p>All resources are in sync.</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {items.map((item) => {
        const key = `${item.group ?? ""}/${item.kind}/${item.namespace ?? ""}/${item.name}`;
        const live = item.normalizedLiveState
          ? tryFormatJson(item.normalizedLiveState)
          : "# Resource not found in cluster";
        const desired = item.targetState
          ? tryFormatJson(item.targetState)
          : "# No desired state";

        return (
          <AccordionItem key={key} value={key} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">{item.kind}</Badge>
                <span className="font-medium">{item.name}</span>
                {item.namespace && (
                  <span className="text-muted-foreground text-xs">({item.namespace})</span>
                )}
                <SyncBadge status={item.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <DiffViewer original={live} modified={desired} language="json" height="400px" />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function tryFormatJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}
