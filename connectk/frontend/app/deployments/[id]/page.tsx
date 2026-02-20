"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { Deployment } from "@/types";
import { StatusBadge, ProviderBadge } from "@/components/ui/StatusBadge";

export default function DeploymentDetailPage() {
  const params = useParams<{ id: string }>();
  const deploymentId = params.id;

  const { data: deployment, isLoading } = useQuery({
    queryKey: QUERY_KEYS.deployment(deploymentId),
    queryFn: async () => {
      const resp = await api.get(`/api/deployments/${deploymentId}`);
      return extractData<Deployment>(resp);
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading deployment...</p>;
  if (!deployment) return <p className="text-sm text-red-600">Deployment not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{deployment.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{deployment.namespace}</p>
        </div>
        <Link href={`/deployments/${deployment.id}/edit`} className="btn-secondary text-sm">Edit</Link>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {deployment.cluster_provider && <ProviderBadge provider={deployment.cluster_provider} />}
          <StatusBadge status={deployment.status} />
          <span className="badge badge-gray">{deployment.backend}</span>
          <span className="badge badge-gray">{deployment.deployment_type}</span>
        </div>
        <p className="text-sm text-gray-700">Cluster: {deployment.cluster_name || deployment.cluster_id}</p>
        <p className="text-sm text-gray-700">Model: {deployment.model_name || deployment.model_id}</p>
        <p className="text-sm text-gray-700">Replicas: {deployment.replicas} · GPU/Replica: {deployment.gpu_per_replica}</p>
        <p className="text-sm text-gray-700">Quantization: {deployment.quantization || "None"}</p>
      </div>
    </div>
  );
}
