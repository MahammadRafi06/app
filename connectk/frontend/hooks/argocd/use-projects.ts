"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectEvents,
} from "@/lib/argocd-api";
import { type Project } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (name: string) => [...projectKeys.all, "detail", name] as const,
  events: (name: string) => [...projectKeys.all, "events", name] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: listProjects,
    refetchInterval: 30_000,
  });
}

export function useProject(name: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(name),
    queryFn: () => getProject(name),
    enabled: !!name && enabled,
  });
}

export function useProjectEvents(name: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.events(name),
    queryFn: () => getProjectEvents(name),
    enabled: !!name && enabled,
    refetchInterval: 15_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<Project>) => createProject(project),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, project }: { name: string; project: Project }) =>
      updateProject(name, project),
    onSuccess: (_, { name }) => {
      toast.success("Project updated");
      qc.invalidateQueries({ queryKey: projectKeys.detail(name) });
      qc.invalidateQueries({ queryKey: projectKeys.list() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteProject(name),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
