"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/* ──────────────────────────────────────────────────
   GlowingLineChart — Real-time glowing line chart
   GPU-composited <canvas>, neon glow, animated stream.
   ────────────────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

const COLORS: Record<Accent, { stroke: string; fill: string; glow: string }> = {
  cyan:    { stroke: "rgb(0,245,255)", fill: "rgba(0,245,255,0.08)", glow: "rgba(0,245,255,0.5)" },
  purple:  { stroke: "rgb(168,85,247)", fill: "rgba(168,85,247,0.08)", glow: "rgba(168,85,247,0.5)" },
  magenta: { stroke: "rgb(255,0,170)", fill: "rgba(255,0,170,0.08)", glow: "rgba(255,0,170,0.5)" },
  emerald: { stroke: "rgb(16,185,129)", fill: "rgba(16,185,129,0.08)", glow: "rgba(16,185,129,0.5)" },
  amber:   { stroke: "rgb(245,158,11)", fill: "rgba(245,158,11,0.08)", glow: "rgba(245,158,11,0.5)" },
};

interface GlowingLineChartProps {
  /** Static data points (0-1 range). If provided, animates once. */
  data?: number[];
  /** Enable simulated real-time streaming */
  realtime?: boolean;
  accent?: Accent;
  height?: number;
  className?: string;
  /** Label shown in the bottom-left */
  label?: string;
}

export default function GlowingLineChart({
  data,
  realtime = false,
  accent = "cyan",
  height = 120,
  className = "",
  label,
}: GlowingLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<number[]>(data?.length ? [...data] : []);
  const [w, setW] = useState(300);
  const { stroke, fill, glow } = COLORS[accent];

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Seed points if none
  useEffect(() => {
    if (pointsRef.current.length === 0) {
      pointsRef.current = Array.from({ length: 60 }, () => 0.3 + Math.random() * 0.4);
    }
  }, []);

  // Real-time stream simulation
  useEffect(() => {
    if (!realtime) return;
    const id = setInterval(() => {
      const pts = pointsRef.current;
      const last = pts.length > 0 ? pts[pts.length - 1] : 0.5;
      const next = Math.max(0.05, Math.min(0.95, last + (Math.random() - 0.5) * 0.12));
      pts.push(next);
      if (pts.length > 80) pts.shift();
    }, 120);
    return () => clearInterval(id);
  }, [realtime]);

  // Render loop
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

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    const step = w / (pts.length - 1);
    ctx.clearRect(0, 0, w, height);

    // Grid lines (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gy = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, fill);
    grad.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < pts.length; i++) {
      const x = i * step;
      const y = height - pts[i] * height * 0.85 - height * 0.05;
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - pts[i - 1] * height * 0.85 - height * 0.05;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    }
    ctx.lineTo(w, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Glow line (wide, blurred)
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = i * step;
      const y = height - pts[i] * height * 0.85 - height * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - pts[i - 1] * height * 0.85 - height * 0.05;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    }
    ctx.strokeStyle = glow;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Main line
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = i * step;
      const y = height - pts[i] * height * 0.85 - height * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - pts[i - 1] * height * 0.85 - height * 0.05;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Leading dot (last point)
    const lastX = (pts.length - 1) * step;
    const lastY = height - pts[pts.length - 1] * height * 0.85 - height * 0.05;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.fillStyle = glow.replace("0.5", "0.15");
    ctx.fill();
  }, [w, height, stroke, fill, glow]);

  // Animation frame loop for realtime, one-shot for static
  useEffect(() => {
    if (!realtime) {
      draw();
      return;
    }
    let rafId = 0;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [realtime, draw]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        className="block"
      />
      {label && (
        <span className="absolute bottom-1 left-2 text-[10px] text-white/20 font-mono">
          {label}
        </span>
      )}
    </div>
  );
}
