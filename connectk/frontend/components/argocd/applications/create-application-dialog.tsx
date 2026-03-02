"use client";

import { useState } from "react";
import { useCreateApplication } from "@/hooks/argocd/use-applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { YamlEditor } from "@/components/argocd/shared/yaml-editor";

const DEFAULT_YAML = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo.git
    targetRevision: HEAD
    path: manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: my-namespace
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
`;

interface CreateApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
}: CreateApplicationDialogProps) {
  const create = useCreateApplication();
  const [tab, setTab] = useState<"form" | "yaml">("form");
  const [yaml, setYaml] = useState(DEFAULT_YAML);

  // Form state
  const [name, setName] = useState("");
  const [project, setProject] = useState("default");
  const [repoURL, setRepoURL] = useState("");
  const [path, setPath] = useState("");
  const [revision, setRevision] = useState("HEAD");
  const [cluster, setCluster] = useState("https://kubernetes.default.svc");
  const [namespace, setNamespace] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [prune, setPrune] = useState(false);
  const [selfHeal, setSelfHeal] = useState(false);

  function buildAppFromForm() {
    return {
      apiVersion: "argoproj.io/v1alpha1",
      kind: "Application",
      metadata: { name, namespace: "argocd" },
      spec: {
        project,
        source: { repoURL, path, targetRevision: revision },
        destination: { server: cluster, namespace },
        syncPolicy: autoSync
          ? { automated: { prune, selfHeal } }
          : undefined,
      },
    };
  }

  async function handleCreate() {
    if (tab === "form") {
      create.mutate(buildAppFromForm(), {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      });
    } else {
      try {
        const parsed = JSON.parse(
          // A very simple YAML → JSON shim — for production use a real YAML parser
          JSON.stringify({ _yaml: yaml })
        );
        // In practice, send as raw YAML body; the proxy handles it.
        // For now, show error.
        alert("YAML mode requires a YAML parser. Use form mode or install js-yaml.");
      } catch {
        // ignore
      }
    }
  }

  function resetForm() {
    setName(""); setProject("default"); setRepoURL("");
    setPath(""); setRevision("HEAD"); setCluster("https://kubernetes.default.svc");
    setNamespace(""); setAutoSync(false); setPrune(false); setSelfHeal(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Application
          </DialogTitle>
          <DialogDescription>
            Deploy a new application from a Git repository.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="app-name">Application Name *</Label>
                <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-app" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project">Project *</Label>
                <Input id="project" value={project} onChange={(e) => setProject(e.target.value)} placeholder="default" />
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold">Source</p>

            <div className="space-y-1.5">
              <Label htmlFor="repo-url">Repository URL *</Label>
              <Input id="repo-url" value={repoURL} onChange={(e) => setRepoURL(e.target.value)} placeholder="https://github.com/org/repo.git" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="revision">Revision</Label>
                <Input id="revision" value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="HEAD" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="path">Path</Label>
                <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="manifests/" />
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold">Destination</p>

            <div className="space-y-1.5">
              <Label htmlFor="cluster">Cluster URL *</Label>
              <Input id="cluster" value={cluster} onChange={(e) => setCluster(e.target.value)} placeholder="https://kubernetes.default.svc" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="namespace">Namespace *</Label>
              <Input id="namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} placeholder="default" />
            </div>

            <Separator />
            <p className="text-sm font-semibold">Sync Policy</p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="auto-sync" checked={autoSync} onCheckedChange={(c) => setAutoSync(!!c)} />
                <label htmlFor="auto-sync" className="text-sm cursor-pointer">Enable automated sync</label>
              </div>
              {autoSync && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="prune" checked={prune} onCheckedChange={(c) => setPrune(!!c)} />
                    <label htmlFor="prune" className="text-sm cursor-pointer">Prune resources</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="self-heal" checked={selfHeal} onCheckedChange={(c) => setSelfHeal(!!c)} />
                    <label htmlFor="self-heal" className="text-sm cursor-pointer">Self-heal</label>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="flex-1">
            <YamlEditor
              value={yaml}
              onChange={(v) => setYaml(v ?? "")}
              height="350px"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending || (tab === "form" && (!name || !repoURL || !namespace))}>
            {create.isPending ? "Creating…" : "Create Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
