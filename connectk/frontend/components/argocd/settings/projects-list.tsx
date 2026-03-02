"use client";

import { useState } from "react";
import Link from "next/link";
import { useProjects, useDeleteProject } from "@/hooks/argocd/use-projects";
import { type Project } from "@/lib/argocd-schemas";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { TableSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Trash2, ExternalLink } from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectsList() {
  const { data, isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const projects = data?.items ?? [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <p className="text-destructive text-sm">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No Projects"
          description="Projects group applications and define access policies."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source Repos</TableHead>
                <TableHead>Destinations</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.metadata.name} className="group">
                  <TableCell className="font-medium text-sm">
                    {project.metadata.name}
                    {project.metadata.name === "default" && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {project.spec.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.spec.sourceRepos?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.spec.destinations?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.spec.roles?.length ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/argocd-settings/projects/${encodeURIComponent(project.metadata.name)}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {project.metadata.name !== "default" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Project"
        description={`Delete project "${deleteTarget?.metadata.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget)
            deleteProject.mutate(deleteTarget.metadata.name, { onSuccess: () => setDeleteTarget(null) });
        }}
        loading={deleteProject.isPending}
      />
    </div>
  );
}
