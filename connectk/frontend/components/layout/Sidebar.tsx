"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Server,
  Cpu,
  Zap,
  Rocket,
  Package,
  User,
  Settings,
  LayoutGrid,
  Layers,
  Wrench,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/queryClient";
import api, { extractData } from "@/lib/api";
import { UserProfile } from "@/types";
import { useState } from "react";
import axios from "axios";

const NAV_ITEMS = [
  { href: "/clusters", label: "Clusters", icon: Server },
  { href: "/nodes", label: "Nodes", icon: Cpu },
  { href: "/gpus", label: "GPUs", icon: Zap },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/models", label: "Model Registry", icon: Package },
  { href: "/applications", label: "Applications", icon: LayoutGrid },
  { href: "/applicationsets", label: "AppSets", icon: Layers },
  { href: "/argocd-settings", label: "ArgoCD Settings", icon: Wrench },
  { href: "/user-info", label: "ArgoCD User", icon: UserCircle },
  { href: "/profile", label: "Profile", icon: User },
];

const ADMIN_NAV = { href: "/admin", label: "Admin", icon: Settings };

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.me(),
    queryFn: async () => {
      const resp = await api.get("/api/auth/me");
      return extractData<UserProfile>(resp);
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const handleLogout = async () => {
    const resp = await api.post("/api/auth/logout");
    const logoutUrl = resp.data?.logout_url;
    if (logoutUrl) window.location.href = logoutUrl;
    else window.location.href = "/login";
  };

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.connectk_group === "admin" ? [ADMIN_NAV] : []),
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar-bg transition-all duration-200 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-white/10", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm">ConnectK</p>
            <p className="text-sidebar-text text-xs">AI Infrastructure</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 sidebar-nav">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-sidebar-text group-hover:text-white")} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-sidebar-text text-xs capitalize">{user.connectk_group}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center hover:bg-gray-300 transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
        )}
      </button>
    </aside>
  );
}
