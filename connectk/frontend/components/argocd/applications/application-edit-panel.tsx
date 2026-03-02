"use client";

import { useState, useEffect } from "react";
import { type Application } from "@/lib/argocd-schemas";
import { useUpdateApplication } from "@/hooks/argocd/use-applications";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeyValueEditor } from "@/components/argocd/shared/key-value-editor";
import { Save } from "lucide-react";

interface ApplicationEditPanelProps {
  app: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationEditPanel({ app, open, onOpenChange }: ApplicationEditPanelProps) {
  const update = useUpdateApplication();

  const [project, setProject] = useState(app.spec.project);
  const [repoURL, setRepoURL] = useState(app.spec.source?.repoURL ?? "");
  const [targetRevision, setTargetRevision] = useState(app.spec.source?.targetRevision ?? "");
  const [path, setPath] = useState(app.spec.source?.path ?? "");
  const [chart, setChart] = useState(app.spec.source?.chart ?? "");
  const [destServer, setDestServer] = useState(app.spec.destination.server ?? "");
  const [destName, setDestName] = useState(app.spec.destination.name ?? "");
  const [destNamespace, setDestNamespace] = useState(app.spec.destination.namespace ?? "");
  const [autoSync, setAutoSync] = useState(!!app.spec.syncPolicy?.automated);
  const [autoPrune, setAutoPrune] = useState(!!app.spec.syncPolicy?.automated?.prune);
  const [selfHeal, setSelfHeal] = useState(!!app.spec.syncPolicy?.automated?.selfHeal);
  const [labels, setLabels] = useState<Record<string, string>>(app.metadata.labels ?? {});
  const [annotations, setAnnotations] = useState<Record<string, string>>(app.metadata.annotations ?? {});

  useEffect(() => {
    setProject(app.spec.project);
    setRepoURL(app.spec.source?.repoURL ?? "");
    setTargetRevision(app.spec.source?.targetRevision ?? "");
    setPath(app.spec.source?.path ?? "");
    setChart(app.spec.source?.chart ?? "");
    setDestServer(app.spec.destination.server ?? "");
    setDestName(app.spec.destination.name ?? "");
    setDestNamespace(app.spec.destination.namespace ?? "");
    setAutoSync(!!app.spec.syncPolicy?.automated);
    setAutoPrune(!!app.spec.syncPolicy?.automated?.prune);
    setSelfHeal(!!app.spec.syncPolicy?.automated?.selfHeal);
    setLabels(app.metadata.labels ?? {});
    setAnnotations(app.metadata.annotations ?? {});
  }, [app]);

  function handleSave() {
    const updated: Application = {
      ...app,
      metadata: {
        ...app.metadata,
        labels: Object.keys(labels).length > 0 ? labels : undefined,
        annotations: Object.keys(annotations).length > 0 ? annotations : undefined,
      },
      spec: {
        ...app.spec,
        project,
        source: app.spec.source
          ? { ...app.spec.source, repoURL, targetRevision, path, chart: chart || undefined }
          : undefined,
        destination: {
          server: destServer || undefined,
          name: destName || undefined,
          namespace: destNamespace || undefined,
        },
        syncPolicy: {
          ...app.spec.syncPolicy,
          automated: autoSync
            ? { prune: autoPrune, selfHeal: selfHeal }
            : undefined,
        },
      },
    };

    update.mutate(
      { name: app.metadata.name, app: updated },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[550px] sm:max-w-[550px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Edit {app.metadata.name}</SheetTitle>
          <SheetDescription>Modify application settings and save.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="general" className="px-6 py-4">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="destination">Destination</TabsTrigger>
              <TabsTrigger value="sync">Sync Policy</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Input value={project} onChange={(e) => setProject(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="source" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Repository URL</Label>
                <Input value={repoURL} onChange={(e) => setRepoURL(e.target.value)} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Target Revision</Label>
                <Input value={targetRevision} onChange={(e) => setTargetRevision(e.target.value)} placeholder="HEAD" />
              </div>
              <div className="space-y-1.5">
                <Label>Path</Label>
                <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="." />
              </div>
              <div className="space-y-1.5">
                <Label>Chart (Helm only)</Label>
                <Input value={chart} onChange={(e) => setChart(e.target.value)} placeholder="Optional" />
              </div>
            </TabsContent>

            <TabsContent value="destination" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cluster URL</Label>
                <Input value={destServer} onChange={(e) => setDestServer(e.target.value)} placeholder="https://kubernetes.default.svc" />
              </div>
              <div className="space-y-1.5">
                <Label>Cluster Name</Label>
                <Input value={destName} onChange={(e) => setDestName(e.target.value)} placeholder="in-cluster" />
              </div>
              <div className="space-y-1.5">
                <Label>Namespace</Label>
                <Input value={destNamespace} onChange={(e) => setDestNamespace(e.target.value)} placeholder="default" />
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="autoSync" checked={autoSync} onCheckedChange={(c) => setAutoSync(!!c)} className="mt-0.5" />
                <label htmlFor="autoSync" className="cursor-pointer space-y-0.5">
                  <p className="text-sm font-medium leading-none">Automated Sync</p>
                  <p className="text-xs text-muted-foreground">Automatically sync when Git changes are detected</p>
                </label>
              </div>
              {autoSync && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Checkbox id="autoPrune" checked={autoPrune} onCheckedChange={(c) => setAutoPrune(!!c)} className="mt-0.5" />
                    <label htmlFor="autoPrune" className="cursor-pointer space-y-0.5">
                      <p className="text-sm font-medium leading-none">Auto Prune</p>
                      <p className="text-xs text-muted-foreground">Delete resources no longer in Git</p>
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="selfHeal" checked={selfHeal} onCheckedChange={(c) => setSelfHeal(!!c)} className="mt-0.5" />
                    <label htmlFor="selfHeal" className="cursor-pointer space-y-0.5">
                      <p className="text-sm font-medium leading-none">Self Heal</p>
                      <p className="text-xs text-muted-foreground">Revert manual changes to match Git</p>
                    </label>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <KeyValueEditor values={labels} onChange={setLabels} label="Labels" />
              <Separator />
              <KeyValueEditor values={annotations} onChange={setAnnotations} label="Annotations" />
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {update.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
