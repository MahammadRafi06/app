"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useApplications, useRefreshApplication, useSyncApplication } from "@/hooks/argocd/use-applications";
import { useProjects } from "@/hooks/argocd/use-projects";
import { useFavorites } from "@/hooks/argocd/use-favorites";
import { useUrlFilters } from "@/hooks/argocd/use-url-filters";
import { type Application } from "@/lib/argocd-schemas";
import { Header } from "@/components/argocd/layout/header";
import { ApplicationCard } from "@/components/argocd/applications/application-card";
import { ApplicationTable } from "@/components/argocd/applications/application-table";
import { ApplicationsFilters } from "@/components/argocd/applications/applications-filters";
import { SyncDialog } from "@/components/argocd/applications/sync-dialog";
import { DeleteDialog } from "@/components/argocd/applications/delete-dialog";
import { CreateApplicationDialog } from "@/components/argocd/applications/create-application-dialog";
import { BulkActionsBar } from "@/components/argocd/applications/bulk-actions-bar";
import { PaginationControls } from "@/components/argocd/shared/pagination-controls";
import { PageSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, LayoutGrid, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApplicationsPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useApplications();
  const { data: projectsData } = useProjects();
  const refreshApp = useRefreshApplication();
  const syncApp = useSyncApplication();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();

  const [filters, setFilters] = useUrlFilters();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [syncTarget, setSyncTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkRefreshing, setBulkRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const projects = projectsData?.items ?? [];
  const apps = data?.items ?? [];

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const name = app.metadata.name.toLowerCase();
      const project = app.spec.project.toLowerCase();
      if (filters.search && !name.includes(filters.search.toLowerCase()) && !project.includes(filters.search.toLowerCase()))
        return false;
      if (filters.health !== "All" && app.status?.health?.status !== filters.health)
        return false;
      if (filters.sync !== "All" && app.status?.sync?.status !== filters.sync)
        return false;
      if (filters.project !== "All" && app.spec.project !== filters.project)
        return false;
      if (filters.namespace !== "All" && app.spec.destination.namespace !== filters.namespace)
        return false;
      if (filters.cluster !== "All") {
        const dest = app.spec.destination.name ?? app.spec.destination.server ?? "";
        if (dest !== filters.cluster) return false;
      }
      if (filters.autoSync !== "All") {
        const hasAuto = !!app.spec.syncPolicy?.automated;
        if (filters.autoSync === "Enabled" && !hasAuto) return false;
        if (filters.autoSync === "Disabled" && hasAuto) return false;
      }
      if (filters.favorites === "Favorites" && !isFavorite(app.metadata.name))
        return false;
      return true;
    });
  }, [apps, filters, isFavorite]);

  // Paginated subset
  const paginatedApps = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, page, pageSize]);

  // Reset page when filters change
  const filterKey = `${filters.search}|${filters.health}|${filters.sync}|${filters.project}|${filters.namespace}|${filters.cluster}|${filters.autoSync}|${filters.favorites}`;
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleBulkSync = useCallback(async () => {
    setBulkSyncing(true);
    const promises = Array.from(selected).map((name) =>
      syncApp.mutateAsync({ name }).catch(() => {})
    );
    await Promise.allSettled(promises);
    setBulkSyncing(false);
    setSelected(new Set());
  }, [selected, syncApp]);

  const handleBulkRefresh = useCallback(async () => {
    setBulkRefreshing(true);
    const promises = Array.from(selected).map((name) =>
      refreshApp.mutateAsync({ name }).catch(() => {})
    );
    await Promise.allSettled(promises);
    setBulkRefreshing(false);
    setSelected(new Set());
  }, [selected, refreshApp]);

  if (isLoading) return <PageSkeleton />;

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        className="gap-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
      <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        New App
      </Button>
    </div>
  );

  return (
    <>
      <Header
        title="Applications"
        description={`${apps.length} application${apps.length !== 1 ? "s" : ""}`}
        actions={headerActions}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load applications: {(error as Error).message}
            </div>
          )}

          <ApplicationsFilters
            search={filters.search}
            onSearchChange={(v) => setFilters({ search: v })}
            healthFilter={filters.health}
            onHealthChange={(v) => setFilters({ health: v })}
            syncFilter={filters.sync}
            onSyncChange={(v) => setFilters({ sync: v })}
            projectFilter={filters.project}
            onProjectChange={(v) => setFilters({ project: v })}
            projects={projects}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={apps.length}
            filteredCount={filteredApps.length}
          />

          {filteredApps.length === 0 && !isLoading && (
            <EmptyState
              icon={LayoutGrid}
              title={
                apps.length === 0
                  ? "No Applications Yet"
                  : "No Matching Applications"
              }
              description={
                apps.length === 0
                  ? "Deploy your first application from a Git repository."
                  : "Try adjusting your search or filter criteria."
              }
              action={
                apps.length === 0 ? (
                  <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Create Application
                  </Button>
                ) : undefined
              }
            />
          )}

          {viewMode === "grid" && paginatedApps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedApps.map((app) => (
                <ApplicationCard
                  key={app.metadata.name}
                  app={app}
                  onSync={(a) => setSyncTarget(a)}
                  onRefresh={(a) => refreshApp.mutate({ name: a.metadata.name })}
                  onDelete={(a) => setDeleteTarget(a)}
                  selected={selected.has(app.metadata.name)}
                  onSelect={() => toggleSelect(app.metadata.name)}
                  favorite={isFavorite(app.metadata.name)}
                  onToggleFavorite={() => toggleFavorite(app.metadata.name)}
                />
              ))}
            </div>
          )}

          {viewMode === "table" && paginatedApps.length > 0 && (
            <ApplicationTable
              apps={paginatedApps}
              onSync={(a) => setSyncTarget(a)}
              onRefresh={(a) => refreshApp.mutate({ name: a.metadata.name })}
              onDelete={(a) => setDeleteTarget(a)}
              selected={selected}
              onSelect={toggleSelect}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {filteredApps.length > pageSize && (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={filteredApps.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </ScrollArea>

      <BulkActionsBar
        count={selected.size}
        onSyncAll={handleBulkSync}
        onRefreshAll={handleBulkRefresh}
        onClear={() => setSelected(new Set())}
        syncing={bulkSyncing}
        refreshing={bulkRefreshing}
      />

      <SyncDialog app={syncTarget} open={!!syncTarget} onOpenChange={(o) => { if (!o) setSyncTarget(null); }} />
      <DeleteDialog
        app={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onDeleted={() => router.refresh()}
      />
      <CreateApplicationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
