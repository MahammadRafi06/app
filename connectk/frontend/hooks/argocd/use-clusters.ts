"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClusters, getCluster, deleteCluster, updateCluster, invalidateClusterCache } from "@/lib/argocd-api";
import { type Cluster } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const clusterKeys = {
  all: ["clusters"] as const,
  list: () => [...clusterKeys.all, "list"] as const,
  detail: (server: string) => [...clusterKeys.all, "detail", server] as const,
};

export function useClusters() {
  return useQuery({
    queryKey: clusterKeys.list(),
    queryFn: listClusters,
    refetchInterval: 30_000,
  });
}

export function useCluster(server: string, enabled = true) {
  return useQuery({
    queryKey: clusterKeys.detail(server),
    queryFn: () => getCluster(server),
    enabled: !!server && enabled,
    refetchInterval: 30_000,
  });
}

export function useInvalidateClusterCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (server: string) => invalidateClusterCache(server),
    onSuccess: () => {
      toast.success("Cluster cache invalidated");
      qc.invalidateQueries({ queryKey: clusterKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (server: string) => deleteCluster(server),
    onSuccess: () => {
      toast.success("Cluster removed");
      qc.invalidateQueries({ queryKey: clusterKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ server, cluster }: { server: string; cluster: Partial<Cluster> }) =>
      updateCluster(server, cluster),
    onSuccess: () => {
      toast.success("Cluster updated");
      qc.invalidateQueries({ queryKey: clusterKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
