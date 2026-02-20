import { cn, getStatusColor, getProviderColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={cn(color, className)}>
      {status === "running" || status === "active" || status === "Active" || status === "Ready" ? (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 pulse-dot" />
      ) : null}
      {label}
    </span>
  );
}

export function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={cn(getProviderColor(provider), "badge")}>
      {provider}
    </span>
  );
}
