"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  Sun,
  Moon,
  Menu,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routeLabels, TopbarProps } from "@/config/topbar";
import { NotificationPanel } from "@/components/ui/NotificationPanel";

export function Topbar({
  onMenuToggle,
  panelOpen,
  onPanelToggle,
}: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    return {
      label: !isNaN(Number(segment))
        ? segment
        : (routeLabels[path] ??
          routeLabels[`/${segment}`] ??
          segment.replace(/-/g, " ")),
      isLast: index === segments.length - 1,
    };
  });

  return (
    <header className="topbar sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-5 flex-shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors lg:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onPanelToggle}
          title={
            panelOpen
              ? "Collapse sidebar panel (⌘B)"
              : "Expand sidebar panel (⌘B)"
          }
          className={cn(
            "hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
          )}
        >
          {panelOpen ? (
            <PanelLeftClose size={16} />
          ) : (
            <PanelLeftOpen size={16} />
          )}
        </button>

        <span className="hidden lg:block w-px h-4 bg-[var(--border)] flex-shrink-0" />

        <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
          <span className="text-[var(--text-muted)] hidden sm:inline flex-shrink-0">
            Spare Part
          </span>
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1 min-w-0">
              <ChevronRight
                size={13}
                className="text-[var(--text-muted)] flex-shrink-0"
              />
              <span
                className={cn(
                  "capitalize truncate",
                  crumb.isLast
                    ? "font-500 text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]",
                )}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <NotificationPanel />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
