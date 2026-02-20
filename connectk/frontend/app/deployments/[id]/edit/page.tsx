"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { Deployment } from "@/types";
import { DeploymentForm } from "@/components/deployments/DeploymentForm";
import { useToast } from "@/components/ui/Toast";

export default function EditDeploymentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const deploymentId = params.id;
  const { success } = useToast();

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
    <DeploymentForm
      editMode
      deploymentId={deploymentId}
      defaultValues={{
        name: deployment.name,
        cluster_id: deployment.cluster_id,
        namespace: deployment.namespace,
        model_id: deployment.model_id,
        backend: deployment.backend,
        deployment_type: deployment.deployment_type,
        replicas: deployment.replicas,
        gpu_per_replica: deployment.gpu_per_replica,
        quantization: deployment.quantization || undefined,
        kv_cache_gb: deployment.kv_cache_gb || undefined,
        max_batch_size: deployment.max_batch_size || undefined,
        runtime_optimizations: deployment.runtime_optimizations || [],
      }}
      onClose={() => router.push(`/deployments/${deploymentId}`)}
      onSuccess={() => {
        success("Deployment updated", "Deployment configuration has been updated.");
        router.push(`/deployments/${deploymentId}`);
      }}
    />
  );
}
