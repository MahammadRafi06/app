"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listRepoCreds,
  createRepoCreds,
  updateRepoCreds,
  deleteRepoCreds,
} from "@/lib/argocd-api";
import type { RepoCreds } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const repoCredsKeys = {
  all: ["repocreds"] as const,
  list: () => [...repoCredsKeys.all, "list"] as const,
};

export function useRepoCreds() {
  return useQuery({
    queryKey: repoCredsKeys.list(),
    queryFn: listRepoCreds,
    refetchInterval: 30_000,
  });
}

export function useCreateRepoCreds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: Partial<RepoCreds>) => createRepoCreds(creds),
    onSuccess: () => {
      toast.success("Repository credentials created");
      qc.invalidateQueries({ queryKey: repoCredsKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRepoCreds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ url, creds }: { url: string; creds: Partial<RepoCreds> }) =>
      updateRepoCreds(url, creds),
    onSuccess: () => {
      toast.success("Repository credentials updated");
      qc.invalidateQueries({ queryKey: repoCredsKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteRepoCreds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => deleteRepoCreds(url),
    onSuccess: () => {
      toast.success("Repository credentials deleted");
      qc.invalidateQueries({ queryKey: repoCredsKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
