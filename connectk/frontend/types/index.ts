// Core API Response Types
export interface ApiMeta {
  request_id: string;
  timestamp: string;
  cache_hit?: boolean;
  cache_age_seconds?: number | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  meta: ApiMeta;
  pagination?: PaginationMeta;
  kpis?: Record<string, unknown>;
}

export interface ApiError {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: string;
    field?: string;
  };
  meta: ApiMeta;
}

// Auth
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  groups: string[];
  roles: string[];
  connectk_group: "admin" | "manager" | "developer";
  accessible_cluster_ids: string[];
  permissions: Record<string, string[]>;
}

// Cluster
export type CloudProvider = "GKE" | "AKS" | "EKS";
export type ClusterStatus = "active" | "pending" | "unreachable";
export type GitOpsTool = "argocd" | "fluxcd";

export interface Cluster {
  id: string;
  name: string;
  provider: CloudProvider;
  region: string;
  k8s_version: string | null;
  node_count: number;
  gpu_count: number;
  active_models: number;
  utilization_pct: number;
  status: ClusterStatus;
  kubeapi_endpoint: string;
  gitops_tool: GitOpsTool;
  gitops_repo_url: string;
  gitops_branch: string;
  cache_ttl_seconds: number;
  created_at: string;
  updated_at: string;
  last_cache_refresh?: string | null;
}

export interface ClusterKPIs {
  total_clusters: number;
  total_nodes: number;
  total_gpus: number;
  avg_utilization_pct: number;
  active_deployments: number;
  est_monthly_cost_usd: number;
}

export interface ClusterCreatePayload {
  name: string;
  provider: CloudProvider;
  region: string;
  kubeapi_endpoint: string;
  auth_config: Record<string, string>;
  gitops_tool: GitOpsTool;
  gitops_repo_url: string;
  gitops_branch: string;
  cache_ttl_seconds: number;
}

// Deployment
export type DeploymentStatus =
  | "creating" | "provisioning" | "running" | "updating"
  | "degraded" | "failed" | "deleting" | "deleted" | "delete_failed" | "rolling_back";

export type DeploymentBackend = "sglang" | "vllm" | "trtllm";
export type DeploymentType = "aggregated" | "aggregated_route" | "disaggregated_route";

export interface Deployment {
  id: string;
  name: string;
  cluster_id: string;
  cluster_name: string;
  cluster_provider: string;
  cluster_region: string;
  namespace: string;
  model_id: string;
  model_name: string;
  backend: DeploymentBackend;
  deployment_type: DeploymentType;
  replicas: number;
  gpu_per_replica: number;
  quantization: string | null;
  kv_cache_gb: number | null;
  max_batch_size: number | null;
  runtime_optimizations: string[];
  gitops_commit_sha: string | null;
  status: DeploymentStatus;
  status_message: string | null;
  status_changed_at: string | null;
  owner_id: string;
  latency_p50_ms?: number | null;
  latency_p95_ms?: number | null;
  latency_p99_ms?: number | null;
  throughput_tps?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentKPIs {
  total_deployments: number;
  total_models_in_use: number;
  top_used_model: string | null;
  avg_latency_ms: number;
  avg_throughput_tps: number;
  est_total_cost_usd: number;
}

export interface DeploymentCreatePayload {
  name: string;
  cluster_id: string;
  namespace: string;
  model_id: string;
  backend: DeploymentBackend;
  deployment_type: DeploymentType;
  replicas: number;
  gpu_per_replica: number;
  quantization?: string;
  kv_cache_gb?: number;
  max_batch_size?: number;
  runtime_optimizations: string[];
}

// Model
export type ModelSourceType = "huggingface" | "s3" | "gcs" | "azure_blob" | "custom";

export interface AIModel {
  id: string;
  name: string;
  custom_name: string | null;
  source_type: ModelSourceType;
  source_uri: string;
  architecture: string;
  param_count_b: number;
  size_fp32_gb: number;
  supported_platforms: string[];
  supported_backends: string[];
  tokenizer_path: string | null;
  description: string | null;
  is_active: boolean;
  active_deployments: number;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelKPIs {
  total_models: number;
  most_deployed_model: string | null;
  model_sources: Record<string, number>;
  avg_model_size_gb: number;
}

// Node
export interface Node {
  id: string;
  name: string;
  cluster_id: string;
  cluster_name: string;
  provider: string;
  os: string;
  instance_type: string;
  cpu_cores: number;
  memory_gb: number;
  gpu_count: number;
  gpu_model: string | null;
  utilization_pct: number;
  status: string;
  cost_per_hour: number;
  kubelet_version: string;
  internal_ip: string;
}

export interface NodeKPIs {
  total_nodes: number;
  total_cpus: number;
  total_gpus: number;
  avg_utilization_pct: number;
  nodes_with_gpu: number;
  est_hourly_cost: number;
}

export interface GPU {
  id: string;
  node_name: string;
  cluster_name: string;
  provider: string;
  gpu_model: string;
  vram_gb: number;
  utilization_pct: number;
  temperature_c: number | null;
  power_draw_w: number | null;
  assigned_workload: string | null;
  status: string;
}

export interface GPUKPIs {
  total_gpus: number;
  gpu_models_in_use: number;
  avg_utilization_pct: number;
  total_vram_tb: number;
  gpus_available: number;
  est_gpu_cost_per_hour: number;
}

// Admin
export interface GroupPermission {
  id: string;
  group_name: string;
  page: string;
  action: string;
  enabled: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// SSE Events
export type SSEEventType =
  | "deployment.status_changed"
  | "deployment.metrics_updated"
  | "cluster.connectivity_changed"
  | "cluster.cache_refreshed"
  | "node.status_changed"
  | "system.maintenance";

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// Query Params
export interface PaginationParams {
  page?: number;
  page_size?: number;
}
