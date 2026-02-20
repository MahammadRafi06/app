"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { Cluster, AIModel, DeploymentCreatePayload } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const RUNTIME_OPTS = ["continuous_batching", "speculative_decoding", "prefix_caching", "flash_attention", "paged_attention"];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: Partial<DeploymentCreatePayload>;
  editMode?: boolean;
  deploymentId?: string;
}

export function DeploymentForm({ onClose, onSuccess, defaultValues, editMode, deploymentId }: Props) {
  const { error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { data: clusters = [] } = useQuery({
    queryKey: QUERY_KEYS.clusters(),
    queryFn: async () => {
      const resp = await api.get("/api/clusters");
      return extractData<Cluster[]>(resp);
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: QUERY_KEYS.models(),
    queryFn: async () => {
      const resp = await api.get("/api/models");
      return extractData<AIModel[]>(resp);
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<DeploymentCreatePayload>({
    defaultValues: {
      replicas: 1,
      gpu_per_replica: 1,
      runtime_optimizations: [],
      backend: "vllm",
      deployment_type: "aggregated",
      ...defaultValues,
    },
  });

  useUnsavedChanges(isDirty);

  const selectedProvider = watch("cluster_id")
    ? clusters.find((c) => c.id === watch("cluster_id"))?.provider
    : null;

  const onSubmit = async (data: DeploymentCreatePayload) => {
    setSubmitting(true);
    try {
      if (editMode && deploymentId) {
        const updatePayload = {
          replicas: data.replicas,
          gpu_per_replica: data.gpu_per_replica,
          quantization: data.quantization,
          kv_cache_gb: data.kv_cache_gb,
          max_batch_size: data.max_batch_size,
          runtime_optimizations: data.runtime_optimizations,
          backend: data.backend,
          deployment_type: data.deployment_type,
          model_id: data.model_id,
        };
        await api.put(`/api/deployments/${deploymentId}`, updatePayload);
      } else {
        await api.post("/api/deployments", data);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Operation failed.";
      showError("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = editMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? "Edit Deployment" : "Create Deployment"}</h2>
            <p className="text-sm text-gray-500">Configure your AI inference deployment</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Non-editable section heading when editing */}
          {isEditing && (
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              Name, Provider, Cluster, and Namespace cannot be changed. Delete and recreate if needed.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Deployment Name *</label>
              <input
                {...register("name", { required: "Required", pattern: { value: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/, message: "Lowercase letters, numbers, hyphens only" } })}
                className="input"
                placeholder="llama3-70b-prod"
                disabled={isEditing}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Cluster *</label>
              <select {...register("cluster_id", { required: "Required" })} className="input" disabled={isEditing}>
                <option value="">Select cluster</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.provider})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Namespace *</label>
              <input {...register("namespace", { required: "Required" })} className="input" placeholder="ai-inference" disabled={isEditing} />
            </div>
            <div>
              <label className="label">Model *</label>
              <select {...register("model_id", { required: "Required" })} className="input">
                <option value="">Select model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.custom_name || m.name} ({m.param_count_b}B)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Backend Framework *</label>
              <select {...register("backend", { required: "Required" })} className="input">
                <option value="vllm">vLLM</option>
                <option value="sglang">SGLang</option>
                <option value="trtllm">TensorRT-LLM</option>
              </select>
            </div>
            <div>
              <label className="label">Deployment Type *</label>
              <select {...register("deployment_type", { required: "Required" })} className="input">
                <option value="aggregated">Aggregated</option>
                <option value="aggregated_route">Aggregated + Route</option>
                <option value="disaggregated_route">Disaggregated + Route</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Replicas *</label>
              <input {...register("replicas", { required: "Required", min: 1, valueAsNumber: true })} type="number" min={1} className="input" />
            </div>
            <div>
              <label className="label">GPUs / Replica *</label>
              <input {...register("gpu_per_replica", { required: "Required", min: 1, valueAsNumber: true })} type="number" min={1} className="input" />
            </div>
            <div>
              <label className="label">Quantization</label>
              <select {...register("quantization")} className="input">
                <option value="">None</option>
                <option value="FP16">FP16</option>
                <option value="INT8">INT8</option>
                <option value="INT4">INT4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max Batch Size</label>
              <input {...register("max_batch_size", { valueAsNumber: true })} type="number" min={1} className="input" placeholder="256" />
            </div>
            <div>
              <label className="label">KV Cache Size (GB)</label>
              <input {...register("kv_cache_gb", { valueAsNumber: true })} type="number" min={0} step={0.5} className="input" placeholder="32" />
            </div>
          </div>

          <div>
            <label className="label">Runtime Optimizations</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {RUNTIME_OPTS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt}
                    {...register("runtime_optimizations")}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span className="text-sm text-gray-700">{opt.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : isEditing ? "Update Deployment" : "Create Deployment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
