"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface ModelPayload {
  name: string;
  custom_name?: string;
  source_type: string;
  source_uri: string;
  architecture: string;
  param_count_b: number;
  size_fp32_gb: number;
  supported_platforms: string[];
  supported_backends: string[];
  tokenizer_path?: string;
  description?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: Partial<ModelPayload>;
  editMode?: boolean;
  modelId?: string;
}

export function ModelForm({ onClose, onSuccess, defaultValues, editMode, modelId }: Props) {
  const { error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ModelPayload>({
    defaultValues: {
      architecture: "Transformer",
      supported_platforms: ["cuda"],
      supported_backends: ["vllm"],
      ...defaultValues,
    },
  });

  const onSubmit = async (data: ModelPayload) => {
    setSubmitting(true);
    try {
      if (editMode && modelId) {
        await api.put(`/api/models/${modelId}`, data);
      } else {
        await api.post("/api/models", {
          ...data,
          param_count_b: Number(data.param_count_b),
          size_fp32_gb: Number(data.size_fp32_gb),
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Operation failed.";
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
            <h2 className="text-lg font-semibold">{editMode ? "Edit Model" : "Add Model"}</h2>
            <p className="text-sm text-gray-500">Register an AI model in the ConnectK registry</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Model Name *</label>
              <input {...register("name", { required: "Required" })} className="input font-mono text-sm" placeholder="meta-llama/Llama-3-70B" disabled={editMode} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Display Name</label>
              <input {...register("custom_name")} className="input" placeholder="Llama 3 70B" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source Type *</label>
              <select {...register("source_type", { required: "Required" })} className="input" disabled={editMode}>
                <option value="huggingface">Hugging Face</option>
                <option value="s3">AWS S3</option>
                <option value="gcs">Google GCS</option>
                <option value="azure_blob">Azure Blob</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>
            <div>
              <label className="label">Source URI *</label>
              <input {...register("source_uri", { required: "Required" })} className="input font-mono text-sm" placeholder="meta-llama/Meta-Llama-3-70B" disabled={editMode} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Architecture *</label>
              <select {...register("architecture", { required: "Required" })} className="input">
                <option value="Transformer">Transformer</option>
                <option value="MoE">Mixture of Experts (MoE)</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="label">Parameters (B) *</label>
              <input {...register("param_count_b", { required: "Required", min: 0.001, valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="70" />
            </div>
            <div>
              <label className="label">Size at FP32 (GB) *</label>
              <input {...register("size_fp32_gb", { required: "Required", min: 0.1, valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="140" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supported Platforms *</label>
              <div className="flex gap-4 mt-1">
                {["cuda", "rocm", "cpu"].map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value={p} {...register("supported_platforms")} className="rounded border-gray-300 text-brand-600" />
                    <span className="text-sm capitalize">{p.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Supported Backends *</label>
              <div className="flex gap-4 mt-1">
                {["vllm", "sglang", "trtllm"].map((b) => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value={b} {...register("supported_backends")} className="rounded border-gray-300 text-brand-600" />
                    <span className="text-sm">{b}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Tokenizer Path</label>
            <input {...register("tokenizer_path")} className="input font-mono text-sm" placeholder="(leave blank if same as model source)" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} rows={3} className="input" placeholder="Additional details about this model..." />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Saving..." : editMode ? "Update Model" : "Add Model"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
