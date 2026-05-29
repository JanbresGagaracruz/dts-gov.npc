"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";
import { spring } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  index?: number;
  hover?: boolean;
  noCard?: boolean;
}

export function MotionCard({
  children,
  className,
  index = 0,
  hover = true,
  noCard = false,
  ...rest
}: MotionCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ ...spring, delay: index * 0.06 }}
      whileHover={
        hover
          ? { y: -2, boxShadow: "0 10px 28px rgba(30,32,60,0.09)" }
          : undefined
      }
      className={cn(!noCard && "card", className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
