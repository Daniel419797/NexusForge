"use client";

import { ReactNode } from "react";

/* ─────────────────────────────────────────
   GlassPanel — Flat dark surface card
   Clean, minimal. Accent adds a left border
   stripe for brand emphasis where needed.
   ───────────────────────────────────────── */

type Accent = "default" | "brand" | "warning" | "cyan" | "purple" | "magenta" | "emerald" | "amber";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  accent?: Accent;
  /** @deprecated No longer has 3D effect */
  hover3d?: boolean;
  noPad?: boolean;
}

const ACCENT_BORDER: Record<Accent, string> = {
  default:  "rgba(255,255,255,0.07)",
  brand:    "rgba(224,53,83,0.25)",
  warning:  "rgba(245,158,11,0.2)",
  cyan:     "rgba(255,255,255,0.07)",
  purple:   "rgba(255,255,255,0.07)",
  magenta:  "rgba(224,53,83,0.2)",
  emerald:  "rgba(255,255,255,0.07)",
  amber:    "rgba(245,158,11,0.18)",
};

const ACCENT_LEFT: Record<Accent, string | null> = {
  default:  null,
  brand:    "rgba(224,53,83,0.7)",
  warning:  "rgba(245,158,11,0.6)",
  cyan:     null,
  purple:   null,
  magenta:  "rgba(224,53,83,0.55)",
  emerald:  null,
  amber:    "rgba(245,158,11,0.55)",
};

export default function GlassPanel({
  children,
  className = "",
  accent = "default",
  noPad = false,
}: GlassPanelProps) {
  const borderColor = ACCENT_BORDER[accent];
  const leftAccent   = ACCENT_LEFT[accent];

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        background: "hsl(240 4% 8%)",
        border: `1px solid ${borderColor}`,
      }}
      role="article"
    >
      {/* Left accent stripe for brand/warning panels */}
      {leftAccent && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: leftAccent }}
        />
      )}

      <div className={`relative ${noPad ? "" : "p-6"}`}>{children}</div>
    </div>
  );
}
