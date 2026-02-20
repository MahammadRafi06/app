"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, Eye, Rocket, Package, Activity, Clock, Zap, DollarSign } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { Deployment, DeploymentKPIs } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge, ProviderBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatNumber, formatCurrency, formatRelativeTime, BACKEND_LABELS, DEPLOYMENT_STATUS_LABELS } from "@/lib/utils";
import { DeploymentForm } from "@/components/deployments/DeploymentForm";

export default function DeploymentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Deployment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.deployments({ page, search, status: statusFilter }),
    queryFn: async () => {
      const resp = await api.get("/api/deployments", {
        params: { page, page_size: 25, search: search || undefined, status: statusFilter || undefined },
      });
      return {
        items: extractData<Deployment[]>(resp),
        pagination: resp.data.pagination,
        kpis: resp.data.kpis as DeploymentKPIs,
      };
    },
    staleTime: STALE_TIMES.deployments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/deployments/${id}`),
    onSuccess: () => {
      success("Deployment deleted", "The deployment manifest has been removed from the GitOps repo.");
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to delete.";
      showError("Error", msg);
    },
  });

  const deployments = data?.items || [];
  const kpis = data?.kpis;
  const pagination = data?.pagination;

  const columns: Column<Deployment>[] = [
    {
      key: "name",
      header: "Deployment Name",
      sortable: true,
      render: (d) => <span className="font-medium text-gray-900">{d.name}</span>,
    },
    { key: "model_name", header: "Model", render: (d) => <span className="text-blue-700 font-mono text-xs">{d.model_name || "—"}</span> },
    { key: "replicas", header: "Replicas", render: (d) => <span className="font-semibold">{d.replicas}</span> },
    { key: "cluster_name", header: "Cluster", render: (d) => <span className="text-gray-700">{d.cluster_name || d.cluster_id.slice(0, 8)}</span> },
    { key: "cluster_provider", header: "Provider", render: (d) => d.cluster_provider ? <ProviderBadge provider={d.cluster_provider} /> : <span className="text-gray-400">—</span> },
    { key: "backend", header: "Backend", render: (d) => <span className="badge badge-blue">{BACKEND_LABELS[d.backend] || d.backend}</span> },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    { key: "created_at", header: "Created", render: (d) => <span className="text-gray-500 text-xs">{formatRelativeTime(d.created_at)}</span> },
  ];

  const selectedDeployment = selectedIds.size === 1 ? deployments.find((d) => selectedIds.has(d.id)) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage AI inference deployments across clusters</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Deployment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Deployments" value={formatNumber(kpis?.total_deployments || 0)} icon={Rocket} loading={isLoading} />
        <KpiCard title="Models in Use" value={formatNumber(kpis?.total_models_in_use || 0)} icon={Package} loading={isLoading} />
        <KpiCard title="Top Model" value={kpis?.top_used_model || "—"} icon={Activity} loading={isLoading} />
        <KpiCard title="Avg Latency" value={kpis?.avg_latency_ms ? `${kpis.avg_latency_ms.toFixed(0)}ms` : "—"} icon={Clock} loading={isLoading} />
        <KpiCard title="Avg Throughput" value={kpis?.avg_throughput_tps ? `${kpis.avg_throughput_tps.toFixed(0)} t/s` : "—"} icon={Zap} loading={isLoading} />
        <KpiCard title="Est. Cost" value={formatCurrency(kpis?.est_total_cost_usd || 0)} icon={DollarSign} loading={isLoading} />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-brand-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {selectedDeployment && (
              <>
                <button className="btn-secondary gap-2 text-xs" onClick={() => router.push(`/deployments/${selectedDeployment.id}`)}>
                  <Eye className="w-3.5 h-3.5" />View
                </button>
                <button className="btn-secondary gap-2 text-xs" onClick={() => router.push(`/deployments/${selectedDeployment.id}/edit`)}>
                  <Edit className="w-3.5 h-3.5" />Edit
                </button>
              </>
            )}
            <button className="btn-danger gap-2 text-xs" onClick={() => selectedDeployment && setConfirmDelete(selectedDeployment)}>
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <input type="text" placeholder="Search deployments..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
          <option value="">All statuses</option>
          {Object.entries(DEPLOYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={deployments}
        loading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(d) => router.push(`/deployments/${d.id}`)}
        pagination={pagination ? {
          page: pagination.page,
          pageSize: pagination.page_size,
          totalItems: pagination.total_items,
          totalPages: pagination.total_pages,
          onPageChange: setPage,
        } : undefined}
        emptyMessage="No deployments yet."
        emptyAction={
          <button onClick={() => setShowForm(true)} className="btn-primary gap-2 mt-2">
            <Plus className="w-4 h-4" /> Create your first deployment
          </button>
        }
      />

      {showForm && (
        <DeploymentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["deployments"] });
            success("Deployment created", "GitOps commit submitted. Status will update shortly.");
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Deployment"
        description={`Delete "${confirmDelete?.name}"? This will commit a deletion to the GitOps repository.`}
        confirmLabel="Delete"
        confirmText={confirmDelete?.name}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        dangerous
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
