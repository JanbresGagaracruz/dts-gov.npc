"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { navGroups, SidebarProps } from "@/config/navigation";
import {
  slideDown,
  slideLeft,
  staggerContainer,
  staggerItem,
} from "@/lib/motion/variants";
import { spring, springBouncy, fast } from "@/lib/motion/transitions";
import Image from "next/image";

export function Sidebar({ panelOpen, onPanelToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userLevel = session?.user?.accessLevel ?? 0;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const activeGroupFromRoute = navGroups.find((g) =>
    g.items.some(
      (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
    ),
  );

  const [manualGroupId, setManualGroupId] = useState<string | null>(null);
  const activeGroupId = manualGroupId ?? activeGroupFromRoute?.id ?? "overview";

  useEffect(() => {
    setManualGroupId(null);
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.removeItem("sidebar-active-group");
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        onPanelToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPanelToggle]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  const handleRailClick = (groupId: string) => {
    const isCurrentlyShowing = activeGroupId === groupId && panelOpen;
    if (isCurrentlyShowing) {
      onPanelToggle();
    } else {
      setManualGroupId(groupId);
      if (!panelOpen) onPanelToggle();
    }
  };

  const roleLabel: Record<number, string> = {
    1: "Viewer",
    2: "Staff",
    3: "Admin",
    4: "Super Admin",
  };
  const displayName = session?.user?.name || session?.user?.username || "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const activeGroup = navGroups.find((g) => g.id === activeGroupId);
  const visibleGroups = navGroups.filter((g) => userLevel >= (g.minLevel ?? 1));

  return (
    <div className="flex h-full flex-shrink-0">
      <aside className="w-[64px] bg-[var(--bg-sidebar)] border-r border-white/[0.05] flex flex-col flex-shrink-0 z-30">
        <div className="h-14 flex items-center justify-center border-b border-white/[0.05] flex-shrink-0">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/npc-big-logo.png"
              alt="FuelContract MS"
              width={32}
              height={32}
            />
          </Link>
        </div>
        <nav
          className="flex-1 py-2 flex flex-col gap-0.5 items-center overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {visibleGroups.map((group) => {
            const Icon = group.icon;
            const isPanelGroup = group.id === activeGroupId && panelOpen;
            const hasRoute = group.items.some(
              (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
            );

            return (
              <button
                key={group.id}
                onClick={() => handleRailClick(group.id)}
                title={group.label}
                className={cn(
                  // base
                  "relative w-[48px] h-[48px] rounded-xl flex flex-col items-center justify-center gap-[3px]",
                  "transition-all duration-150 outline-none",
                  // panel-open = this group is previewed/active
                  isPanelGroup
                    ? [
                        // white/glass pill — modern, not orange
                        "bg-white/[0.10] text-white",
                        // crisp left-edge bar in white
                        "before:absolute before:left-0 before:top-3 before:bottom-3",
                        "before:w-[2.5px] before:rounded-r-full before:bg-white/70",
                      ]
                    : hasRoute
                      ? "text-white/65 hover:bg-white/[0.06]"
                      : "text-white/35 hover:bg-white/[0.06] hover:text-white/70",
                )}
              >
                <Icon size={16} />
                <span className="text-[8px] font-500 tracking-wide leading-none">
                  {group.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          className="h-14 flex items-center justify-center border-t border-white/[0.05] relative"
          ref={userMenuRef}
        >
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            title={displayName}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-[10px] font-600 text-white/80",
              "bg-white/[0.08] border border-white/[0.10]",
              "hover:bg-white/[0.14] transition-colors",
            )}
          >
            {initials}
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                key="user-menu"
                variants={slideDown}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={spring}
                className="absolute bottom-full left-2 mb-2 w-52 bg-[#1c1f2b] border border-white/[0.09] rounded-xl overflow-hidden shadow-2xl z-50"
              >
                <div className="px-3.5 py-3 border-b border-white/[0.06]">
                  <p className="text-white/80 text-[12px] font-500 truncate">
                    {displayName}
                  </p>
                  <p className="text-white/35 text-[10.5px] truncate mt-0.5">
                    {session?.user?.email}
                  </p>
                  <span className="inline-block mt-2 text-[9px] font-600 uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/[0.08] text-white/50">
                    {roleLabel[userLevel] ?? "Staff"}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-[12px]"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <motion.aside
        animate={{ width: panelOpen ? 210 : 0, opacity: panelOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="bg-[var(--bg-sidebar)] border-r border-white/[0.05] flex flex-col flex-shrink-0 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {activeGroup && panelOpen && (
            <motion.div
              key={activeGroup.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ ...spring, delay: 0.04 }}
              className="flex flex-col h-full w-[210px]"
            >
              <div className="h-14 px-4 flex items-center border-b border-white/[0.05] flex-shrink-0">
                <div className="min-w-0">
                  <p className="text-white/90 text-[13px] font-500 tracking-tight truncate leading-tight">
                    {activeGroup.label}
                  </p>
                  <p className="text-white/30 text-[10.5px] truncate leading-tight mt-0.5">
                    {activeGroup.description}
                  </p>
                </div>
              </div>

              <motion.nav
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {activeGroup.items.map((item) => {
                  if (item.minLevel && userLevel < item.minLevel) return null;
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <motion.div
                      key={item.href}
                      variants={staggerItem}
                      transition={spring}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150",
                          isActive
                            ? [
                                "text-white font-500",
                                "bg-white/[0.09] ring-[0.5px] ring-white/[0.12]",
                                "border-l-[2px] border-white/60 pl-[10px]",
                              ]
                            : "text-white/45 hover:bg-white/[0.05] hover:text-white/85",
                        )}
                      >
                        <Icon
                          size={14}
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            isActive
                              ? "text-white/90"
                              : "text-white/35 group-hover:text-white/75",
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>

                        {item.badge && (
                          <span
                            className={cn(
                              "text-[9px] font-600 px-1.5 py-0.5 rounded-md leading-none tracking-wide",
                              item.badge === "New"
                                ? "bg-green-500/20 text-green-400"
                                : item.badge === "Available Soon"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : isActive
                                    ? "bg-white/20 text-white/90"
                                    : "bg-white/[0.07] text-white/40",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
