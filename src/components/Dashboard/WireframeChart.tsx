"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/* ──────────────────────────────────────────────────────
   WireframeChart — 3D wireframe bar chart that fills
   on hover. Pure <canvas>, GPU-composited perspective.
   ────────────────────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

const PALETTE: Record<Accent, { wire: string; fill: string; top: string }> = {
  cyan:    { wire: "rgba(0,245,255,0.35)", fill: "rgba(0,245,255,0.18)", top: "rgba(0,245,255,0.30)" },
  purple:  { wire: "rgba(220,50,78,0.35)", fill: "rgba(220,50,78,0.15)", top: "rgba(220,50,78,0.28)" },
  magenta: { wire: "rgba(220,50,78,0.35)", fill: "rgba(220,50,78,0.15)", top: "rgba(220,50,78,0.28)" },
  emerald: { wire: "rgba(16,185,129,0.35)", fill: "rgba(16,185,129,0.18)", top: "rgba(16,185,129,0.30)" },
  amber:   { wire: "rgba(245,158,11,0.35)", fill: "rgba(245,158,11,0.18)", top: "rgba(245,158,11,0.30)" },
};

interface WireframeChartProps {
  /** Data values (0–1 normalised) */
  data: number[];
  labels?: string[];
  accent?: Accent;
  height?: number;
  className?: string;
}

export default function WireframeChart({
  data,
  labels,
  accent = "purple",
  height = 160,
  className = "",
}: WireframeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const fillProgress = useRef<number[]>(data.map(() => 0));

  const { wire, fill, top } = PALETTE[accent];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep fill progress array in sync with data length
  useEffect(() => {
    if (fillProgress.current.length !== data.length) {
      fillProgress.current = data.map(() => 0);
    }
  }, [data]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, height);

    const n = data.length;
    if (n === 0) return;

    const pad = 20;
    const barGap = 8;
    const barW = Math.min(40, (w - pad * 2 - barGap * (n - 1)) / n);
    const maxH = height - pad * 2;
    const depth = 12; // 3D extrusion depth
    const shiftX = depth * 0.65;
    const shiftY = depth * 0.45;

    for (let i = 0; i < n; i++) {
      const x = pad + i * (barW + barGap);
      const barH = data[i] * maxH;
      const y = height - pad - barH;

      // Animate fill progress toward target
      const target = hoverIdx === i ? 1 : 0;
      fillProgress.current[i] += (target - fillProgress.current[i]) * 0.15;
      const fp = fillProgress.current[i];

      // ── Right side face (3D depth) ──
      ctx.beginPath();
      ctx.moveTo(x + barW, y);
      ctx.lineTo(x + barW + shiftX, y - shiftY);
      ctx.lineTo(x + barW + shiftX, height - pad - shiftY);
      ctx.lineTo(x + barW, height - pad);
      ctx.closePath();
      if (fp > 0.01) {
        ctx.fillStyle = wire.replace("0.35", `${0.06 + fp * 0.12}`);
        ctx.fill();
      }
      ctx.strokeStyle = wire;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Top face ──
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + shiftX, y - shiftY);
      ctx.lineTo(x + barW + shiftX, y - shiftY);
      ctx.lineTo(x + barW, y);
      ctx.closePath();
      if (fp > 0.01) {
        ctx.fillStyle = top.replace("0.30", `${0.08 + fp * 0.22}`);
        ctx.fill();
      }
      ctx.strokeStyle = wire;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Front face ──
      ctx.beginPath();
      ctx.rect(x, y, barW, barH);
      if (fp > 0.01) {
        ctx.fillStyle = fill.replace("0.18", `${fp * 0.22}`);
        ctx.fill();
      }
      ctx.strokeStyle = hoverIdx === i ? wire.replace("0.35", "0.7") : wire;
      ctx.lineWidth = hoverIdx === i ? 1.5 : 1;
      ctx.stroke();

      // Label
      if (labels?.[i]) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x + barW / 2, height - 4);
      }
    }
  }, [w, height, data, hoverIdx, wire, fill, top, labels]);

  // Render loop
  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  // Hit-test hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const pad = 20;
      const barGap = 8;
      const barW = Math.min(40, (w - pad * 2 - barGap * (data.length - 1)) / data.length);

      for (let i = 0; i < data.length; i++) {
        const x = pad + i * (barW + barGap);
        if (mx >= x && mx <= x + barW) {
          setHoverIdx(i);
          return;
        }
      }
      setHoverIdx(-1);
    },
    [w, data.length],
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(-1)}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} className="block" />
    </div>
  );
}
