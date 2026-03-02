import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy HH:mm");
  } catch {
    return String(date);
  }
}

export function formatRelativeDate(date: string | Date | undefined): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return String(date);
  }
}

export function truncate(str: string, maxLength = 40): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

export function repoUrlToDisplayName(url: string): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, "").replace(/\.git$/, "");
  } catch {
    // SSH URL like git@github.com:org/repo.git
    const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    return match ? match[1] : url;
  }
}

export function parseLabels(labels: Record<string, string> | undefined): string[] {
  if (!labels) return [];
  return Object.entries(labels).map(([k, v]) => `${k}=${v}`);
}

export function healthColor(health: string | undefined): string {
  switch (health) {
    case "Healthy": return "text-emerald-500";
    case "Degraded": return "text-red-500";
    case "Progressing": return "text-blue-500";
    case "Suspended": return "text-amber-500";
    case "Missing": return "text-orange-500";
    default: return "text-slate-400";
  }
}

export function syncColor(sync: string | undefined): string {
  switch (sync) {
    case "Synced": return "text-emerald-500";
    case "OutOfSync": return "text-amber-500";
    case "Unknown": return "text-slate-400";
    default: return "text-slate-400";
  }
}

export function operationPhaseColor(phase: string | undefined): string {
  switch (phase) {
    case "Succeeded": return "text-emerald-500";
    case "Failed":
    case "Error": return "text-red-500";
    case "Running":
    case "Progressing": return "text-blue-500";
    case "Terminating": return "text-orange-500";
    default: return "text-slate-400";
  }
}

export function healthBgColor(health: string | undefined): string {
  switch (health) {
    case "Healthy": return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400";
    case "Degraded": return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 dark:text-red-400";
    case "Progressing": return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400";
    case "Suspended": return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400";
    case "Missing": return "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800 dark:text-orange-400";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-400";
  }
}

export function syncBgColor(sync: string | undefined): string {
  switch (sync) {
    case "Synced": return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400";
    case "OutOfSync": return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-400";
  }
}

export function phaseBgColor(phase: string | undefined): string {
  switch (phase) {
    case "Succeeded": return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400";
    case "Failed":
    case "Error": return "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400";
    case "Running":
    case "Progressing": return "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400";
  }
}

export function buildQueryString(params: Record<string, string | string[] | boolean | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, v));
    } else {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
