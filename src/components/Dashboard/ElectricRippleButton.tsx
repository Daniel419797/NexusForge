"use client";

import { type ReactNode, useRef, useCallback } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   ElectricRippleButton — Spatial action button
   Emits an electric ripple ring + scale bounce
   + brief glow pulse on every click / tap.
   ───────────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber" | "white";

const ACCENT_MAP: Record<Accent, { ring: string; glow: string; shadow: string }> = {
  cyan:    { ring: "rgba(0,245,255,0.45)", glow: "rgba(0,245,255,0.12)", shadow: "0 0 24px rgba(0,245,255,0.25)" },
  purple:  { ring: "rgba(168,85,247,0.45)", glow: "rgba(168,85,247,0.12)", shadow: "0 0 24px rgba(168,85,247,0.25)" },
  magenta: { ring: "rgba(255,0,170,0.45)", glow: "rgba(255,0,170,0.12)", shadow: "0 0 24px rgba(255,0,170,0.25)" },
  emerald: { ring: "rgba(16,185,129,0.45)", glow: "rgba(16,185,129,0.12)", shadow: "0 0 24px rgba(16,185,129,0.25)" },
  amber:   { ring: "rgba(245,158,11,0.45)", glow: "rgba(245,158,11,0.12)", shadow: "0 0 24px rgba(245,158,11,0.25)" },
  white:   { ring: "rgba(255,255,255,0.25)", glow: "rgba(255,255,255,0.06)", shadow: "0 0 20px rgba(255,255,255,0.12)" },
};

interface ElectricRippleButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  accent?: Accent;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  title?: string;
}

export default function ElectricRippleButton({
  children,
  onClick,
  className = "",
  accent = "purple",
  disabled = false,
  type = "button",
  style,
  title,
}: ElectricRippleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { ring, glow, shadow } = ACCENT_MAP[accent];

  const spawnRipple = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2.2;

      const ripple = document.createElement("span");
      Object.assign(ripple.style, {
        position: "absolute",
        left: `${x - size / 2}px`,
        top: `${y - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: `2px solid ${ring}`,
        opacity: "1",
        pointerEvents: "none",
        transform: "scale(0)",
        zIndex: "0",
      } as CSSStyleDeclaration);

      // Animate via Web Animations API (composited on GPU)
      btn.appendChild(ripple);
      const anim = ripple.animate(
        [
          { transform: "scale(0)", opacity: 1 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: 600, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" },
      );
      anim.onfinish = () => ripple.remove();
    },
    [ring],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      spawnRipple(e);
      onClick?.(e);
    },
    [spawnRipple, onClick],
  );

  return (
    <motion.button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      title={title}
      className={`relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        background: glow,
        border: `1px solid ${ring.replace("0.45", "0.18")}`,
        ...style,
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: shadow,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
