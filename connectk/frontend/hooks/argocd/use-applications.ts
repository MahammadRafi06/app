"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  syncApplication,
  rollbackApplication,
  terminateOperation,
  getApplicationTree,
  getApplicationEvents,
  getRevisionMetadata,
  getManagedResources,
  getApplicationSyncWindows,
  type ListApplicationsParams,
  type ManagedResourcesParams,
  type ResourceParams,
  deleteResource,
  getResource,
} from "@/lib/argocd-api";
import { type Application, type SyncOptions } from "@/lib/argocd-schemas";
import { toast } from "sonner";

export const appKeys = {
  all: ["applications"] as const,
  list: (params?: ListApplicationsParams) => [...appKeys.all, "list", params] as const,
  detail: (name: string) => [...appKeys.all, "detail", name] as const,
  tree: (name: string) => [...appKeys.all, "tree", name] as const,
  events: (name: string) => [...appKeys.all, "events", name] as const,
  resources: (name: string, params?: ManagedResourcesParams) =>
    [...appKeys.all, "resources", name, params] as const,
  revision: (name: string, revision: string) =>
    [...appKeys.all, "revision", name, revision] as const,
  syncWindows: (name: string) => [...appKeys.all, "syncWindows", name] as const,
};

export function useApplications(params?: ListApplicationsParams) {
  return useQuery({
    queryKey: appKeys.list(params),
    queryFn: () => listApplications(params),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });
}

export function useApplication(name: string, enabled = true) {
  return useQuery({
    queryKey: appKeys.detail(name),
    queryFn: () => getApplication(name),
    enabled: !!name && enabled,
    refetchInterval: 5_000,
  });
}

export function useApplicationTree(name: string, enabled = true) {
  return useQuery({
    queryKey: appKeys.tree(name),
    queryFn: () => getApplicationTree(name),
    enabled: !!name && enabled,
    refetchInterval: 8_000,
  });
}

export function useApplicationEvents(name: string, enabled = true) {
  return useQuery({
    queryKey: appKeys.events(name),
    queryFn: () => getApplicationEvents(name),
    enabled: !!name && enabled,
    refetchInterval: 15_000,
  });
}

export function useManagedResources(name: string, params?: ManagedResourcesParams, enabled = true) {
  return useQuery({
    queryKey: appKeys.resources(name, params),
    queryFn: () => getManagedResources(name, params),
    enabled: !!name && enabled,
    refetchInterval: 10_000,
  });
}

export function useRevisionMetadata(name: string, revision: string, enabled = true) {
  return useQuery({
    queryKey: appKeys.revision(name, revision),
    queryFn: () => getRevisionMetadata(name, revision),
    enabled: !!name && !!revision && enabled,
    staleTime: 60_000,
  });
}

export function useSyncWindows(name: string, enabled = true) {
  return useQuery({
    queryKey: appKeys.syncWindows(name),
    queryFn: () => getApplicationSyncWindows(name),
    enabled: !!name && enabled,
    refetchInterval: 30_000,
  });
}

export function useResource(
  appName: string,
  params: ResourceParams | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["resource", appName, params],
    queryFn: () => getResource(appName, params as ResourceParams),
    enabled:
      !!appName &&
      !!params &&
      !!params.resourceName &&
      !!params.kind &&
      !!params.version &&
      enabled,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (app: Partial<Application>) => createApplication(app),
    onSuccess: (data) => {
      toast.success(`Application "${data.metadata.name}" created`);
      qc.invalidateQueries({ queryKey: appKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, app }: { name: string; app: Application }) =>
      updateApplication(name, app),
    onSuccess: (data) => {
      toast.success(`Application "${data.metadata.name}" updated`);
      qc.invalidateQueries({ queryKey: appKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      cascade,
      propagationPolicy,
    }: {
      name: string;
      cascade?: boolean;
      propagationPolicy?: string;
    }) => deleteApplication(name, cascade, propagationPolicy),
    onSuccess: (_, { name }) => {
      toast.success(`Application "${name}" deleted`);
      qc.invalidateQueries({ queryKey: appKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSyncApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, opts }: { name: string; opts?: SyncOptions }) =>
      syncApplication(name, opts),
    onSuccess: (data) => {
      toast.success(`Sync initiated for "${data.metadata.name}"`);
      qc.invalidateQueries({ queryKey: appKeys.detail(data.metadata.name) });
      qc.invalidateQueries({ queryKey: appKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRollbackApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, id }: { name: string; id: number }) =>
      rollbackApplication(name, id),
    onSuccess: (data) => {
      toast.success(`Rollback initiated for "${data.metadata.name}"`);
      qc.invalidateQueries({ queryKey: appKeys.detail(data.metadata.name) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTerminateOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => terminateOperation(name),
    onSuccess: (_, name) => {
      toast.success(`Operation terminated for "${name}"`);
      qc.invalidateQueries({ queryKey: appKeys.detail(name) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appName,
      params,
    }: {
      appName: string;
      params: ResourceParams & { force?: boolean; orphan?: boolean };
    }) => deleteResource(appName, params),
    onSuccess: (_, { appName }) => {
      toast.success("Resource deleted");
      qc.invalidateQueries({ queryKey: appKeys.tree(appName) });
      qc.invalidateQueries({ queryKey: appKeys.resources(appName) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRefreshApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, hard }: { name: string; hard?: boolean }) =>
      getApplication(name, hard ? "hard" : "normal"),
    onSuccess: (data) => {
      toast.success(`"${data.metadata.name}" refreshed`);
      qc.setQueryData(appKeys.detail(data.metadata.name), data);
      qc.invalidateQueries({ queryKey: appKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
