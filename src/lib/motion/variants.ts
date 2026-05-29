import { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -8 },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1    },
  exit:    { opacity: 0, scale: 0.94 },
};

export const popIn: Variants = {
  hidden:  { opacity: 0, scale: 0.65 },
  visible: { opacity: 1, scale: 1    },
  exit:    { opacity: 0, scale: 0.75 },
};

export const slideDown: Variants = {
  hidden:  { opacity: 0, y: -10, scale: 0.97 },
  visible: { opacity: 1, y: 0,   scale: 1    },
  exit:    { opacity: 0, y: -8,  scale: 0.97 },
};

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: 48  },
  visible: { opacity: 1, x: 0   },
  exit:    { opacity: 0, x: 48  },
};

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0   },
  exit:    { opacity: 0, x: -48 },
};

export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0  },
};

export const backdrop: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const timelineItem: Variants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0   },
};

export const approvalStep: Variants = {
  inactive: { scale: 1,    opacity: 0.45 },
  active:   { scale: 1.08, opacity: 1    },
  done:     { scale: 1,    opacity: 1    },
};
