"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck,
  Eye,
  LogOut,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, login, loginWithRole, logout, error, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setFeedback(null);
    const success = await login(email, password || "secret123");
    setSubmitting(false);

    if (success) {
      setFeedback("Authenticated successfully! Session persisted.");
    }
  };

  const handleRoleSelect = async (targetRole: UserRole) => {
    setSubmitting(true);
    setFeedback(null);
    const success = await loginWithRole(targetRole);
    setSubmitting(false);

    if (success) {
      setFeedback(`Logged in as ${targetRole}! JWT token verified.`);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F6F6] text-[#000000] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-[#CED4DA]/70">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-sm">
            <ShieldAlert className="w-5 h-5 text-[#000000]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#002A54]">UpayAche</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD602]" />
            </div>
            <p className="text-[10px] font-mono text-[#6C757D] uppercase tracking-wider">
              MFS Risk & Intelligence Portal
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="text-xs font-medium text-[#4E4E50] hover:text-[#007BFF] transition-colors hidden sm:inline"
          >
            About Prototype
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0054A6] hover:text-[#007BFF] transition-colors px-3 py-1.5 rounded-xl border border-[#CED4DA] bg-white hover:bg-[#EDF0F3]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Authentication Card Section */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8">
        {/* Left Column: Form & Active Session (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {isAuthenticated && user ? (
            <Card className="border-[#CED4DA] bg-white shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#F6F6F6] bg-emerald-50/50">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Session Active
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs font-bold ${
                      role === "ADMIN"
                        ? "border-purple-300 bg-purple-50 text-purple-700"
                        : role === "ANALYST"
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : role === "CUSTOMER"
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }`}
                  >
                    Role: {role}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-[#002A54] pt-2">{user.full_name}</CardTitle>
                <CardDescription className="text-[#6C757D] font-mono text-xs">
                  {user.email} (ID: {user.id})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-[#4E4E50] leading-relaxed">
                  You are authenticated with an active cryptographic token. Your role controls permissions across investigation cases, state machine transitions, and forensic audit logs.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild className="w-full bg-[#007BFF] hover:bg-[#0054A6] text-white font-semibold rounded-xl h-10 shadow-xs">
                    <Link href="/dashboard">
                      Open Analyst Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full border-[#CED4DA] bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-[#4E4E50] rounded-xl h-10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out & Invalidate Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#CED4DA] bg-white shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="space-y-1 bg-[#F6F6F6]/60 border-b border-[#CED4DA]/50">
                <div className="flex items-center gap-2 text-[#0054A6]">
                  <KeyRound className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">MFS Security Credential</span>
                </div>
                <CardTitle className="text-2xl font-black text-[#002A54] tracking-tight">
                  Sign In to UpayAche
                </CardTitle>
                <CardDescription className="text-[#6C757D] text-xs">
                  Sign in with your enterprise credentials or use the role switcher on the right for instant hackathon evaluation.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {(error || feedback) && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                        error
                          ? "bg-rose-50 border border-rose-200 text-rose-800"
                          : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      }`}
                    >
                      {error ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />}
                      <span>{error || feedback}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#000000]">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@upayache.internal"
                      className="w-full px-3.5 py-2.5 bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-xs font-mono text-[#000000] placeholder:text-[#6C757D] focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#000000]">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-xs font-mono text-[#000000] placeholder:text-[#6C757D] focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || isLoading}
                    className="w-full bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs rounded-xl h-11 shadow-sm transition-all"
                  >
                    {submitting ? "Authenticating Token..." : "Sign In to Portal"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Compliance Card */}
          <div className="p-4 rounded-2xl border border-[#CED4DA] bg-white text-xs text-[#4E4E50] space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#002A54] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Trust Security Controls</span>
            </div>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-[#6C757D]">
              <li>No administrative service-role secret key exposed in browser.</li>
              <li>Row Level Security (RLS) & strict role-based access control (RBAC).</li>
              <li>Immutable, append-only audit trail on all privileged operations.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: One-Click Demo Role Switcher (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#0054A6] border border-[#BFDBFE]">
              <Sparkles className="w-3 h-3 text-[#007BFF]" />
              Evaluation Sandbox
            </span>
            <h3 className="text-xl font-extrabold text-[#002A54] tracking-tight">
              One-Click Role Switcher
            </h3>
            <p className="text-xs text-[#6C757D]">
              Switch roles instantly to inspect access control, RLS boundaries, and feature authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. ADMIN Card */}
            <div
              onClick={() => handleRoleSelect("ADMIN")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                role === "ADMIN"
                  ? "border-[#007BFF] bg-blue-50/60 shadow-md ring-2 ring-[#007BFF]/30"
                  : "border-[#CED4DA] bg-white hover:border-[#007BFF]/60 hover:bg-[#F6F6F6] shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-[#002A54]">ADMIN</span>
                </div>
                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 font-mono text-[10px]">
                  Full Access
                </Badge>
              </div>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Full system privileges. Tune model thresholds, inspect all audit logs, reopen cases, and manage users.
              </p>
            </div>

            {/* 2. ANALYST Card */}
            <div
              onClick={() => handleRoleSelect("ANALYST")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                role === "ANALYST"
                  ? "border-[#007BFF] bg-blue-50/60 shadow-md ring-2 ring-[#007BFF]/30"
                  : "border-[#CED4DA] bg-white hover:border-[#007BFF]/60 hover:bg-[#F6F6F6] shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#0054A6] font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-[#002A54]">ANALYST</span>
                </div>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#0054A6] font-mono text-[10px]">
                  Primary Operator
                </Badge>
              </div>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Operational fraud investigator. Triage alerts, manage cases (OPEN → INVESTIGATING → REVIEWED), and invoke Gemini Copilot.
              </p>
            </div>

            {/* 3. VIEWER Card */}
            <div
              onClick={() => handleRoleSelect("VIEWER")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                role === "VIEWER"
                  ? "border-[#007BFF] bg-blue-50/60 shadow-md ring-2 ring-[#007BFF]/30"
                  : "border-[#CED4DA] bg-white hover:border-[#007BFF]/60 hover:bg-[#F6F6F6] shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-[#002A54]">VIEWER</span>
                </div>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 font-mono text-[10px]">
                  Read-Only
                </Badge>
              </div>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                Auditor access. View transactions, metrics, and 3D network visualizations. Strictly blocked from mutating cases or notes.
              </p>
            </div>

            {/* 4. CUSTOMER Card */}
            <div
              onClick={() => handleRoleSelect("CUSTOMER")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                role === "CUSTOMER"
                  ? "border-[#007BFF] bg-blue-50/60 shadow-md ring-2 ring-[#007BFF]/30"
                  : "border-[#CED4DA] bg-white hover:border-[#007BFF]/60 hover:bg-[#F6F6F6] shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-[#002A54]">CUSTOMER</span>
                </div>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-mono text-[10px]">
                  Public AI User
                </Badge>
              </div>
              <p className="text-xs text-[#4E4E50] leading-relaxed">
                End-user consumer. Strictly restricted to own AI Assistant sessions. Forbidden from accessing ledger, network, or cases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-[#6C757D] py-4 border-t border-[#CED4DA]/70">
        UpayAche • AI-Powered MFS Risk & Scam Intelligence • DIU CPC × upay AI Hackathon 2026 Prototype
      </footer>
    </main>
  );
}
