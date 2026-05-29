"use client";

import { motion } from "framer-motion";
import { spring } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  label:    string;
  detail?:  string;
  date?:    string;
  type?:    "neutral" | "success" | "warning" | "danger" | "info";
  icon?:    React.ReactNode;
}

const DOT_COLORS: Record<string, string> = {
  neutral: "bg-[var(--text-muted)]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-[var(--accent)]",
};

export function TransferTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative pl-5">
      {/* Vertical line */}
      <motion.div
        className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      />

      <div className="space-y-5">
        {events.map((ev, i) => {
          const dotColor = DOT_COLORS[ev.type ?? "neutral"];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1,  x: 0   }}
              transition={{ ...spring, delay: i * 0.07 + 0.1 }}
              className="flex items-start gap-3"
            >
              {/* Dot / icon */}
              <div className="absolute left-0 mt-1.5">
                {ev.icon ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] flex items-center justify-center">
                    {ev.icon}
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: i * 0.07 + 0.15 }}
                    className={cn("w-3 h-3 rounded-full ring-2 ring-[var(--bg-secondary)]", dotColor)}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="text-sm font-500 text-[var(--text-primary)]">{ev.label}</p>
                {ev.detail && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{ev.detail}</p>
                )}
                {ev.date && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60">{ev.date}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
