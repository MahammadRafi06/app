"use client";

import { useState, useMemo, useCallback } from "react";
import { type Application } from "@/lib/argocd-schemas";
import { useSyncApplication } from "@/hooks/argocd/use-applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HealthBadge, SyncBadge } from "./status-badges";
import { GitMerge, AlertTriangle } from "lucide-react";

interface SyncDialogProps {
  app: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncDialog({ app, open, onOpenChange }: SyncDialogProps) {
  const sync = useSyncApplication();

  const [prune, setPrune] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [force, setForce] = useState(false);
  const [applyOnly, setApplyOnly] = useState(false);
  const [serverSideApply, setServerSideApply] = useState(false);
  const [replace, setReplace] = useState(false);
  const [skipSchemaValidation, setSkipSchemaValidation] = useState(false);
  const [autoCreateNamespace, setAutoCreateNamespace] = useState(false);
  const [pruneLast, setPruneLast] = useState(false);
  const [applyOutOfSyncOnly, setApplyOutOfSyncOnly] = useState(false);
  const [respectIgnoreDifferences, setRespectIgnoreDifferences] = useState(false);
  const [prunePropagationPolicy, setPrunePropagationPolicy] = useState("foreground");
  const [revision, setRevision] = useState("");

  const [retryEnabled, setRetryEnabled] = useState(false);
  const [retryLimit, setRetryLimit] = useState(5);
  const [backoffDuration, setBackoffDuration] = useState("5s");
  const [backoffFactor, setBackoffFactor] = useState(2);
  const [backoffMaxDuration, setBackoffMaxDuration] = useState("3m0s");

  const resources = app?.status?.resources ?? [];
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  const resourceKey = useCallback(
    (r: { group?: string; kind: string; name: string; namespace?: string }) =>
      `${r.group ?? ""}/${r.kind}/${r.namespace ?? ""}/${r.name}`,
    []
  );

  const allKeys = useMemo(() => new Set(resources.map((r) => resourceKey(r))), [resources, resourceKey]);
  const outOfSyncKeys = useMemo(
    () => new Set(resources.filter((r) => r.status === "OutOfSync").map((r) => resourceKey(r))),
    [resources, resourceKey]
  );

  const toggleResource = (key: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function handleSync() {
    if (!app) return;

    const syncOptions: string[] = [];
    if (applyOnly) syncOptions.push("ApplyOnly=true");
    if (serverSideApply) syncOptions.push("ServerSideApply=true");
    if (replace) syncOptions.push("Replace=true");
    if (skipSchemaValidation) syncOptions.push("Validate=false");
    if (autoCreateNamespace) syncOptions.push("CreateNamespace=true");
    if (pruneLast) syncOptions.push("PruneLast=true");
    if (applyOutOfSyncOnly) syncOptions.push("ApplyOutOfSyncOnly=true");
    if (respectIgnoreDifferences) syncOptions.push("RespectIgnoreDifferences=true");
    if (prunePropagationPolicy) syncOptions.push(`PrunePropagationPolicy=${prunePropagationPolicy}`);

    sync.mutate(
      {
        name: app.metadata.name,
        opts: {
          prune: prune || undefined,
          dryRun: dryRun || undefined,
          force: force || undefined,
          revision: revision || undefined,
          ...(syncOptions.length > 0 ? { syncOptions } : {}),
          ...(retryEnabled
            ? {
                retryStrategy: {
                  limit: retryLimit,
                  backoff: {
                    duration: backoffDuration,
                    factor: backoffFactor,
                    maxDuration: backoffMaxDuration,
                  },
                },
              }
            : {}),
          ...(selectedResources.size > 0
            ? {
                resources: resources
                  .filter((r) => selectedResources.has(resourceKey(r)))
                  .map((r) => ({
                    group: r.group ?? "",
                    kind: r.kind,
                    name: r.name,
                    namespace: r.namespace ?? "",
                  })),
              }
            : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const showDangerWarning = force || replace;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Sync Application
          </DialogTitle>
          <DialogDescription>
            Synchronise <strong>{app?.metadata.name}</strong> with its Git source.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-2">
            {showDangerWarning && (
              <div className="flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Dangerous options enabled</p>
                  <p className="mt-1 opacity-80">
                    {force && replace
                      ? "Force and Replace are both enabled. Resources will be deleted and recreated."
                      : force
                        ? "Force is enabled. Resources will be deleted and recreated, which can cause downtime."
                        : "Replace is enabled. Resource replacement instead of patch can lead to data loss."}
                  </p>
                </div>
              </div>
            )}

            {/* Revision */}
            <div className="space-y-1.5">
              <Label htmlFor="revision">Revision (optional)</Label>
              <Input
                id="revision"
                placeholder={app?.spec.source?.targetRevision ?? app?.spec.sources?.[0]?.targetRevision ?? "HEAD"}
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank to use the target revision from the app spec.</p>
            </div>

            <Separator />

            {/* Sync Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Sync Options</h4>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { id: "prune", label: "Prune", desc: "Delete resources no longer in Git", val: prune, set: setPrune },
                  { id: "dryRun", label: "Dry Run", desc: "Preview changes without applying", val: dryRun, set: setDryRun },
                  { id: "force", label: "Force", desc: "Delete and recreate resources (dangerous)", val: force, set: setForce },
                  { id: "applyOnly", label: "Apply Only", desc: "Skip pre/post sync hooks", val: applyOnly, set: setApplyOnly },
                  { id: "ssa", label: "Server-Side Apply", desc: "Use server-side apply strategy", val: serverSideApply, set: setServerSideApply },
                  { id: "replace", label: "Replace", desc: "Use replace instead of patch (dangerous)", val: replace, set: setReplace },
                  { id: "skipSchema", label: "Skip Schema Validation", desc: "Skip Kubernetes resource schema validation", val: skipSchemaValidation, set: setSkipSchemaValidation },
                  { id: "autoNs", label: "Auto-Create Namespace", desc: "Create namespace if it doesn't exist", val: autoCreateNamespace, set: setAutoCreateNamespace },
                  { id: "pruneLast", label: "Prune Last", desc: "Prune after all other sync operations", val: pruneLast, set: setPruneLast },
                  { id: "oosOnly", label: "Apply Out Of Sync Only", desc: "Only apply resources that are out of sync", val: applyOutOfSyncOnly, set: setApplyOutOfSyncOnly },
                  { id: "ignoreDiff", label: "Respect Ignore Differences", desc: "Honor ignore-differences configuration", val: respectIgnoreDifferences, set: setRespectIgnoreDifferences },
                ] as const).map(({ id, label, desc, val, set }) => (
                  <div key={id} className="flex items-start space-x-3">
                    <Checkbox id={id} checked={val} onCheckedChange={(checked) => set(!!checked)} className="mt-0.5" />
                    <label htmlFor={id} className="cursor-pointer space-y-0.5">
                      <p className="text-sm font-medium leading-none">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Prune Propagation Policy */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Prune Propagation Policy</h4>
              <div className="max-w-xs">
                <Select value={prunePropagationPolicy} onValueChange={setPrunePropagationPolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foreground">Foreground</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                    <SelectItem value="orphan">Orphan</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">How dependent resources are handled during pruning.</p>
              </div>
            </div>

            <Separator />

            {/* Retry Strategy */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Retry Strategy</h4>
              <div className="flex items-start space-x-3">
                <Checkbox id="retryEnabled" checked={retryEnabled} onCheckedChange={(c) => setRetryEnabled(!!c)} className="mt-0.5" />
                <label htmlFor="retryEnabled" className="cursor-pointer space-y-0.5">
                  <p className="text-sm font-medium leading-none">Enable Retry</p>
                  <p className="text-xs text-muted-foreground">Automatically retry failed sync operations</p>
                </label>
              </div>
              {retryEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="retryLimit">Limit</Label>
                    <Input id="retryLimit" type="number" min={1} value={retryLimit} onChange={(e) => setRetryLimit(parseInt(e.target.value, 10) || 1)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="backoffDur">Backoff Duration</Label>
                    <Input id="backoffDur" value={backoffDuration} onChange={(e) => setBackoffDuration(e.target.value)} placeholder="5s" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="backoffFac">Backoff Factor</Label>
                    <Input id="backoffFac" type="number" min={1} value={backoffFactor} onChange={(e) => setBackoffFactor(parseInt(e.target.value, 10) || 1)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="backoffMax">Max Duration</Label>
                    <Input id="backoffMax" value={backoffMaxDuration} onChange={(e) => setBackoffMaxDuration(e.target.value)} placeholder="3m0s" />
                  </div>
                </div>
              )}
            </div>

            {/* Selective Resource Sync */}
            {resources.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Selective Resource Sync</h4>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedResources(new Set(allKeys))}>Select All</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedResources(new Set(outOfSyncKeys))}>Out Of Sync</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedResources(new Set())}>Clear</Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Select specific resources to sync. If none are selected, all resources will be synced.</p>
                  <div className="rounded-md border max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead>Kind</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Namespace</TableHead>
                          <TableHead>Sync</TableHead>
                          <TableHead>Health</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.map((r) => {
                          const key = resourceKey(r);
                          return (
                            <TableRow key={key}>
                              <TableCell><Checkbox checked={selectedResources.has(key)} onCheckedChange={() => toggleResource(key)} /></TableCell>
                              <TableCell className="font-medium text-xs">{r.kind}</TableCell>
                              <TableCell className="text-xs">{r.name}</TableCell>
                              <TableCell className="text-xs">{r.namespace || "-"}</TableCell>
                              <TableCell>{r.status ? <SyncBadge status={r.status} /> : "-"}</TableCell>
                              <TableCell>{r.health?.status ? <HealthBadge status={r.health.status} /> : "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSync} disabled={sync.isPending}>
            {sync.isPending ? "Syncing..." : "Sync Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
