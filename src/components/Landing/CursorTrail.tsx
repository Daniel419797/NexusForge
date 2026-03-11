"use client";

import { useEffect, useRef } from "react";

/* Cursor glow trail – leaves a faint neon path as you move */
export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number = 0;
    let running = false;
    const trail: { x: number; y: number; age: number }[] = [];
    const MAX_AGE = 25;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const startLoop = () => {
      if (running) return;
      running = true;
      draw();
    };

    const onMove = (e: PointerEvent) => {
      trail.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trail.length > 50) trail.shift();
      startLoop();
    };
    window.addEventListener("pointermove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++;
        if (trail[i].age > MAX_AGE) {
          trail.splice(i, 1);
          continue;
        }
        const alpha = 1 - trail[i].age / MAX_AGE;
        const radius = 3 + alpha * 8;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.15})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.3})`;
        ctx.fill();
      }
      // Stop loop when trail is empty — save GPU cycles
      if (trail.length === 0) {
        running = false;
        return;
      }
      animId = requestAnimationFrame(draw);
    };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-9999 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
