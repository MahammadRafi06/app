"use client";

import { useState } from "react";
import { useCreateProject } from "@/hooks/argocd/use-projects";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceRepos, setSourceRepos] = useState("*");

  function handleCreate() {
    create.mutate(
      {
        metadata: { name },
        spec: {
          description,
          sourceRepos: sourceRepos.split("\n").map((s) => s.trim()).filter(Boolean),
          destinations: [{ server: "*", namespace: "*" }],
        },
      } as any,
      {
        onSuccess: () => {
          onOpenChange(false);
          setName(""); setDescription(""); setSourceRepos("*");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Project Name *</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-project" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <Input id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source-repos">Allowed Source Repositories</Label>
            <Textarea
              id="source-repos"
              value={sourceRepos}
              onChange={(e) => setSourceRepos(e.target.value)}
              placeholder="* (one per line)"
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Use <code>*</code> to allow all repositories.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name || create.isPending}>
            {create.isPending ? "Creating…" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
