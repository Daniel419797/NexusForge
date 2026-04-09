"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import GlassPanel from "./GlassPanel";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   StatCard â€” Animated stat counter
   with accent glow & trending arrow
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";
type Trend = "up" | "down" | "flat";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: Trend;
  trendLabel?: string;
  accent?: Accent;
  icon: React.ReactNode;
}

function useCountUp(target: number, duration = 1200, inView: boolean) {
  const [current, setCurrent] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, inView]);

  return current;
}

const TREND_COLOR: Record<Trend, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-white/40",
};

const TREND_ICON: Record<Trend, string> = {
  up: "â†‘",
  down: "â†“",
  flat: "â†’",
};

export default function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  trend = "flat",
  trendLabel = "",
  accent = "cyan",
  icon,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useCountUp(value, 1400, inView);

  return (
    <div ref={ref}>
      <GlassPanel accent={accent} className="h-full">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
            style={{
              background:
                accent === "cyan"
                  ? "rgba(0,245,255,0.08)"
                  : accent === "purple"
                  ? "rgba(166,140,255,0.08)"
                  : accent === "magenta"
                  ? "rgba(166,140,255,0.08)"
                  : accent === "emerald"
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(245,158,11,0.08)",
            }}
          >
            {icon}
          </div>

          {/* Trend badge */}
          {trendLabel && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${TREND_COLOR[trend]}`}>
              {TREND_ICON[trend]} {trendLabel}
            </span>
          )}
        </div>

        {/* Value */}
        <motion.p
          className="mt-4 text-3xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {prefix}
          {count.toLocaleString()}
          {suffix && <span className="ml-0.5 text-lg font-medium text-white/40">{suffix}</span>}
        </motion.p>

        <p className="mt-1 text-sm text-white/40">{label}</p>
      </GlassPanel>
    </div>
  );
}
