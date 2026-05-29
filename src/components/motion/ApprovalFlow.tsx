"use client";

import { motion } from "framer-motion";
import { spring, springBouncy } from "@/lib/motion/transitions";
import { Check, Clock, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "done" | "active" | "pending" | "rejected";

interface Step {
  label:    string;
  status:   StepStatus;
  date?:    string;
  by?:      string;
  note?:    string;
}

function StepIcon({ status }: { status: StepStatus }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  if (status === "done")     return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={springBouncy}
      className={cn(base, "bg-emerald-500/15 border-2 border-emerald-500")}
    >
      <Check size={14} className="text-emerald-400" />
    </motion.div>
  );
  if (status === "active")   return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1,   opacity: 1 }}
      transition={spring}
      className={cn(base, "bg-[var(--accent)]/15 border-2 border-[var(--accent)]")}
    >
      <Clock size={14} className="text-[var(--accent)]" />
    </motion.div>
  );
  if (status === "rejected") return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={springBouncy}
      className={cn(base, "bg-red-500/15 border-2 border-red-500")}
    >
      <X size={14} className="text-red-400" />
    </motion.div>
  );
  return (
    <div className={cn(base, "bg-[var(--bg-tertiary)] border-2 border-[var(--border)]")}>
      <Circle size={8} className="text-[var(--text-muted)]" />
    </div>
  );
}

export function ApprovalFlow({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-[var(--border)]" />

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: i * 0.08 }}
            className="flex items-start gap-3 relative"
          >
            <StepIcon status={step.status} />

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                  "text-sm font-600",
                  step.status === "done"     && "text-emerald-400",
                  step.status === "active"   && "text-[var(--accent)]",
                  step.status === "rejected" && "text-red-400",
                  step.status === "pending"  && "text-[var(--text-muted)]",
                )}>
                  {step.label}
                </p>
                {step.status === "active" && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="text-[9px] font-700 uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)]"
                  >
                    Current
                  </motion.span>
                )}
              </div>
              {(step.by || step.date) && (
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {step.by && <span>{step.by}</span>}
                  {step.by && step.date && <span className="mx-1">·</span>}
                  {step.date && <span>{step.date}</span>}
                </p>
              )}
              {step.note && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 italic">{step.note}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
