"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { AIModel } from "@/types";
import { ModelForm } from "@/components/models/ModelForm";
import { useToast } from "@/components/ui/Toast";

export default function EditModelPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const modelId = params.id;
  const { success } = useToast();

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
    <ModelForm
      editMode
      modelId={modelId}
      defaultValues={{
        name: model.name,
        custom_name: model.custom_name || undefined,
        source_type: model.source_type,
        source_uri: model.source_uri,
        architecture: model.architecture,
        param_count_b: model.param_count_b,
        size_fp32_gb: model.size_fp32_gb,
        supported_platforms: model.supported_platforms,
        supported_backends: model.supported_backends,
        tokenizer_path: model.tokenizer_path || undefined,
        description: model.description || undefined,
      }}
      onClose={() => router.push(`/models/${modelId}`)}
      onSuccess={() => {
        success("Model updated", "Model metadata has been updated.");
        router.push(`/models/${modelId}`);
      }}
    />
  );
}
