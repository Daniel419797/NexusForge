"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ─────────────────────────────────────────
   GlassPanel — Reusable spatial glass card
   3D tilt on hover, accent-configurable glow,
   solid bg (no backdrop-filter for perf)
   ───────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  accent?: Accent;
  hover3d?: boolean;
  noPad?: boolean;
}

const ACCENTS: Record<Accent, { border: string; glow: string; top: string }> = {
  cyan:    { border: "rgba(0,245,255,0.1)",  glow: "rgba(0,245,255,0.18)",  top: "rgba(0,245,255,0.25)" },
  purple:  { border: "rgba(168,85,247,0.1)", glow: "rgba(168,85,247,0.18)", top: "rgba(168,85,247,0.25)" },
  magenta: { border: "rgba(255,0,170,0.1)",  glow: "rgba(255,0,170,0.18)",  top: "rgba(255,0,170,0.25)" },
  emerald: { border: "rgba(16,185,129,0.1)", glow: "rgba(16,185,129,0.18)", top: "rgba(16,185,129,0.25)" },
  amber:   { border: "rgba(245,158,11,0.1)", glow: "rgba(245,158,11,0.18)", top: "rgba(245,158,11,0.25)" },
};

export default function GlassPanel({
  children,
  className = "",
  accent = "cyan",
  hover3d = true,
  noPad = false,
}: GlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const { border, glow, top } = ACCENTS[accent];

  const handleMouse = (e: React.MouseEvent) => {
    if (!hover3d) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      style={hover3d ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={hover3d ? { scale: 1.015, boxShadow: `0 8px 40px ${glow}, 0 0 0 1px ${border}` } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl overflow-hidden group ${className}`}
      role="article"
    >
      {/* Solid glass bg */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(170deg, rgba(14,16,34,0.92) 0%, rgba(8,10,25,0.88) 100%)",
          border: `1px solid ${border}`,
        }}
      />

      {/* Top edge highlight */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${top}, transparent)` }}
      />

      {/* Hover inner glow bloom — depth increase + inner light */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 80px ${glow}, inset 0 0 120px ${glow.replace("0.18", "0.06")}` }}
      />
      {/* Radial bloom center for "light inside the card" effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${glow.replace("0.18", "0.10")}, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className={`relative z-10 ${noPad ? "" : "p-6"}`}>{children}</div>
    </motion.div>
  );
}
