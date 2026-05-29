"use client";

import { motion } from "framer-motion";
import { popIn } from "@/lib/motion/variants";
import { springBouncy } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

export function MotionBadge({
  children,
  className,
  layoutId,
}: {
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}) {
  return (
    <motion.span
      variants={popIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={springBouncy}
      layoutId={layoutId}
      className={cn("badge", className)}
    >
      {children}
    </motion.span>
  );
}
