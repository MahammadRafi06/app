"use client";

import { useEffect } from "react";
import { Activity } from "lucide-react";

export default function CallbackPage() {
  useEffect(() => {
    // The backend handles the actual OIDC callback redirect
    // This page shows if the user lands here directly
    window.location.href = "/clusters";
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
          <Activity className="w-9 h-9 text-white animate-spin" />
        </div>
        <p className="text-white text-lg font-medium">Completing sign-in...</p>
        <p className="text-blue-300 text-sm mt-2">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}
