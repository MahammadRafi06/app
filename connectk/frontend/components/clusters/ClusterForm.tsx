"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, TestTube2, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { ClusterCreatePayload } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface TestResult {
  success: boolean;
  k8s_version?: string;
  node_count?: number;
  message: string;
}

interface FormFields extends ClusterCreatePayload {
  service_account_token: string;
  ca_certificate: string;
  eks_oidc_provider_url: string;
  eks_iam_role_arn: string;
  aks_service_principal_id: string;
  gke_workload_identity_pool: string;
  gke_service_account: string;
}

export function ClusterForm({ onClose, onSuccess }: Props) {
  const { error: showError } = useToast();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormFields>({
    defaultValues: {
      gitops_branch: "main",
      cache_ttl_seconds: 300,
      gitops_tool: "argocd",
    },
  });

  useUnsavedChanges(isDirty);

  const provider = watch("provider");

  const handleTest = async () => {
    const endpoint = watch("kubeapi_endpoint");
    if (!endpoint) return;
    setTesting(true);
    try {
      const resp = await api.post("/api/clusters/test", {
        kubeapi_endpoint: endpoint,
        provider: provider,
        auth_config: {},
      });
      setTestResult(resp.data.data);
    } catch {
      setTestResult({ success: false, message: "Connection failed." });
    } finally {
      setTesting(false);
    }
  };

  const buildAuthConfig = (data: FormFields) => {
    const base: Record<string, string> = {};
    if (data.service_account_token) base.service_account_token = data.service_account_token;
    if (data.ca_certificate) base.ca_certificate = data.ca_certificate;

    if (data.provider === "EKS") {
      if (data.eks_oidc_provider_url) base.oidc_provider_url = data.eks_oidc_provider_url;
      if (data.eks_iam_role_arn) base.iam_role_arn = data.eks_iam_role_arn;
    } else if (data.provider === "AKS") {
      if (data.aks_service_principal_id) base.service_principal_id = data.aks_service_principal_id;
    } else if (data.provider === "GKE") {
      if (data.gke_workload_identity_pool) base.workload_identity_pool = data.gke_workload_identity_pool;
      if (data.gke_service_account) base.gcp_service_account = data.gke_service_account;
    }
    return base;
  };

  const onSubmit = async (data: FormFields) => {
    setSubmitting(true);
    try {
      const { service_account_token, ca_certificate, eks_oidc_provider_url, eks_iam_role_arn, aks_service_principal_id, gke_workload_identity_pool, gke_service_account, ...clusterData } = data;
      await api.post("/api/clusters", {
        ...clusterData,
        auth_config: buildAuthConfig(data),
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to register cluster.";
      showError("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Register Cluster</h2>
            <p className="text-sm text-gray-500">Add an existing Kubernetes cluster to ConnectK</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cluster Name *</label>
              <input {...register("name", { required: "Required" })} className="input" placeholder="gke-prod-us-east1" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Cloud Provider *</label>
              <select {...register("provider", { required: "Required" })} className="input">
                <option value="">Select provider</option>
                <option value="GKE">Google GKE</option>
                <option value="AKS">Azure AKS</option>
                <option value="EKS">AWS EKS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Region *</label>
              <input {...register("region", { required: "Required" })} className="input" placeholder="us-east1" />
            </div>
            <div>
              <label className="label">KubeAPI Endpoint *</label>
              <input {...register("kubeapi_endpoint", { required: "Required" })} className="input" placeholder="https://your-cluster.example.com" />
            </div>
          </div>

          {provider === "EKS" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div>
                <label className="label">OIDC Provider URL</label>
                <input {...register("eks_oidc_provider_url")} className="input" placeholder="https://oidc.eks.region.amazonaws.com/..." />
              </div>
              <div>
                <label className="label">IAM Role ARN</label>
                <input {...register("eks_iam_role_arn")} className="input" placeholder="arn:aws:iam::123:role/ConnectK" />
              </div>
            </div>
          )}

          {provider === "AKS" && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <label className="label">Service Principal ID</label>
                <input {...register("aks_service_principal_id")} className="input" placeholder="your-service-principal-id" />
              </div>
            </div>
          )}

          {provider === "GKE" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <label className="label">Workload Identity Pool</label>
                <input {...register("gke_workload_identity_pool")} className="input" placeholder="projects/PROJECT/locations/global/workloadIdentityPools/..." />
              </div>
              <div>
                <label className="label">GCP Service Account</label>
                <input {...register("gke_service_account")} className="input" placeholder="connectk@project.iam.gserviceaccount.com" />
              </div>
            </div>
          )}

          <div>
            <label className="label">Service Account Token</label>
            <textarea {...register("service_account_token")} rows={3} className="input font-mono text-xs" placeholder="eyJhbGciOiJSUzI1NiIs..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GitOps Tool *</label>
              <select {...register("gitops_tool", { required: "Required" })} className="input">
                <option value="argocd">ArgoCD</option>
                <option value="fluxcd">FluxCD</option>
              </select>
            </div>
            <div>
              <label className="label">GitOps Repository URL *</label>
              <input {...register("gitops_repo_url", { required: "Required" })} className="input" placeholder="https://github.com/org/gitops-repo" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Branch</label>
              <input {...register("gitops_branch")} className="input" defaultValue="main" />
            </div>
            <div>
              <label className="label">Cache TTL (seconds)</label>
              <input {...register("cache_ttl_seconds", { valueAsNumber: true })} type="number" className="input" defaultValue={300} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
            <button type="button" onClick={handleTest} disabled={testing} className="btn-secondary gap-2">
              <TestTube2 className="w-4 h-4" />
              {testing ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-700">
                      Connected · K8s {testResult.k8s_version} · {testResult.node_count} nodes
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700">{testResult.message}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Registering..." : "Register Cluster"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
