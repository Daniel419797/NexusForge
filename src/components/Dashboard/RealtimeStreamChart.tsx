"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   RealtimeStreamChart â€” Multi-stream glowing line chart
   with real-time animated data, pulsing leading dot,
   and configurable accent colors per stream.

   Production features:
   - External data feed via externalData prop (for live backend metrics)
   - Graceful fallback to internal random walk when no external data
   - Canvas DPR-aware rendering with RAF loop
   - Connection status indicator (live / stale / disconnected)
   - Throttled tooltip state updates (prevents excessive re-renders)
   - ResizeObserver for responsive width
   - Cleanup of all timers/observers/RAF on unmount
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

export interface StreamConfig {
  label: string;
  accent: Accent;
  /** Initial seed data (0â€“1). Falls back to random walk. */
  data?: number[];
}

const COLORS: Record<Accent, { stroke: string; fill: string; glow: string }> = {
  cyan:    { stroke: "rgb(0,245,255)",   fill: "rgba(0,245,255,0.06)",   glow: "rgba(0,245,255,0.40)" },
  purple:  { stroke: "rgb(220,50,78)",   fill: "rgba(220,50,78,0.06)",   glow: "rgba(220,50,78,0.35)" },
  magenta: { stroke: "rgb(220,50,78)",   fill: "rgba(220,50,78,0.06)",   glow: "rgba(220,50,78,0.35)" },
  emerald: { stroke: "rgb(16,185,129)",  fill: "rgba(16,185,129,0.06)",  glow: "rgba(16,185,129,0.40)" },
  amber:   { stroke: "rgb(245,158,11)",  fill: "rgba(245,158,11,0.06)",  glow: "rgba(245,158,11,0.40)" },
};

/** Connection health indicator thresholds */
const STALE_THRESHOLD_MS = 10_000;
const DEAD_THRESHOLD_MS = 30_000;

export interface RealtimeStreamChartProps {
  streams: StreamConfig[];
  /** Max data points per stream before shifting */
  maxPoints?: number;
  /** Interval in ms between new data points (internal random walk only) */
  interval?: number;
  height?: number;
  className?: string;
  title?: string;
  /**
   * When provided, each outer array entry maps 1:1 to `streams`.
   * The chart replaces internal points with these arrays.
   * Values should be in 0â€“1 range.
   * When not provided, the chart falls back to the internal random walk.
   */
  externalData?: number[][];
}

type StreamState = {
  points: number[];
  label: string;
  accent: Accent;
};

type ConnectionStatus = "live" | "stale" | "disconnected" | "demo";

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  live: "rgb(16,185,129)",
  stale: "rgb(245,158,11)",
  disconnected: "rgb(239,68,68)",
  demo: "rgba(255,255,255,0.2)",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  live: "LIVE",
  stale: "STALE",
  disconnected: "OFFLINE",
  demo: "DEMO",
};

/** Throttle helper â€” prevents excessive tooltip state updates */
function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef(0);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Always schedule via timeout to avoid synchronous setState in effect
    if (pendingTimer.current) clearTimeout(pendingTimer.current);

    const elapsed = lastUpdated.current === 0 ? intervalMs : Date.now() - lastUpdated.current;
    const delay = elapsed >= intervalMs ? 0 : intervalMs - elapsed;

    pendingTimer.current = setTimeout(() => {
      setThrottled(value);
      lastUpdated.current = Date.now();
    }, delay);

    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [value, intervalMs]);

  return throttled;
}

function RealtimeStreamChartInner({
  streams,
  maxPoints = 80,
  interval = 100,
  height = 200,
  className = "",
  title,
  externalData,
}: RealtimeStreamChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(300);
  const streamsRef = useRef<StreamState[]>([]);
  const timeRef = useRef(0);
  const lastExternalUpdateRef = useRef<number>(0);
  const [hoveredStream, setHoveredStream] = useState(-1);
  const hoveredStreamRef = useRef(-1);
  const [rawTooltip, setRawTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    label: string;
  } | null>(null);

  // Throttle tooltip updates to ~60fps max (prevents React re-render storm)
  const tooltip = useThrottle(rawTooltip, 16);

  // Keep ref in sync so RAF loop reads without re-triggering the effect
  const setHoveredStreamSafe = useCallback((idx: number) => {
    if (hoveredStreamRef.current !== idx) {
      hoveredStreamRef.current = idx;
      setHoveredStream(idx);
    }
  }, []);

  // Connection status â€” tracks freshness of external data
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    externalData ? "live" : "demo",
  );

  // Initialize streams (stable â€” only reacts to stream count/label changes)
  useEffect(() => {
    streamsRef.current = streams.map((s, i) => ({
      points:
        s.data?.length ? [...s.data] :
        streamsRef.current[i]?.points?.length ? streamsRef.current[i].points :
        Array.from({ length: 40 }, () => 0.25 + Math.random() * 0.5),
      label: s.label,
      accent: s.accent,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams.length, streams.map((s) => s.label + s.accent).join(",")]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const newW = Math.round(e.contentRect.width);
      if (newW > 0) setW(newW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sync external data into stream refs when provided
  useEffect(() => {
    if (!externalData) return;
    let changed = false;
    for (let i = 0; i < streamsRef.current.length; i++) {
      if (externalData[i] && externalData[i].length > 0) {
        streamsRef.current[i].points = externalData[i].slice(-maxPoints);
        changed = true;
      }
    }
    if (changed) {
      lastExternalUpdateRef.current = Date.now();
    }
  }, [externalData, maxPoints]);

  // Connection status monitor
  useEffect(() => {
    if (!externalData) {
      setConnectionStatus("demo");
      return;
    }

    const checkStatus = () => {
      const elapsed = Date.now() - lastExternalUpdateRef.current;
      if (lastExternalUpdateRef.current === 0) {
        setConnectionStatus("stale");
      } else if (elapsed > DEAD_THRESHOLD_MS) {
        setConnectionStatus("disconnected");
      } else if (elapsed > STALE_THRESHOLD_MS) {
        setConnectionStatus("stale");
      } else {
        setConnectionStatus("live");
      }
    };

    checkStatus();
    const statusInterval = setInterval(checkStatus, 2000);
    return () => clearInterval(statusInterval);
  }, [externalData]);

  // Real-time data feed (only when NOT using external data)
  useEffect(() => {
    if (externalData) return;
    const id = setInterval(() => {
      timeRef.current += 1;
      for (const stream of streamsRef.current) {
        const pts = stream.points;
        const last = pts.length > 0 ? pts[pts.length - 1] : 0.5;
        const noise = (Math.random() - 0.5) * 0.08;
        const sine = Math.sin(timeRef.current * 0.05) * 0.02;
        const next = Math.max(0.03, Math.min(0.97, last + noise + sine));
        pts.push(next);
        if (pts.length > maxPoints) pts.shift();
      }
    }, interval);
    return () => clearInterval(id);
  }, [maxPoints, interval, externalData]);

  // Draw helper: draw a smooth bezier line
  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      pts: number[],
      canvasW: number,
      canvasH: number,
      colors: { stroke: string; fill: string; glow: string },
      isHovered: boolean,
      pulsePhase: number,
    ) => {
      if (pts.length < 2) return;
      const step = canvasW / (pts.length - 1);
      const margin = canvasH * 0.05;
      const usableH = canvasH - margin * 2;

      const getY = (v: number) => canvasH - margin - Math.max(0, Math.min(1, v)) * usableH;

      // Build path
      const path = new Path2D();
      path.moveTo(0, getY(pts[0]));
      for (let i = 1; i < pts.length; i++) {
        const x = i * step;
        const y = getY(pts[i]);
        const prevX = (i - 1) * step;
        const prevY = getY(pts[i - 1]);
        const cpx = (prevX + x) / 2;
        path.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }

      // Fill gradient under line
      const fillPath = new Path2D();
      fillPath.moveTo(0, canvasH);
      fillPath.lineTo(0, getY(pts[0]));
      for (let i = 1; i < pts.length; i++) {
        const x = i * step;
        const y = getY(pts[i]);
        const prevX = (i - 1) * step;
        const prevY = getY(pts[i - 1]);
        const cpx = (prevX + x) / 2;
        fillPath.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
      fillPath.lineTo(canvasW, canvasH);
      fillPath.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
      grad.addColorStop(0, isHovered ? colors.fill.replace("0.06", "0.14") : colors.fill);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fill(fillPath);

      // Glow line (wide, soft)
      ctx.save();
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = isHovered ? 8 : 5;
      ctx.globalAlpha = 0.4;
      ctx.stroke(path);
      ctx.restore();

      // Main line
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke(path);

      // Leading dot with pulse
      const lastX = (pts.length - 1) * step;
      const lastY = getY(pts[pts.length - 1]);
      const pulseR = 3 + Math.sin(pulsePhase) * 1.5;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseR + 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.glow.replace("0.40", "0.08");
      ctx.fill();

      // Mid ring
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseR + 2, 0, Math.PI * 2);
      ctx.fillStyle = colors.glow.replace("0.40", "0.18");
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = colors.stroke;
      ctx.fill();
    },
    [],
  );

  // Animation loop
  useEffect(() => {
    let rafId = 0;
    let tick = 0;
    let isActive = true;

    const loop = () => {
      if (!isActive) return;
      tick++;
      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) { rafId = requestAnimationFrame(loop); return; }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = w * dpr;
      const targetH = height * dpr;
      // Avoid re-setting canvas size every frame (causes flicker)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, height);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const gy = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      // Vertical grid
      const vLines = 8;
      for (let i = 1; i < vLines; i++) {
        const gx = (w / vLines) * i;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // Draw each stream (back to front, hovered last)
      const currentHovered = hoveredStreamRef.current;
      const order = streamsRef.current.map((_, i) => i).sort((a, b) => {
        if (a === currentHovered) return 1;
        if (b === currentHovered) return -1;
        return a - b;
      });

      for (const i of order) {
        const s = streamsRef.current[i];
        if (!s) continue;
        const colors = COLORS[s.accent];
        drawLine(ctx, s.points, w, height, colors, i === currentHovered, tick * 0.06);
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
    };
  }, [w, height, drawLine]);

  // Hit-test mouse for stream hover + tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const margin = height * 0.05;
      const usableH = height - margin * 2;

      let closestDist = Infinity;
      let closestIdx = -1;
      let closestValue = 0;

      for (let si = 0; si < streamsRef.current.length; si++) {
        const pts = streamsRef.current[si].points;
        if (pts.length < 2) continue;
        const step = w / (pts.length - 1);
        // Find the point index closest to mx
        const ptIdx = Math.round(mx / step);
        const clampedIdx = Math.max(0, Math.min(pts.length - 1, ptIdx));
        const py = height - margin - pts[clampedIdx] * usableH;
        const dist = Math.abs(my - py);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = si;
          closestValue = pts[clampedIdx];
        }
      }

      if (closestDist < 30 && closestIdx >= 0) {
        setHoveredStreamSafe(closestIdx);
        setRawTooltip({
          x: mx,
          y: my,
          value: closestValue,
          label: streamsRef.current[closestIdx].label,
        });
      } else {
        setHoveredStreamSafe(-1);
        setRawTooltip(null);
      }
    },
    [w, height, setHoveredStreamSafe],
  );

  return (
    <motion.div
      ref={containerRef}
      className={`relative rounded-md overflow-hidden ${className}`}
      style={{
        height,
        background: "rgba(8,10,25,0.6)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredStreamSafe(-1);
        setRawTooltip(null);
      }}
      role="img"
      aria-label={`Real-time stream chart: ${streams.map((s) => s.label).join(", ")}`}
    >
      {/* Title + Connection Status */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        {title && (
          <span className="text-xs font-mono text-white/30">{title}</span>
        )}
        <span
          className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest"
          style={{ color: STATUS_COLORS[connectionStatus] }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: STATUS_COLORS[connectionStatus],
              boxShadow: connectionStatus === "live" ? `0 0 6px ${STATUS_COLORS.live}` : "none",
              animation: connectionStatus === "live" ? "pulse 2s infinite" : "none",
            }}
          />
          {STATUS_LABELS[connectionStatus]}
        </span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-3">
        {streams.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 cursor-default"
            onMouseEnter={() => setHoveredStreamSafe(i)}
            onMouseLeave={() => setHoveredStreamSafe(-1)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[s.accent].stroke, boxShadow: `0 0 6px ${COLORS[s.accent].glow}` }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: hoveredStream === i ? COLORS[s.accent].stroke : "rgba(255,255,255,0.3)" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        className="block"
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded text-xs font-mono"
          style={{
            left: Math.min(tooltip.x + 12, w - 120),
            top: Math.max(tooltip.y - 8, 4),
            background: "rgba(8,10,25,0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: hoveredStream >= 0 ? COLORS[streams[hoveredStream]?.accent || "cyan"].stroke : "white",
          }}
        >
          <span className="text-white/40 mr-1">{tooltip.label}</span>
          {(tooltip.value * 100).toFixed(1)}%
        </div>
      )}

      {/* Bottom ambient glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{
          background: `linear-gradient(to top, rgba(220,50,78,0.04), transparent)`,
        }}
      />
    </motion.div>
  );
}

/** Memoized export â€” prevents re-renders when parent state changes don't affect this chart */
const RealtimeStreamChart = memo(RealtimeStreamChartInner);
export default RealtimeStreamChart;
