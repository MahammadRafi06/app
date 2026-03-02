"use client";

import { type Application } from "@/lib/argocd-schemas";
import { useRollbackApplication } from "@/hooks/argocd/use-applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/argocd-utils";
import { History, GitCommit } from "lucide-react";

interface RollbackDialogProps {
  app: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RollbackDialog({ app, open, onOpenChange }: RollbackDialogProps) {
  const rollback = useRollbackApplication();
  const history = app?.status?.history ?? [];

  function handleRollback(id: number) {
    if (!app) return;
    rollback.mutate(
      { name: app.metadata.name, id },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Deployment History
          </DialogTitle>
          <DialogDescription>
            Select a previous revision to roll back <strong>{app?.metadata.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-3">
          <div className="space-y-2 py-2">
            {history.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No deployment history available.
              </p>
            ) : (
              [...history].reverse().map((entry, idx) => {
                const source = entry.source ?? entry.sources?.[0];
                const isCurrent = idx === 0;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                      isCurrent ? "bg-muted/50 border-primary/20" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                        <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs text-muted-foreground">
                            #{entry.id}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium font-mono truncate">
                          {entry.revision.slice(0, 8)}
                        </p>
                        {source?.path && (
                          <p className="text-xs text-muted-foreground truncate">{source.path}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.deployedAt)}
                          {entry.initiatedBy?.username && (
                            <> · by {entry.initiatedBy.username}</>
                          )}
                          {entry.initiatedBy?.automated && <> · (automated)</>}
                        </p>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        disabled={rollback.isPending}
                        onClick={() => handleRollback(entry.id)}
                      >
                        {rollback.isPending ? "…" : "Rollback"}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
