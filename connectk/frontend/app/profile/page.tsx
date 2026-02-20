"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Shield, Server, LogOut } from "lucide-react";
import api, { extractData } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryClient";
import { UserProfile } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils";

interface SessionInfo {
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity_at: string;
}

export default function ProfilePage() {
  const { success } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: QUERY_KEYS.me(),
    queryFn: async () => {
      const resp = await api.get("/api/auth/me");
      return extractData<UserProfile>(resp);
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: sessions } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const resp = await api.get("/api/auth/sessions");
      return extractData<SessionInfo[]>(resp);
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sid: string) => api.delete(`/api/admin/sessions/${sid}`),
    onSuccess: () => {
      success("Session revoked");
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32" />
        <div className="card p-6"><div className="skeleton h-40 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account information and session management</p>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`badge ${user?.connectk_group === "admin" ? "badge-red" : user?.connectk_group === "manager" ? "badge-blue" : "badge-gray"} capitalize`}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.connectk_group}
              </span>
            </div>
          </div>
        </div>
      </div>

      {user?.groups && user.groups.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Entra ID Groups
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.groups.map((g) => (
              <span key={g} className="badge badge-blue font-mono text-xs">{g}</span>
            ))}
          </div>
        </div>
      )}

      {user?.permissions && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            Your Permissions
          </h3>
          <div className="space-y-2">
            {Object.entries(user.permissions).map(([page, actions]) => (
              <div key={page} className="flex items-center gap-3">
                <span className="w-28 text-sm font-medium text-gray-700 capitalize">{page}</span>
                <div className="flex flex-wrap gap-1">
                  {(actions as string[]).map((a) => (
                    <span key={a} className="badge badge-green text-xs">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-gray-500" />
          Active Sessions
        </h3>
        <div className="space-y-3">
          {(sessions || []).map((s) => (
            <div key={s.session_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">IP: {s.ip_address || "Unknown"}</p>
                <p className="text-xs text-gray-500">Last active: {formatRelativeTime(s.last_activity_at)}</p>
              </div>
              <button
                onClick={() => revokeSessionMutation.mutate(s.session_id)}
                className="btn-secondary gap-2 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Revoke
              </button>
            </div>
          ))}
          {(!sessions || sessions.length === 0) && (
            <p className="text-sm text-gray-500">No active sessions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
