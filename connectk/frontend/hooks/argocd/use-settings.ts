"use client";

import { useQuery } from "@tanstack/react-query";
import { getSettings, canI } from "@/lib/argocd-api";

export const settingsKeys = {
  all: ["settings"] as const,
  server: () => [...settingsKeys.all, "server"] as const,
  rbac: (resource: string, action: string, subresource: string) =>
    [...settingsKeys.all, "rbac", resource, action, subresource] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.server(),
    queryFn: getSettings,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useCanI(
  resource: string,
  action: string,
  subresource: string,
  enabled = true
) {
  return useQuery({
    queryKey: settingsKeys.rbac(resource, action, subresource),
    queryFn: () => canI(resource, action, subresource),
    enabled,
    staleTime: 30_000,
  });
}
