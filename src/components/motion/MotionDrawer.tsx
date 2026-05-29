"use client";

import { AnimatePresence, motion } from "framer-motion";
import { backdrop } from "@/lib/motion/variants";
import { spring, fast } from "@/lib/motion/transitions";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MotionDrawer({
  open,
  onClose,
  children,
  width = 480,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  side?: "left" | "right";
  className?: string;
}) {
  const xOut = side === "right" ? width : -width;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={fast}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            key="drawer-panel"
            initial={{ x: xOut, opacity: 0 }}
            animate={{ x: 0,    opacity: 1 }}
            exit={{ x: xOut,    opacity: 0 }}
            transition={spring}
            style={{ width }}
            className={cn(
              "fixed top-0 h-full z-50 flex flex-col shadow-2xl overflow-hidden",
              "bg-[var(--bg-secondary)]",
              side === "right"
                ? "right-0 border-l border-[var(--border)]"
                : "left-0 border-r border-[var(--border)]",
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
