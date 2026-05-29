import { Transition } from "framer-motion";

export const spring: Transition = {
  type:      "spring",
  stiffness: 380,
  damping:   28,
};

export const springBouncy: Transition = {
  type:      "spring",
  stiffness: 520,
  damping:   22,
};

export const springGentle: Transition = {
  type:      "spring",
  stiffness: 220,
  damping:   30,
};

export const ease: Transition = {
  type:     "tween",
  ease:     [0.4, 0, 0.2, 1],
  duration: 0.22,
};

export const fast: Transition = {
  type:     "tween",
  ease:     [0.4, 0, 0.2, 1],
  duration: 0.14,
};

export const slow: Transition = {
  type:     "tween",
  ease:     [0.4, 0, 0.2, 1],
  duration: 0.42,
};

export const page: Transition = {
  type:     "tween",
  ease:     [0.4, 0, 0.2, 1],
  duration: 0.3,
};

export const counter: Transition = {
  type:     "tween",
  ease:     [0.4, 0, 0.2, 1],
  duration: 0.85,
};
