"use client";

import { type ReactNode, useRef, useCallback } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   ElectricRippleButton — Clean action button
   Spawns a subtle ripple ring on click.
   ───────────────────────────────────────────── */

type Accent = "brand" | "white" | "warning" | "cyan" | "purple" | "magenta" | "emerald" | "amber";

const ACCENT_MAP: Record<Accent, { ring: string; bg: string; border: string }> = {
  brand:   { ring: "rgba(220,50,78,0.5)",   bg: "rgba(220,50,78,0.15)",  border: "rgba(220,50,78,0.25)" },
  white:   { ring: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
  warning: { ring: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
  cyan:    { ring: "rgba(220,50,78,0.5)",   bg: "rgba(220,50,78,0.15)",  border: "rgba(220,50,78,0.25)" },
  purple:  { ring: "rgba(220,50,78,0.5)",   bg: "rgba(220,50,78,0.15)",  border: "rgba(220,50,78,0.25)" },
  magenta: { ring: "rgba(220,50,78,0.5)",   bg: "rgba(220,50,78,0.15)",  border: "rgba(220,50,78,0.25)" },
  emerald: { ring: "rgba(71,165,122,0.4)",  bg: "rgba(71,165,122,0.1)",  border: "rgba(71,165,122,0.2)" },
  amber:   { ring: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
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
  accent = "brand",
  disabled = false,
  type = "button",
  style,
  title,
}: ElectricRippleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { ring, bg, border } = ACCENT_MAP[accent];

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
        border: `1px solid ${ring}`,
        opacity: "1",
        pointerEvents: "none",
        transform: "scale(0)",
        zIndex: "0",
      } as CSSStyleDeclaration);

      btn.appendChild(ripple);
      const anim = ripple.animate(
        [
          { transform: "scale(0)", opacity: 1 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: 550, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" },
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
        background: bg,
        border: `1px solid ${border}`,
        ...style,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
