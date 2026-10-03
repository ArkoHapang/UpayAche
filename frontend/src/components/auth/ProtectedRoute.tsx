"use client";

import React from "react";
import Link from "next/link";
import { useAuth, UserRole } from "@/context/AuthContext";
import { ShieldAlert, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, role } = useAuth();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="flex items-center gap-3 p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-medium tracking-wide">
            Verifying Supabase cryptographic session...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (401)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-900/40 bg-slate-900/80 shadow-2xl backdrop-blur-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="border-rose-500/30 bg-rose-950/40 text-rose-400 font-mono text-xs">
              401 Unauthenticated
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Authentication Required
            </h2>
            <p className="text-sm text-slate-400">
              Access to the UpayAche MFS risk engine and forensic ledger requires an active, authenticated Supabase JWT session.
            </p>
          </div>

          <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-600/25">
            <Link href="/login">
              Proceed to Secure Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // 3. Unauthorized Role State (403 Forbidden)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-amber-900/40 bg-slate-900/80 shadow-2xl backdrop-blur-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-950/40 text-amber-400 font-mono text-xs">
              403 Forbidden — Insufficient Clearance
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Access Restricted
            </h2>
            <p className="text-sm text-slate-400">
              Your active role <span className="font-mono text-amber-300 font-semibold">{role}</span> does not have clearance for this operation.
            </p>
            <p className="text-xs text-slate-500">
              Required role(s): {allowedRoles.join(" or ")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800">
              <Link href="/login">
                Switch Role in Demo Portal
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
              <Link href="/">
                Return to Landing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Access (200)
  return <>{children}</>;
};
