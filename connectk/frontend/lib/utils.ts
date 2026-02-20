import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeploymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatBytes(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
}

export function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    running: "badge-green",
    active: "badge-green",
    Ready: "badge-green",
    Active: "badge-green",
    creating: "badge-blue",
    provisioning: "badge-blue",
    updating: "badge-blue",
    rolling_back: "badge-yellow",
    degraded: "badge-yellow",
    pending: "badge-yellow",
    unreachable: "badge-red",
    failed: "badge-red",
    delete_failed: "badge-red",
    deleting: "badge-gray",
    deleted: "badge-gray",
  };
  return statusMap[status] || "badge-gray";
}

export function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    GKE: "🟦",
    AKS: "🔷",
    EKS: "🟧",
  };
  return icons[provider] || "☁️";
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    GKE: "badge-blue",
    AKS: "badge-purple",
    EKS: "badge-yellow",
  };
  return colors[provider] || "badge-gray";
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  creating: "Creating",
  provisioning: "Provisioning",
  running: "Running",
  updating: "Updating",
  degraded: "Degraded",
  failed: "Failed",
  deleting: "Deleting",
  deleted: "Deleted",
  delete_failed: "Delete Failed",
  rolling_back: "Rolling Back",
};

export const BACKEND_LABELS: Record<string, string> = {
  sglang: "SGLang",
  vllm: "vLLM",
  trtllm: "TensorRT-LLM",
};

export const DEPLOYMENT_TYPE_LABELS: Record<string, string> = {
  aggregated: "Aggregated",
  aggregated_route: "Aggregated + Route",
  disaggregated_route: "Disaggregated + Route",
};
