"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LogIn, LogOut, FolderLock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-[#003D7A] bg-[#002A54]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-md shadow-[#FFD602]/20">
            <ShieldAlert className="w-5 h-5 text-[#000000]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                UpayAche
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD602]" />
            </div>
            <p className="text-[10px] font-mono text-[#EDF0F3]/70 uppercase tracking-wider">
              MFS Risk Intelligence
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors"
              >
                <span>Dashboard</span>
              </Link>
              <Link
                href="/investigations"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors"
              >
                <FolderLock className="w-3.5 h-3.5 text-[#FFD602]" />
                <span>Investigations</span>
              </Link>
              <Link
                href="/analytics"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors"
              >
                <span>Analytics</span>
              </Link>
              <Link
                href="/models"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors"
              >
                <span>Models</span>
              </Link>
              <Link
                href="/design-system"
                className="text-xs font-mono text-[#FFD602] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Design System</span>
              </Link>

              <Badge
                variant="outline"
                className={`font-mono text-xs px-2.5 py-0.5 border ${
                  role === "ADMIN"
                    ? "border-purple-400/40 bg-purple-950/40 text-purple-300"
                    : role === "ANALYST"
                    ? "border-[#FFD602]/50 bg-[#FFD602]/15 text-[#FFD602]"
                    : "border-emerald-400/40 bg-emerald-950/40 text-emerald-300"
                }`}
              >
                {role}
              </Badge>

              <span className="text-xs text-[#EDF0F3]/70 hidden sm:inline-block font-mono">
                {user.email.split("@")[0]}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-[#EDF0F3]/70 hover:text-[#DC2626] hover:bg-[#DC2626]/10 text-xs h-8 px-2"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/about"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors hidden md:flex"
              >
                <span>About</span>
              </Link>
              <Link
                href="/help"
                className="text-xs font-mono text-[#EDF0F3] hover:text-[#FFD602] flex items-center gap-1.5 transition-colors hidden sm:flex"
              >
                <span>Help</span>
              </Link>
              <Link
                href="/design-system"
                className="text-xs font-mono text-[#FFD602] hover:underline flex items-center gap-1.5 transition-colors hidden lg:flex"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Design System</span>
              </Link>
              <Button
                asChild
                size="sm"
                variant="accent"
                className="text-xs h-8 shadow-xs"
              >
                <Link href="/login">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In / Role Demo
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
