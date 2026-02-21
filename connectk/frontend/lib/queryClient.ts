import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s default
      gcTime: 30 * 60 * 1000, // 30min GC
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Per-entity stale times
export const STALE_TIMES = {
  clusters: 30 * 1000,
  deployments: 30 * 1000,
  models: 5 * 60 * 1000,
  profile: 10 * 60 * 1000,
  nodes: 60 * 1000,
  gpus: 60 * 1000,
  admin: 5 * 60 * 1000,
} as const;

// Canonical query keys
export const QUERY_KEYS = {
  clusters: (filters?: object) =>
    filters ? (["clusters", "list", filters] as const) : (["clusters", "list"] as const),
  cluster: (id: string) => ["clusters", id] as const,
  clusterNodes: (id: string) => ["clusters", id, "nodes"] as const,
  clusterGpus: (id: string) => ["clusters", id, "gpus"] as const,
  clusterDeployments: (id: string) => ["clusters", id, "deployments"] as const,
  deployments: (filters?: object) => ["deployments", filters] as const,
  deployment: (id: string) => ["deployments", id] as const,
  models: (filters?: object) => ["models", filters] as const,
  model: (id: string) => ["models", id] as const,
  nodes: (filters?: object) => ["nodes", filters] as const,
  gpus: (filters?: object) => ["gpus", filters] as const,
  me: () => ["me"] as const,
  adminGroups: () => ["admin", "groups"] as const,
  adminSessions: () => ["admin", "sessions"] as const,
  adminHealth: () => ["admin", "health"] as const,
  auditLogs: (filters?: object) => ["audit", "logs", filters] as const,
};
