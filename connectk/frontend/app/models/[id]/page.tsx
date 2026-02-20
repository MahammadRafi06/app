"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { AIModel } from "@/types";

export default function ModelDetailPage() {
  const params = useParams<{ id: string }>();
  const modelId = params.id;

  const { data: model, isLoading } = useQuery({
    queryKey: QUERY_KEYS.model(modelId),
    queryFn: async () => {
      const resp = await api.get(`/api/models/${modelId}`);
      return extractData<AIModel>(resp);
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading model...</p>;
  if (!model) return <p className="text-sm text-red-600">Model not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{model.custom_name || model.name}</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{model.name}</p>
        </div>
        <Link href={`/models/${model.id}/edit`} className="btn-secondary text-sm">Edit</Link>
      </div>

      <div className="card p-4 space-y-2">
        <p className="text-sm text-gray-700">Architecture: {model.architecture}</p>
        <p className="text-sm text-gray-700">Parameters: {model.param_count_b}B</p>
        <p className="text-sm text-gray-700">FP32 Size: {model.size_fp32_gb} GB</p>
        <p className="text-sm text-gray-700">Source: {model.source_type} · {model.source_uri}</p>
        <p className="text-sm text-gray-700">Backends: {model.supported_backends.join(", ") || "None"}</p>
      </div>
    </div>
  );
}
