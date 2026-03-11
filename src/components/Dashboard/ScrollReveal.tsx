"use client";

import { type ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ──────────────────────────────────────────────
   ScrollReveal — Cinematic scroll-triggered entry
   Children emerge from blur → sharpen, or orbit
   into place with configurable direction.
   ────────────────────────────────────────────── */

type Direction = "up" | "down" | "left" | "right" | "orbit";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Distance in px */
  distance?: number;
  once?: boolean;
}

const getInitial = (dir: Direction, dist: number) => {
  switch (dir) {
    case "up":    return { opacity: 0, y: dist, filter: "blur(8px)" };
    case "down":  return { opacity: 0, y: -dist, filter: "blur(8px)" };
    case "left":  return { opacity: 0, x: dist, filter: "blur(8px)" };
    case "right": return { opacity: 0, x: -dist, filter: "blur(8px)" };
    case "orbit":
      return { opacity: 0, x: dist * 0.6, y: dist * 0.4, rotate: 12, scale: 0.88, filter: "blur(6px)" };
  }
};

const getAnimate = () => ({
  opacity: 1,
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  filter: "blur(0px)",
});

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.65,
  distance = 40,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitial(direction, distance)}
      animate={inView ? getAnimate() : getInitial(direction, distance)}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // cinematic ease-out
      }}
    >
      {children}
    </motion.div>
  );
}
