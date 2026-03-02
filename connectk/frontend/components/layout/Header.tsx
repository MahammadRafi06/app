"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, RefreshCw } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";

const BREADCRUMB_MAP: Record<string, string> = {
  clusters: "Clusters",
  deployments: "Deployments",
  models: "Model Registry",
  applications: "Applications",
  applicationsets: "ApplicationSets",
  "argocd-settings": "ArgoCD Settings",
  "user-info": "ArgoCD User",
  repositories: "Repositories",
  repos: "Repositories",
  repocreds: "Repo Credentials",
  projects: "Projects",
  accounts: "Accounts",
  gpgkeys: "GPG Keys",
  nodes: "Nodes",
  gpus: "GPUs",
  profile: "Profile",
  admin: "Admin",
};

export function Header() {
  const pathname = usePathname();
  const { connected } = useSSE();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-400">/</span>}
            <span className={i === crumbs.length - 1 ? "text-gray-900 font-semibold" : "text-gray-500"}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* SSE connection status */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 pulse-dot" : "bg-gray-300"}`}
          />
          <span className="hidden sm:inline">{connected ? "Live" : "Offline"}</span>
        </div>

        <button className="btn-ghost p-2" title="Search">
          <Search className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2 relative" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
