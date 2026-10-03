"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activePath?: string;
  onSearchClick?: () => void;
  headerActions?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activePath,
  onSearchClick,
  headerActions,
}) => {
  const { user, role, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#000000] flex flex-col font-sans antialiased">
      <div className="flex flex-1 w-full relative">
        {/* Desktop Sidebar */}
        <Sidebar
          currentPath={activePath}
          userRole={role || "ANALYST"}
          userName={user?.full_name || "Compliance Analyst"}
          onLogout={logout}
        />

        {/* Mobile Drawer Backdrop */}
        {mobileDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="w-72 bg-[#002A54] h-full flex flex-col relative z-50 animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 text-[#EDF0F3] hover:text-white">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Sidebar
                currentPath={activePath}
                userRole={role || "ANALYST"}
                userName={user?.full_name || "Compliance Analyst"}
                isMobile={true}
                onLogout={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader
            onMenuToggle={() => setMobileDrawerOpen(true)}
            userRole={role || "ANALYST"}
            userName={user?.full_name || "Compliance Analyst"}
            onSearchClick={onSearchClick}
            actions={headerActions}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMoreClick={() => setMobileDrawerOpen(true)} />
    </div>
  );
};
