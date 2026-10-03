"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ArrowLeftRight,
  FolderLock,
  Network,
  MoreHorizontal,
} from "lucide-react";

interface MobileBottomNavProps {
  onMoreClick?: () => void;
  investigationBadge?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onMoreClick,
  investigationBadge = 3,
}) => {
  const pathname = usePathname() || "/";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    {
      label: "Investigations",
      href: "/investigations",
      icon: FolderLock,
      badge: investigationBadge > 0 ? String(investigationBadge) : undefined,
    },
    { label: "Network", href: "/network", icon: Network },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#002A54]/95 backdrop-blur-md border-t border-[#003D7A] shadow-xl px-2 py-1.5 safe-bottom"
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD602] ${
                isActive
                  ? "text-white font-semibold"
                  : "text-[#EDF0F3]/70 hover:text-white"
              }`}
            >
              <div className="relative">
                <div
                  className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? "bg-[#FFD602] text-[#000000] shadow-xs" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 bg-[#DC2626] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#002A54]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#EDF0F3]/70 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD602]"
        >
          <div className="w-9 h-7 rounded-lg flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </div>
    </nav>
  );
};
