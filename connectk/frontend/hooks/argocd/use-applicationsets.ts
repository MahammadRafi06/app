"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listApplicationSets,
  getApplicationSet,
  createApplicationSet,
  deleteApplicationSet,
} from "@/lib/argocd-api";
import type { ApplicationSet } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const appSetKeys = {
  all: ["applicationsets"] as const,
  list: () => [...appSetKeys.all, "list"] as const,
  detail: (name: string) => [...appSetKeys.all, "detail", name] as const,
};

export function useApplicationSets() {
  return useQuery({
    queryKey: appSetKeys.list(),
    queryFn: listApplicationSets,
    refetchInterval: 10_000,
  });
}

export function useApplicationSet(name: string, enabled = true) {
  return useQuery({
    queryKey: appSetKeys.detail(name),
    queryFn: () => getApplicationSet(name),
    enabled: !!name && enabled,
    refetchInterval: 5_000,
  });
}

export function useCreateApplicationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appSet: Partial<ApplicationSet>) => createApplicationSet(appSet),
    onSuccess: (data) => {
      toast.success(`ApplicationSet "${data.metadata.name}" created`);
      qc.invalidateQueries({ queryKey: appSetKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteApplicationSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, cascade }: { name: string; cascade?: boolean }) =>
      deleteApplicationSet(name, cascade),
    onSuccess: (_, { name }) => {
      toast.success(`ApplicationSet "${name}" deleted`);
      qc.invalidateQueries({ queryKey: appSetKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
