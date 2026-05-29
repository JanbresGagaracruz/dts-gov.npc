"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";

const STORAGE_KEY_OPEN = "sidebar-panel-open";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // When an admin changes this user's role, warehouse, or access level, their
  // session is flagged. Sign them out so they re-login with the updated scope.
  useEffect(() => {
    if ((session as any)?.error === "requireReauth") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  // Restore panel-open preference
  useEffect(() => {
    try {
      const o = localStorage.getItem(STORAGE_KEY_OPEN);
      if (o !== null) setPanelOpen(o === "true");
    } catch {}
  }, []);

  const togglePanel = () => {
    setPanelOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY_OPEN, String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:flex flex-shrink-0",
          isMobileOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <Sidebar panelOpen={panelOpen} onPanelToggle={togglePanel} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          panelOpen={panelOpen}
          onPanelToggle={togglePanel}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
