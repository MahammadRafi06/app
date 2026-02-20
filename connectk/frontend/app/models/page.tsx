"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, Package, Server, Database } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { AIModel, ModelKPIs } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { ModelForm } from "@/components/models/ModelForm";

export default function ModelsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<AIModel | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.models({ page, search }),
    queryFn: async () => {
      const resp = await api.get("/api/models", { params: { page, page_size: 25, search: search || undefined } });
      return {
        items: extractData<AIModel[]>(resp),
        pagination: resp.data.pagination,
        kpis: resp.data.kpis as ModelKPIs,
      };
    },
    staleTime: STALE_TIMES.models,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/models/${id}`),
    onSuccess: () => {
      success("Model removed", "Model has been soft-deleted from the registry.");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to delete model.";
      showError("Error", msg);
    },
  });

  const models = data?.items || [];
  const kpis = data?.kpis;
  const pagination = data?.pagination;

  const columns: Column<AIModel>[] = [
    {
      key: "name",
      header: "Model Name",
      sortable: true,
      render: (m) => (
        <div>
          <p className="font-medium text-gray-900 font-mono text-sm">{m.name}</p>
          {m.custom_name && <p className="text-xs text-gray-500">{m.custom_name}</p>}
        </div>
      ),
    },
    { key: "architecture", header: "Architecture", render: (m) => <span className="badge badge-blue">{m.architecture}</span> },
    { key: "param_count_b", header: "Params", render: (m) => <span className="font-semibold">{m.param_count_b}B</span> },
    { key: "size_fp32_gb", header: "Size (FP32)", render: (m) => <span>{m.size_fp32_gb} GB</span> },
    {
      key: "source_type",
      header: "Source",
      render: (m) => (
        <div>
          <span className="badge badge-gray">{m.source_type}</span>
        </div>
      ),
    },
    {
      key: "supported_backends",
      header: "Backends",
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.supported_backends.map((b) => <span key={b} className="badge badge-purple text-xs">{b}</span>)}
        </div>
      ),
    },
    { key: "active_deployments", header: "Active Deps.", render: (m) => <span className="font-semibold text-green-700">{m.active_deployments}</span> },
    { key: "created_at", header: "Added", render: (m) => <span className="text-gray-500 text-xs">{formatRelativeTime(m.created_at)}</span> },
  ];

  const selectedModel = selectedIds.size === 1 ? models.find((m) => selectedIds.has(m.id)) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage AI models available for deployment</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Models" value={formatNumber(kpis?.total_models || 0)} icon={Package} loading={isLoading} />
        <KpiCard title="Most Deployed" value={kpis?.most_deployed_model || "—"} icon={Server} loading={isLoading} />
        <KpiCard title="Avg Model Size" value={kpis?.avg_model_size_gb ? `${kpis.avg_model_size_gb.toFixed(0)} GB` : "—"} icon={Database} loading={isLoading} />
        <KpiCard
          title="Model Sources"
          value={Object.keys(kpis?.model_sources || {}).length}
          subtitle={Object.entries(kpis?.model_sources || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
          loading={isLoading}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-brand-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {selectedModel && (
              <button className="btn-secondary gap-2 text-xs" onClick={() => router.push(`/models/${selectedModel.id}/edit`)}>
                <Edit className="w-3.5 h-3.5" />Edit
              </button>
            )}
            <button className="btn-danger gap-2 text-xs" onClick={() => selectedModel && setConfirmDelete(selectedModel)}>
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs" />
      </div>

      <DataTable
        columns={columns}
        data={models}
        loading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(m) => router.push(`/models/${m.id}`)}
        pagination={pagination ? {
          page: pagination.page,
          pageSize: pagination.page_size,
          totalItems: pagination.total_items,
          totalPages: pagination.total_pages,
          onPageChange: setPage,
        } : undefined}
        emptyMessage="No models in registry."
        emptyAction={
          <button onClick={() => setShowForm(true)} className="btn-primary gap-2 mt-2">
            <Plus className="w-4 h-4" />Add your first model
          </button>
        }
      />

      {showForm && (
        <ModelForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["models"] });
            success("Model added", "Model registered successfully.");
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Model"
        description={`Remove "${confirmDelete?.name}" from the registry? This is blocked if active deployments exist.`}
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
