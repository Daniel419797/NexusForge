"use client";

import { ReactNode, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface ParticleButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

// Spawn electric particle trails on click — CSS keyframes version
// Injects a shared stylesheet once, then reuses the animation class
let styleInjected = false;
function ensureParticleStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes particle-burst {
      0%   { transform: translate(var(--px), var(--py)) scale(1); opacity: 1; }
      100% { transform: translate(calc(var(--px) + var(--dx)), calc(var(--py) + var(--dy))) scale(0); opacity: 0; }
    }
    .burst-particle {
      position: fixed; border-radius: 50%; pointer-events: none; z-index: 99999;
      animation: particle-burst 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
    }
  `;
  document.head.appendChild(style);
}

function spawnParticles(x: number, y: number) {
  ensureParticleStyles();
  const count = 8; // reduced from 12
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 40 + Math.random() * 60;
    const size = 2 + Math.random() * 3;
    const hue = Math.random() > 0.5 ? 185 : 280;
    const el = document.createElement("div");
    el.className = "burst-particle";
    el.style.cssText = `
      left:0;top:0;width:${size}px;height:${size}px;
      background:hsl(${hue} 100% 65%);
      --px:${x}px;--py:${y}px;
      --dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance}px;
    `;
    frag.appendChild(el);
  }
  document.body.appendChild(frag);
  // Single cleanup pass
  setTimeout(() => {
    document.querySelectorAll(".burst-particle").forEach((el) => el.remove());
  }, 700);
}

export default function ParticleButton({
  children,
  className = "",
  href,
  variant = "primary",
  onClick,
}: ParticleButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      spawnParticles(e.clientX, e.clientY);
      onClick?.();
    },
    [onClick]
  );

  const baseClasses =
    variant === "primary"
      ? "relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold rounded-2xl bg-rose-600 text-white overflow-hidden group"
      : "relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold rounded-2xl border border-white/10 bg-[rgba(8,10,25,0.65)] text-white overflow-hidden group hover:border-cyan-500/30";

  const MotionTag = href ? motion.a : motion.button;

  return (
    <MotionTag
      ref={ref as never}
      href={href}
      onClick={handleClick}
      className={`${baseClasses} ${className}`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated shine sweep */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </span>

      {/* Pulse glow behind */}
      {variant === "primary" && (
        <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-linear-to-r from-cyan-500/30 via-rose-600/30 to-fuchsia-500/30" />
      )}

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </MotionTag>
  );
}

