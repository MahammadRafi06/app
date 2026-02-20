"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Activity, Clock, Shield } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/queryClient";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils";

type PermMatrix = { group_name: string; permissions: Record<string, Record<string, boolean>> }[];

const PAGES = ["clusters", "deployments", "models", "nodes", "gpus", "audit"];
const ACTIONS = ["list", "view", "create", "edit", "delete"];
const GROUPS = ["admin", "manager", "developer"];

export default function AdminPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"permissions" | "sessions" | "health" | "audit">("permissions");

  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: QUERY_KEYS.adminGroups(),
    queryFn: async () => {
      const resp = await api.get("/api/admin/groups");
      return extractData<PermMatrix>(resp);
    },
    staleTime: STALE_TIMES.admin,
  });

  const togglePermission = useMutation({
    mutationFn: async ({ group, page, action, enabled }: { group: string; page: string; action: string; enabled: boolean }) => {
      await api.put("/api/admin/groups/permissions", { group_name: group, page, action, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGroups() });
    },
    onError: () => {
      showError("Error", "Failed to update permission.");
    },
  });

  const handleToggle = useCallback(
    (group: string, page: string, action: string, currentValue: boolean) => {
      if (group === "admin") return;
      togglePermission.mutate({ group, page, action, enabled: !currentValue });
    },
    [togglePermission]
  );

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: QUERY_KEYS.adminSessions(),
    queryFn: async () => {
      const resp = await api.get("/api/admin/sessions");
      return extractData<{ session_id: string; user_email: string; user_name: string; last_activity_at: string; ip_address: string }[]>(resp);
    },
    enabled: activeTab === "sessions",
    staleTime: 30 * 1000,
  });

  const { data: health } = useQuery({
    queryKey: QUERY_KEYS.adminHealth(),
    queryFn: async () => {
      const resp = await api.get("/api/admin/health");
      return extractData<{ status: string; database: string; redis: string; active_sse_connections: number; cache_hit_rate: number; avg_api_response_ms: number }>(resp);
    },
    enabled: activeTab === "health",
    refetchInterval: 30 * 1000,
  });

  const { data: auditLogs } = useQuery({
    queryKey: QUERY_KEYS.auditLogs(),
    queryFn: async () => {
      const resp = await api.get("/api/audit/logs", { params: { page: 1, page_size: 50 } });
      return extractData<{ id: string; user_id: string; action: string; resource_type: string; created_at: string }[]>(resp);
    },
    enabled: activeTab === "audit",
    staleTime: 60 * 1000,
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (sid: string) => api.delete(`/api/admin/sessions/${sid}`),
    onSuccess: () => {
      success("Session terminated", "User has been logged out.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminSessions() });
    },
  });

  const tabs = [
    { id: "permissions", label: "Permissions", icon: Shield },
    { id: "sessions", label: "Active Sessions", icon: Users },
    { id: "health", label: "System Health", icon: Activity },
    { id: "audit", label: "Audit Logs", icon: Clock },
  ] as const;

  const permMatrix = permsData || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Platform administration and configuration</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "permissions" && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Group Permission Matrix</h2>
            <p className="text-sm text-gray-500">Toggle permissions for each group. Admin permissions are fixed.</p>
          </div>
          {permsLoading ? (
            <div className="p-6">
              <div className="skeleton h-64 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header w-32">Group / Page</th>
                    {PAGES.map((page) => (
                      <th key={page} colSpan={ACTIONS.length} className="table-header text-center border-l border-gray-200">
                        {page}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="table-header" />
                    {PAGES.map((page) =>
                      ACTIONS.map((action) => (
                        <th key={`${page}-${action}`} className="table-header text-center text-xs normal-case font-medium text-gray-400">
                          {action}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {GROUPS.map((group) => {
                    const groupPerms = permMatrix.find((g) => g.group_name === group)?.permissions || {};
                    return (
                      <tr key={group} className="hover:bg-gray-50">
                        <td className="table-cell font-medium capitalize">
                          <span className={`badge ${group === "admin" ? "badge-red" : group === "manager" ? "badge-blue" : "badge-gray"}`}>
                            {group}
                          </span>
                        </td>
                        {PAGES.map((page) =>
                          ACTIONS.map((action) => {
                            const enabled = groupPerms[page]?.[action] ?? false;
                            const isAdmin = group === "admin";
                            return (
                              <td key={`${page}-${action}`} className="table-cell text-center">
                                <button
                                  type="button"
                                  disabled={isAdmin}
                                  onClick={() => handleToggle(group, page, action, enabled)}
                                  className={`w-6 h-6 rounded mx-auto flex items-center justify-center transition-colors ${
                                    isAdmin
                                      ? "bg-green-100 text-green-700 cursor-not-allowed"
                                      : enabled
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                  title={isAdmin ? "Admin always has all permissions" : `Toggle ${action} on ${page}`}
                                >
                                  {enabled || isAdmin ? "✓" : "✗"}
                                </button>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Active Sessions</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">IP Address</th>
                <th className="table-header">Last Activity</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(sessions || []).map((s) => (
                <tr key={s.session_id}>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{s.user_name || s.user_email}</p>
                      <p className="text-xs text-gray-500">{s.user_email}</p>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{s.ip_address || "—"}</td>
                  <td className="table-cell text-xs text-gray-500">{formatRelativeTime(s.last_activity_at)}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => forceLogoutMutation.mutate(s.session_id)}
                      className="btn-danger text-xs py-1 px-2"
                    >
                      Force Logout
                    </button>
                  </td>
                </tr>
              ))}
              {!sessionsLoading && (!sessions || sessions.length === 0) && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">No active sessions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-sm text-gray-500">Database</p>
              <p className={`text-xl font-bold mt-1 capitalize ${health?.database === "healthy" ? "text-green-600" : "text-red-600"}`}>
                {health?.database || "—"}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Redis</p>
              <p className={`text-xl font-bold mt-1 capitalize ${health?.redis === "healthy" ? "text-green-600" : "text-red-600"}`}>
                {health?.redis || "—"}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">SSE Connections</p>
              <p className="text-xl font-bold mt-1 text-blue-600">{health?.active_sse_connections ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Cache Hit Rate</p>
              <p className="text-xl font-bold mt-1 text-green-600">{health?.cache_hit_rate ? `${(health.cache_hit_rate * 100).toFixed(0)}%` : "—"}</p>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Avg API Response Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{health?.avg_api_response_ms ? `${health.avg_api_response_ms.toFixed(1)}ms` : "—"}</p>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
            <h2 className="font-semibold text-gray-900">Audit Logs</h2>
            <a href="/api/audit/export?format=csv" className="btn-secondary gap-2 text-sm">
              Export CSV
            </a>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Action</th>
                <th className="table-header">Resource</th>
                <th className="table-header">User</th>
                <th className="table-header">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(auditLogs || []).map((log) => (
                <tr key={log.id}>
                  <td className="table-cell"><span className="badge badge-blue">{log.action}</span></td>
                  <td className="table-cell"><span className="badge badge-gray">{log.resource_type}</span></td>
                  <td className="table-cell font-mono text-xs">{log.user_id.slice(0, 8)}...</td>
                  <td className="table-cell text-xs text-gray-500">{formatRelativeTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
