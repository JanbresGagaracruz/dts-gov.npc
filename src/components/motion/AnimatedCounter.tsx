"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedCounter({
  value,
  className,
  prefix = "",
  suffix = "",
  duration = 0.9,
  format = true,
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: boolean;
}) {
  const mv      = useMotionValue(0);
  const display = useTransform(mv, (v) => {
    const n = Math.round(v);
    return `${prefix}${format ? n.toLocaleString() : n}${suffix}`;
  });

  const firstRender = useRef(true);

  useEffect(() => {
    const from = firstRender.current ? 0 : mv.get();
    firstRender.current = false;
    const ctrl = animate(mv, value, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      from,
    });
    return ctrl.stop;
  }, [value]);

  return <motion.span className={cn(className)}>{display}</motion.span>;
}
