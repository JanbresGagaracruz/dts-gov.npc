"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export function MotionPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("space-y-5", className)}
    >
      {children}
    </motion.div>
  );
}
