"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FolderLock,
  Network,
  BarChart3,
  Cpu,
  Settings,
  User,
  LogOut,
  ShieldAlert,
  Palette,
  HelpCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "critical" | "warning";
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Investigations", href: "/investigations", icon: FolderLock, badge: "3" },
  { label: "Network", href: "/network", icon: Network },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Models", href: "/models", icon: Cpu },
  { label: "Design System", href: "/design-system", icon: Palette },
];

const bottomNavItems: NavItem[] = [
  { label: "Help & Knowledge", href: "/help", icon: HelpCircle },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "About UpayAche", href: "/about", icon: Info },
];

interface SidebarProps {
  currentPath?: string;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  collapsed?: boolean;
  isMobile?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  userRole = "ANALYST",
  userName = "Forensic Analyst",
  onLogout,
  collapsed = false,
  isMobile = false,
  className = "",
}) => {
  const pathname = usePathname() || currentPath || "/";

  const baseClasses = isMobile
    ? "flex flex-col justify-between w-full h-full bg-[#002A54] text-[#EDF0F3] z-30 overflow-y-auto"
    : `hidden md:flex flex-col justify-between shrink-0 border-r border-[#003D7A] bg-[#002A54] text-[#EDF0F3] transition-all duration-200 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`;

  return (
    <aside
      className={cn(baseClasses, className)}
      aria-label={isMobile ? "Mobile Navigation Drawer" : "Desktop Navigation Sidebar"}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#003D7A]">
          <div className="w-9 h-9 rounded-xl bg-[#FFD602] text-[#000000] flex items-center justify-center font-bold shadow-md shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#000000]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                UpayAche
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD602]" />
              </span>
              <span className="text-[10px] font-mono text-[#EDF0F3]/70 tracking-wider uppercase">
                Risk Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Main Navigation Section */}
        <div className="p-3 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 text-[10px] font-mono font-semibold text-[#EDF0F3]/60 uppercase tracking-wider">
              Forensic Modules
            </div>
          )}
          <nav className="space-y-1" aria-label="Main Navigation">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD602]",
                    isActive
                      ? "bg-[#FFD602] text-[#000000] shadow-sm shadow-[#FFD602]/20"
                      : "text-[#EDF0F3] hover:text-white hover:bg-[#003D7A]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-[#000000]"
                        : "text-[#EDF0F3]/70 group-hover:text-[#FFD602]"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        isActive
                          ? "bg-[#000000] text-[#FFD602]"
                          : "bg-[#FFD602]/20 text-[#FFD602] border border-[#FFD602]/30"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Settings, Profile, Logout */}
      <div className="p-3 border-t border-[#003D7A] space-y-2">
        {!collapsed && (
          <div className="px-3 py-1 text-[10px] font-mono font-semibold text-[#EDF0F3]/60 uppercase tracking-wider">
            Account & System
          </div>
        )}

        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD602]",
                  isActive
                    ? "bg-[#FFD602] text-[#000000] font-semibold"
                    : "text-[#EDF0F3] hover:text-white hover:bg-[#003D7A]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[#000000]"
                      : "text-[#EDF0F3]/70 group-hover:text-[#FFD602]"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#EDF0F3]/70 hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-[#DC2626]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* User Card Mini */}
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-[#001B36] border border-[#003D7A] flex items-center justify-between mt-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-[#FFD602] text-[#000000] font-bold text-xs flex items-center justify-center shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium text-white truncate">
                  {userName}
                </span>
                <span className="text-[10px] font-mono text-[#EDF0F3]/70 truncate">
                  {userRole}
                </span>
              </div>
            </div>
            <span
              className="w-2 h-2 rounded-full bg-[#10B981] shrink-0"
              title="Active Session"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
