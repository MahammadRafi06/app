"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Cpu, Server, Zap, Activity, DollarSign } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { Node, NodeKPIs } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge, ProviderBadge } from "@/components/ui/StatusBadge";
import { formatNumber, cn } from "@/lib/utils";

export default function NodesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.nodes({ page, search }),
    queryFn: async () => {
      const resp = await api.get("/api/nodes", { params: { page, page_size: 25, search: search || undefined } });
      return {
        items: extractData<Node[]>(resp),
        pagination: resp.data.pagination,
        kpis: resp.data.kpis as NodeKPIs,
      };
    },
    staleTime: STALE_TIMES.nodes,
  });

  const nodes = data?.items || [];
  const kpis = data?.kpis;

  const columns: Column<Node>[] = [
    { key: "name", header: "Node Name", sortable: true, render: (n) => <span className="font-medium font-mono text-sm">{n.name}</span> },
    { key: "cluster_name", header: "Cluster", render: (n) => <span className="text-gray-700">{n.cluster_name}</span> },
    { key: "provider", header: "Provider", render: (n) => <ProviderBadge provider={n.provider} /> },
    { key: "os", header: "OS", render: (n) => <span className="text-xs text-gray-600">{n.os}</span> },
    { key: "cpu_cores", header: "CPUs", render: (n) => <span className="font-semibold">{n.cpu_cores}</span> },
    { key: "gpu_count", header: "GPUs", render: (n) => <span className="font-semibold text-purple-700">{n.gpu_count}</span> },
    { key: "gpu_model", header: "GPU Model", render: (n) => <span className="text-xs text-gray-600">{n.gpu_model || "—"}</span> },
    { key: "memory_gb", header: "Memory", render: (n) => <span>{n.memory_gb} GB</span> },
    {
      key: "utilization_pct",
      header: "Util.",
      render: (n) => (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full", n.utilization_pct > 80 ? "bg-red-500" : n.utilization_pct > 60 ? "bg-yellow-500" : "bg-green-500")}
              style={{ width: `${n.utilization_pct}%` }}
            />
          </div>
          <span className="text-xs">{n.utilization_pct.toFixed(0)}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (n) => <StatusBadge status={n.status} /> },
    { key: "cost_per_hour", header: "$/hr", render: (n) => <span className="text-gray-600">${n.cost_per_hour.toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
        <p className="text-sm text-gray-500 mt-1">Hardware inventory across all clusters</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Nodes" value={formatNumber(kpis?.total_nodes || 0)} icon={Server} loading={isLoading} />
        <KpiCard title="Total CPUs" value={formatNumber(kpis?.total_cpus || 0)} icon={Cpu} loading={isLoading} />
        <KpiCard title="Total GPUs" value={formatNumber(kpis?.total_gpus || 0)} icon={Zap} iconColor="text-purple-600" loading={isLoading} />
        <KpiCard title="Avg Utilization" value={`${(kpis?.avg_utilization_pct || 0).toFixed(1)}%`} icon={Activity} loading={isLoading} />
        <KpiCard title="Nodes w/ GPU" value={formatNumber(kpis?.nodes_with_gpu || 0)} icon={Zap} iconColor="text-green-600" loading={isLoading} />
        <KpiCard title="Est. Hourly Cost" value={`$${(kpis?.est_hourly_cost || 0).toFixed(0)}`} icon={DollarSign} loading={isLoading} />
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Search nodes..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs" />
      </div>

      <DataTable
        columns={columns}
        data={nodes}
        loading={isLoading}
        onRowClick={(n) => router.push(`/nodes/${n.id}`)}
        emptyMessage="No nodes found."
      />
    </div>
  );
}
