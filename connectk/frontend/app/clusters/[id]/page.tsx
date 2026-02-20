"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { Cluster } from "@/types";
import { StatusBadge, ProviderBadge } from "@/components/ui/StatusBadge";

type Tab = "deployments" | "nodes" | "gpus";

export default function ClusterDetailPage() {
  const params = useParams<{ id: string }>();
  const clusterId = params.id;
  const [tab, setTab] = useState<Tab>("deployments");

  const { data: cluster, isLoading } = useQuery({
    queryKey: QUERY_KEYS.cluster(clusterId),
    queryFn: async () => {
      const resp = await api.get(`/api/clusters/${clusterId}`);
      return extractData<Cluster>(resp);
    },
  });

  const { data: deployments = [] } = useQuery({
    queryKey: QUERY_KEYS.clusterDeployments(clusterId),
    queryFn: async () => {
      const resp = await api.get(`/api/clusters/${clusterId}/deployments`);
      return extractData<Array<{ id: string; name: string; namespace: string; backend: string; replicas: number; status: string }>>(resp);
    },
  });

  const { data: nodes = [] } = useQuery({
    queryKey: QUERY_KEYS.clusterNodes(clusterId),
    queryFn: async () => {
      const resp = await api.get(`/api/clusters/${clusterId}/nodes`);
      return extractData<Array<{ id: string; name: string; status: string; cpu_cores: number; memory_gb: number; gpu_count: number; gpu_model: string }>>(resp);
    },
  });

  const { data: gpus = [] } = useQuery({
    queryKey: QUERY_KEYS.clusterGpus(clusterId),
    queryFn: async () => {
      const resp = await api.get(`/api/clusters/${clusterId}/gpus`);
      return extractData<Array<{ id: string; node_name: string; gpu_model: string; vram_gb: number; utilization_pct: number; status: string }>>(resp);
    },
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading cluster details...</p>;
  }

  if (!cluster) {
    return <p className="text-sm text-red-600">Cluster not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{cluster.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ProviderBadge provider={cluster.provider} />
          <span className="badge badge-gray">{cluster.region}</span>
          <StatusBadge status={cluster.status} />
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button className={`px-3 py-2 text-sm ${tab === "deployments" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`} onClick={() => setTab("deployments")}>Deployments</button>
        <button className={`px-3 py-2 text-sm ${tab === "nodes" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`} onClick={() => setTab("nodes")}>Nodes</button>
        <button className={`px-3 py-2 text-sm ${tab === "gpus" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`} onClick={() => setTab("gpus")}>GPUs</button>
      </div>

      {tab === "deployments" && (
        <div className="card p-4">
          {deployments.length === 0 ? (
            <p className="text-sm text-gray-500">No deployments in this cluster.</p>
          ) : (
            <div className="space-y-3">
              {deployments.map((d) => (
                <div key={d.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.namespace} · {d.backend} · {d.replicas} replicas</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "nodes" && (
        <div className="card p-4">
          {nodes.length === 0 ? (
            <p className="text-sm text-gray-500">No nodes found.</p>
          ) : (
            <div className="space-y-3">
              {nodes.map((n) => (
                <div key={n.id} className="border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-900">{n.name}</p>
                  <p className="text-xs text-gray-500">{n.cpu_cores} vCPU · {n.memory_gb} GB RAM · {n.gpu_count} GPU ({n.gpu_model})</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "gpus" && (
        <div className="card p-4">
          {gpus.length === 0 ? (
            <p className="text-sm text-gray-500">No GPUs found.</p>
          ) : (
            <div className="space-y-3">
              {gpus.map((g) => (
                <div key={g.id} className="border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-900">{g.gpu_model} ({g.vram_gb} GB)</p>
                  <p className="text-xs text-gray-500">{g.node_name} · Utilization {g.utilization_pct}% · {g.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
