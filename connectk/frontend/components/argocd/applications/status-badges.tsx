import { cn } from "@/lib/utils";
import { healthBgColor, syncBgColor, phaseBgColor } from "@/lib/argocd-utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Minus,
} from "lucide-react";

// ─── Health Badge ─────────────────────────────────────────────────────────────

const healthIcons: Record<string, React.ElementType> = {
  Healthy: CheckCircle2,
  Degraded: XCircle,
  Progressing: RefreshCw,
  Suspended: PauseCircle,
  Missing: AlertCircle,
  Unknown: HelpCircle,
};

interface HealthBadgeProps {
  status?: string;
  showIcon?: boolean;
  className?: string;
}

export function HealthBadge({ status, showIcon = true, className }: HealthBadgeProps) {
  const label = status ?? "Unknown";
  const Icon = healthIcons[label] ?? HelpCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        healthBgColor(label),
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            "h-3 w-3 shrink-0",
            label === "Progressing" && "animate-spin"
          )}
        />
      )}
      {label}
    </span>
  );
}

// ─── Sync Badge ───────────────────────────────────────────────────────────────

const syncIcons: Record<string, React.ElementType> = {
  Synced: CheckCircle2,
  OutOfSync: AlertCircle,
  Unknown: HelpCircle,
};

interface SyncBadgeProps {
  status?: string;
  showIcon?: boolean;
  className?: string;
}

export function SyncBadge({ status, showIcon = true, className }: SyncBadgeProps) {
  const label = status ?? "Unknown";
  const Icon = syncIcons[label] ?? HelpCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        syncBgColor(label),
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

interface PhaseBadgeProps {
  phase?: string;
  className?: string;
}

export function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  if (!phase) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        phaseBgColor(phase),
        className
      )}
    >
      {phase === "Running" && <RefreshCw className="h-3 w-3 animate-spin" />}
      {phase}
    </span>
  );
}

// ─── Connection Badge ─────────────────────────────────────────────────────────

interface ConnectionBadgeProps {
  status?: string;
  className?: string;
}

export function ConnectionBadge({ status, className }: ConnectionBadgeProps) {
  const isSuccessful = status === "Successful";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        isSuccessful
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800",
        className
      )}
    >
      {isSuccessful ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {status ?? "Unknown"}
    </span>
  );
}

// ─── Dot Indicator ────────────────────────────────────────────────────────────

interface DotProps {
  health?: string;
  className?: string;
}

const dotColors: Record<string, string> = {
  Healthy: "bg-emerald-500",
  Degraded: "bg-red-500",
  Progressing: "bg-blue-500",
  Suspended: "bg-amber-500",
  Missing: "bg-orange-500",
  Unknown: "bg-slate-400",
};

export function StatusDot({ health, className }: DotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        dotColors[health ?? "Unknown"] ?? "bg-slate-400",
        health === "Progressing" && "animate-pulse",
        className
      )}
    />
  );
}
