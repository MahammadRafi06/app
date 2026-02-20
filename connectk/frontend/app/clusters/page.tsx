"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2, Eye, Server, Cpu, Zap, Activity, DollarSign, Rocket } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { Cluster, ClusterKPIs } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge, ProviderBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatNumber, formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import { ClusterForm } from "@/components/clusters/ClusterForm";

export default function ClustersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Cluster | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.clusters({ page, search }),
    queryFn: async () => {
      const resp = await api.get("/api/clusters", { params: { page, page_size: 25, search: search || undefined } });
      return {
        items: extractData<Cluster[]>(resp),
        pagination: resp.data.pagination,
        kpis: resp.data.kpis as ClusterKPIs,
      };
    },
    staleTime: STALE_TIMES.clusters,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/clusters/${id}`),
    onSuccess: () => {
      success("Cluster removed", "Cluster has been dissociated from ConnectK.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters() });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to remove cluster.";
      showError("Error", msg);
    },
  });

  const clusters = data?.items || [];
  const kpis = data?.kpis;
  const pagination = data?.pagination;

  const columns: Column<Cluster>[] = [
    {
      key: "name",
      header: "Cluster Name",
      sortable: true,
      render: (c) => (
        <span className="font-medium text-gray-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-gray-400" />
          {c.name}
        </span>
      ),
    },
    { key: "provider", header: "Provider", render: (c) => <ProviderBadge provider={c.provider} /> },
    { key: "region", header: "Region", render: (c) => <span className="text-gray-600">{c.region}</span> },
    { key: "k8s_version", header: "K8s Version", render: (c) => <span className="font-mono text-xs text-gray-600">{c.k8s_version || "—"}</span> },
    { key: "node_count", header: "Nodes", render: (c) => <span className="font-semibold">{formatNumber(c.node_count)}</span> },
    { key: "gpu_count", header: "GPUs", render: (c) => <span className="font-semibold text-purple-700">{formatNumber(c.gpu_count)}</span> },
    { key: "active_models", header: "Active Models", render: (c) => <span>{c.active_models}</span> },
    {
      key: "utilization_pct",
      header: "Utilization",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full", c.utilization_pct > 80 ? "bg-red-500" : c.utilization_pct > 60 ? "bg-yellow-500" : "bg-green-500")}
              style={{ width: `${c.utilization_pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{c.utilization_pct.toFixed(1)}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clusters</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your multi-cloud Kubernetes clusters</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="btn-secondary gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Add Cluster
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Clusters" value={formatNumber(kpis?.total_clusters || 0)} icon={Server} iconColor="text-blue-600" loading={isLoading} />
        <KpiCard title="Total Nodes" value={formatNumber(kpis?.total_nodes || 0)} icon={Cpu} iconColor="text-green-600" loading={isLoading} />
        <KpiCard title="Total GPUs" value={formatNumber(kpis?.total_gpus || 0)} icon={Zap} iconColor="text-purple-600" loading={isLoading} />
        <KpiCard title="Avg Utilization" value={`${(kpis?.avg_utilization_pct || 0).toFixed(1)}%`} icon={Activity} iconColor="text-orange-600" loading={isLoading} />
        <KpiCard title="Active Deployments" value={formatNumber(kpis?.active_deployments || 0)} icon={Rocket} iconColor="text-brand-600" loading={isLoading} />
        <KpiCard title="Est. Monthly Cost" value={formatCurrency(kpis?.est_monthly_cost_usd || 0)} icon={DollarSign} iconColor="text-red-600" loading={isLoading} />
      </div>

      {/* Action bar for selected items */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-brand-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button className="btn-secondary gap-2 text-xs" onClick={() => router.push(`/clusters/${[...selectedIds][0]}`)}>
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
            <button
              className="btn-danger gap-2 text-xs"
              onClick={() => {
                const c = clusters.find((x) => selectedIds.has(x.id));
                if (c) setConfirmDelete(c);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Dissociate
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search clusters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={clusters}
        loading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(c) => router.push(`/clusters/${c.id}`)}
        pagination={pagination ? {
          page: pagination.page,
          pageSize: pagination.page_size,
          totalItems: pagination.total_items,
          totalPages: pagination.total_pages,
          onPageChange: setPage,
        } : undefined}
        emptyMessage="No clusters registered yet."
        emptyAction={
          <button onClick={() => setShowAddForm(true)} className="btn-primary gap-2 mt-2">
            <Plus className="w-4 h-4" />
            Add your first cluster
          </button>
        }
      />

      {/* Add Cluster Modal */}
      {showAddForm && (
        <ClusterForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters() });
            success("Cluster registered", "Your cluster has been added to ConnectK.");
          }}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Dissociate Cluster"
        description={`Remove "${confirmDelete?.name}" from ConnectK? This will not delete the actual Kubernetes cluster.`}
        confirmLabel="Dissociate"
        confirmText={confirmDelete?.name}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        dangerous
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
