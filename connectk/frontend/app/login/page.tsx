import Link from "next/link";
import { Activity } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4 shadow-lg shadow-brand-600/30">
            <Activity className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ConnectK</h1>
          <p className="text-blue-300 mt-1 text-sm">Multi-Cloud AI Infrastructure Platform</p>
        </div>

        {/* Login card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to your account</h2>
          <p className="text-blue-300 text-sm mb-8">
            Use your enterprise Microsoft account to access the platform.
          </p>

          <a
            href="/api/auth/login"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MicrosoftLogo />
            Continue with Microsoft
          </a>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Single Sign-On via Azure Entra ID
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              PKCE-secured OAuth 2.0 flow
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Role-based access via Entra groups
            </div>
          </div>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          ConnectK v2.0 · Internal Use Only
        </p>
      </div>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
