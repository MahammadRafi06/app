"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRepositories,
  createRepository,
  updateRepository,
  deleteRepository,
} from "@/lib/argocd-api";
import { type Repository } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const repoKeys = {
  all: ["repositories"] as const,
  list: () => [...repoKeys.all, "list"] as const,
};

export function useRepositories() {
  return useQuery({
    queryKey: repoKeys.list(),
    queryFn: listRepositories,
    refetchInterval: 30_000,
  });
}

export function useCreateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repo: Partial<Repository>) => createRepository(repo),
    onSuccess: () => {
      toast.success("Repository added");
      qc.invalidateQueries({ queryKey: repoKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ url, repo }: { url: string; repo: Partial<Repository> }) =>
      updateRepository(url, repo),
    onSuccess: () => {
      toast.success("Repository updated");
      qc.invalidateQueries({ queryKey: repoKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => deleteRepository(url),
    onSuccess: () => {
      toast.success("Repository removed");
      qc.invalidateQueries({ queryKey: repoKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
