"use client";

import { useState, useEffect } from "react";
import { type Project } from "@/lib/argocd-schemas";
import { useUpdateProject } from "@/hooks/argocd/use-projects";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";

interface ProjectEditPanelProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectEditPanel({ project, open, onOpenChange }: ProjectEditPanelProps) {
  const update = useUpdateProject();
  const spec = project.spec;

  const [description, setDescription] = useState(spec?.description ?? "");
  const [sourceRepos, setSourceRepos] = useState<string[]>(spec?.sourceRepos ?? []);
  const [newSourceRepo, setNewSourceRepo] = useState("");
  const [destServers, setDestServers] = useState<string[]>(
    (spec?.destinations ?? []).map((d) => `${d.server ?? "*"},${d.namespace ?? "*"},${d.name ?? ""}`)
  );
  const [newDest, setNewDest] = useState("");

  useEffect(() => {
    setDescription(spec?.description ?? "");
    setSourceRepos(spec?.sourceRepos ?? []);
    setDestServers(
      (spec?.destinations ?? []).map((d) => `${d.server ?? "*"},${d.namespace ?? "*"},${d.name ?? ""}`)
    );
  }, [spec]);

  function handleSave() {
    const destinations = destServers.map((d) => {
      const [server, namespace, name] = d.split(",");
      return { server: server || "*", namespace: namespace || "*", name: name || undefined };
    });

    const updated: Project = {
      ...project,
      spec: {
        ...spec,
        description: description || undefined,
        sourceRepos,
        destinations,
      },
    };

    update.mutate(
      { name: project.metadata.name, project: updated },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[550px] sm:max-w-[550px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Edit {project.metadata.name}</SheetTitle>
          <SheetDescription>Modify project settings</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="general" className="px-6 py-4">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <p className="text-xs text-muted-foreground">Allowed source repositories. Use * to allow all.</p>
              <div className="flex flex-wrap gap-1.5">
                {sourceRepos.map((repo, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                    {repo}
                    <button
                      onClick={() => setSourceRepos(sourceRepos.filter((_, j) => j !== i))}
                      className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSourceRepo}
                  onChange={(e) => setNewSourceRepo(e.target.value)}
                  placeholder="https://github.com/..."
                  className="text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSourceRepo) {
                      setSourceRepos([...sourceRepos, newSourceRepo]);
                      setNewSourceRepo("");
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={!newSourceRepo}
                  onClick={() => { setSourceRepos([...sourceRepos, newSourceRepo]); setNewSourceRepo(""); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="destinations" className="space-y-4">
              <p className="text-xs text-muted-foreground">Allowed destinations (server,namespace,name). Use * for wildcards.</p>
              <div className="flex flex-wrap gap-1.5">
                {destServers.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1 font-mono">
                    {d}
                    <button
                      onClick={() => setDestServers(destServers.filter((_, j) => j !== i))}
                      className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  placeholder="*,*,*"
                  className="text-xs font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newDest) {
                      setDestServers([...destServers, newDest]);
                      setNewDest("");
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={!newDest}
                  onClick={() => { setDestServers([...destServers, newDest]); setNewDest(""); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
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
