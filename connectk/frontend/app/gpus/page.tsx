"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Thermometer, Activity, Database, DollarSign } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { GPU, GPUKPIs } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber, cn } from "@/lib/utils";

export default function GPUsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.gpus({ page }),
    queryFn: async () => {
      const resp = await api.get("/api/gpus", { params: { page, page_size: 25 } });
      return {
        items: extractData<GPU[]>(resp),
        pagination: resp.data.pagination,
        kpis: resp.data.kpis as GPUKPIs,
      };
    },
    staleTime: STALE_TIMES.nodes,
  });

  const gpus = data?.items || [];
  const kpis = data?.kpis;

  const columns: Column<GPU>[] = [
    { key: "id", header: "GPU ID", render: (g) => <span className="font-mono text-xs font-semibold">{g.id}</span> },
    { key: "node_name", header: "Node", render: (g) => <span className="font-mono text-xs text-gray-700">{g.node_name}</span> },
    { key: "cluster_name", header: "Cluster", render: (g) => <span className="text-gray-700">{g.cluster_name}</span> },
    { key: "gpu_model", header: "GPU Model", render: (g) => <span className="font-medium text-sm">{g.gpu_model}</span> },
    { key: "vram_gb", header: "VRAM", render: (g) => <span className="font-semibold">{g.vram_gb} GB</span> },
    {
      key: "utilization_pct",
      header: "Utilization",
      render: (g) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full", g.utilization_pct > 90 ? "bg-red-500" : g.utilization_pct > 70 ? "bg-yellow-500" : "bg-green-500")}
              style={{ width: `${g.utilization_pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold">{g.utilization_pct.toFixed(1)}%</span>
        </div>
      ),
    },
    { key: "temperature_c", header: "Temp (°C)", render: (g) => g.temperature_c ? <span className={cn("font-mono text-sm", g.temperature_c > 80 ? "text-red-600" : "text-gray-700")}>{g.temperature_c}°C</span> : <span>—</span> },
    { key: "power_draw_w", header: "Power (W)", render: (g) => g.power_draw_w ? <span className="font-mono text-sm">{g.power_draw_w}W</span> : <span>—</span> },
    { key: "assigned_workload", header: "Workload", render: (g) => g.assigned_workload ? <span className="badge badge-blue font-mono text-xs">{g.assigned_workload}</span> : <span className="badge badge-gray">Idle</span> },
    { key: "status", header: "Status", render: (g) => <StatusBadge status={g.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GPUs</h1>
        <p className="text-sm text-gray-500 mt-1">GPU resource inventory and utilization across all clusters</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total GPUs" value={formatNumber(kpis?.total_gpus || 0)} icon={Zap} iconColor="text-purple-600" loading={isLoading} />
        <KpiCard title="GPU Models" value={kpis?.gpu_models_in_use || 0} loading={isLoading} />
        <KpiCard title="Avg Utilization" value={`${(kpis?.avg_utilization_pct || 0).toFixed(1)}%`} icon={Activity} loading={isLoading} />
        <KpiCard title="Total VRAM" value={kpis?.total_vram_tb ? `${kpis.total_vram_tb.toFixed(2)} TB` : "—"} icon={Database} loading={isLoading} />
        <KpiCard title="GPUs Available" value={formatNumber(kpis?.gpus_available || 0)} icon={Zap} iconColor="text-green-600" loading={isLoading} />
        <KpiCard title="Est. GPU Cost/hr" value={`$${(kpis?.est_gpu_cost_per_hour || 0).toFixed(0)}`} icon={DollarSign} loading={isLoading} />
      </div>

      <DataTable
        columns={columns}
        data={gpus}
        loading={isLoading}
        pagination={data?.pagination ? {
          page: data.pagination.page,
          pageSize: data.pagination.page_size,
          totalItems: data.pagination.total_items,
          totalPages: data.pagination.total_pages,
          onPageChange: setPage,
        } : undefined}
        emptyMessage="No GPU resources found."
      />
    </div>
  );
}
