"use client";

import { ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string; // e.g. "cyan" | "magenta" | "purple"
}

const GLOW_MAP: Record<string, string> = {
  cyan: "rgba(0, 240, 255, 0.35)",
  magenta: "rgba(255, 0, 229, 0.35)",
  purple: "rgba(168, 85, 247, 0.35)",
};

export default function GlassCard({
  children,
  className = "",
  glowColor = "cyan",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  const glow = GLOW_MAP[glowColor] || GLOW_MAP.cyan;

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={(e) => {
        handleMouse(e);
        setHovered(true);
      }}
      onMouseLeave={handleLeave}
      className={`relative rounded-2xl border border-white/8 overflow-hidden ${className}`}
    >
      {/* Glass background — solid fill avoids expensive backdrop-filter */}
      <div className="absolute inset-0 bg-[rgba(8,10,25,0.82)]" />

      {/* Neon glow on hover — opacity toggle avoids animating boxShadow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${glow}, 0 0 40px ${glow}`,
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Shimmer edge */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glow.replace("0.35", "0.08")} 0%, transparent 50%, ${glow.replace("0.35", "0.05")} 100%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
