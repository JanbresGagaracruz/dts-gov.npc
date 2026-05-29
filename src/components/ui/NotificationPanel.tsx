"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, CheckCheck, X, Check, Clock, Cog, ChevronRight,
  AlertTriangle, ZapOff, FileText, ClipboardList, AlertCircle, ArrowLeftRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { slideDown, staggerContainer, staggerItem, popIn } from "@/lib/motion/variants";
import { spring, springBouncy } from "@/lib/motion/transitions";

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  link:      string | null;
  isRead:    boolean;
  createdAt: string;
}

interface Reminder {
  key: string; type: string; priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string; body: string; count: number; link: string;
}

const PRIORITY_CFG = {
  CRITICAL: { iconBg: "bg-red-500/10",    iconColor: "text-red-400",    dot: "bg-red-500"    },
  HIGH:     { iconBg: "bg-amber-500/10",  iconColor: "text-amber-400",  dot: "bg-amber-400"  },
  MEDIUM:   { iconBg: "bg-brand-500/10",  iconColor: "text-brand-400",  dot: "bg-brand-500"  },
  LOW:      { iconBg: "bg-blue-500/10",   iconColor: "text-blue-400",   dot: "bg-blue-400"   },
} as const;

const REMINDER_ICON: Record<string, React.ElementType> = {
  OUT_OF_STOCK:        ZapOff,
  LOW_STOCK:           AlertTriangle,
  PENDING_CHANGE:      FileText,
  PENDING_REQUISITION: ClipboardList,
  OVERDUE_REQUISITION: AlertCircle,
  STALE_DRAFT:         Clock,
  PENDING_TRANSFER:    ArrowLeftRight,
};

function NotifIcon({ type }: { type: string }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0";
  if (type.includes("APPROVED"))  return <div className={cn(base, "bg-emerald-500/10")}><Check size={13} className="text-emerald-400" /></div>;
  if (type.includes("REJECTED"))  return <div className={cn(base, "bg-red-500/10")}><X     size={13} className="text-red-400"     /></div>;
  if (type.includes("SUBMITTED")) return <div className={cn(base, "bg-amber-500/10")}><Clock size={13} className="text-amber-400"  /></div>;
  return                                 <div className={cn(base, "bg-blue-500/10")}><Cog   size={13} className="text-blue-400"   /></div>;
}

export function NotificationPanel() {
  const { socket } = useSocket();
  const router     = useRouter();
  const panelRef   = useRef<HTMLDivElement>(null);

  const [open, setOpen]                   = useState(false);
  const [tab, setTab]                     = useState<"inbox" | "reminders">("inbox");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [newIds, setNewIds]               = useState<Set<string>>(new Set());
  const [reminders, setReminders]         = useState<Reminder[]>([]);
  const [rLoading, setRLoading]           = useState(false);
  const [rFetched, setRFetched]           = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount     ?? 0);
    } catch {}
  }, []);

  const fetchReminders = useCallback(async () => {
    setRLoading(true);
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) return;
      const data = await res.json();
      setReminders(data.reminders ?? []);
    } catch {} finally {
      setRLoading(false);
      setRFetched(true);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (tab === "reminders" && !rFetched) fetchReminders();
  }, [tab, rFetched, fetchReminders]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n: Notification) => {
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
      setNewIds((prev) => new Set(prev).add(n.id));
      setTimeout(() => setNewIds((prev) => { const s = new Set(prev); s.delete(n.id); return s; }), 3000);
    };
    socket.on("notification", handler);
    return () => { socket.off("notification", handler); };
  }, [socket]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) { router.push(n.link); router.refresh(); }
  };

  const urgentCount = reminders.filter((r) => r.priority === "CRITICAL" || r.priority === "HIGH").length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Notifications"
      >
        <motion.span
          animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Bell size={16} />
        </motion.span>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              variants={popIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springBouncy}
              className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={spring}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-[var(--border)]">
              <div className="px-4 pt-3 pb-0 flex items-center justify-between">
                <span className="text-[11px] font-700 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={11} /> Notifications
                </span>
                {tab === "inbox" && unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* Tab row */}
              <div className="flex mt-1">
                <button
                  onClick={() => setTab("inbox")}
                  className={cn(
                    "flex-1 py-2.5 text-[12px] font-600 transition-colors border-b-2",
                    tab === "inbox"
                      ? "text-[var(--text-primary)] border-brand-500"
                      : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
                  )}
                >
                  Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </button>
                <button
                  onClick={() => setTab("reminders")}
                  className={cn(
                    "flex-1 py-2.5 text-[12px] font-600 transition-colors border-b-2 flex items-center justify-center gap-1.5",
                    tab === "reminders"
                      ? "text-[var(--text-primary)] border-brand-500"
                      : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
                  )}
                >
                  Reminders
                  {urgentCount > 0 && (
                    <span className="text-[9px] font-800 px-1 py-0.5 rounded bg-rose-500/15 text-rose-400 leading-none">
                      {urgentCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ── Inbox ────────────────────────────────────────────────────── */}
            {tab === "inbox" && (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
                      <Bell size={18} className="text-[var(--text-muted)] opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">All caught up</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">No notifications yet</p>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                    <AnimatePresence initial={false}>
                      {notifications.map((n) => (
                        <motion.button
                          key={n.id}
                          variants={staggerItem}
                          transition={spring}
                          layout
                          exit={{ opacity: 0, height: 0 }}
                          onClick={() => handleClick(n)}
                          className={cn(
                            "w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors group",
                            !n.isRead && "bg-blue-500/[0.04]",
                            newIds.has(n.id) && "ring-1 ring-inset ring-blue-500/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5"><NotifIcon type={n.type} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{n.title}</p>
                                <AnimatePresence>
                                  {!n.isRead && (
                                    <motion.span
                                      key="dot"
                                      variants={popIn}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      transition={springBouncy}
                                      className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{n.body}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-50">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Reminders ────────────────────────────────────────────────── */}
            {tab === "reminders" && (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
                {rLoading ? (
                  <div className="py-10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[var(--border)] border-t-brand-500 rounded-full animate-spin" />
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <Check size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No active reminders</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Everything is on track</p>
                  </div>
                ) : (
                  reminders.map((r) => {
                    const cfg  = PRIORITY_CFG[r.priority];
                    const Icon = REMINDER_ICON[r.type] ?? AlertTriangle;
                    return (
                      <button
                        key={r.key}
                        onClick={() => { setOpen(false); router.push(r.link); }}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors group flex items-center gap-3"
                      >
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", cfg.iconBg)}>
                          <Icon size={11} className={cfg.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-600 text-[var(--text-primary)] truncate">{r.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {r.count} item{r.count !== 1 ? "s" : ""} · {r.priority.toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors"
              >
                View all notifications &amp; reminders
                <ChevronRight size={10} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
