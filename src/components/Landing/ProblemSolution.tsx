"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CinematicReveal } from "./AnimationWrappers";

/* ─────────────────────────────────────────
   PROBLEM → SOLUTION cinematic split
   Left: chaotic code explosion
   Right: clean dashboard + AI chat
   ───────────────────────────────────────── */

// Deterministic seeded random — identical on server & client (no hydration mismatch)
function seededRand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const CHAOS_ROTATIONS = Array.from({ length: 12 }, (_, i) => (seededRand(i * 3 + 0) - 0.5) * 3);
const CHAOS_OFFSETS = Array.from({ length: 12 }, (_, i) => (seededRand(i * 3 + 1) - 0.5) * 20);
const CHAOS_OPACITIES = Array.from({ length: 12 }, (_, i) => 0.4 + seededRand(i * 3 + 2) * 0.4);

function ChaoticCode() {
  const lines = [
    "ERROR: Cannot connect to DB",
    "FATAL: Auth middleware undefined",
    "npm ERR! 403 Forbidden",
    "WebSocket ECONNREFUSED :8080",
    "TypeError: undefined is not a fn",
    "CORS policy blocked origin",
    "JWT expired at 1704067200",
    "Memory leak detected in worker",
    "RateLimiter: 429 Too Many",
    "SSL_ERROR_HANDSHAKE_FAILED",
    "Docker container exited (137)",
    "Redis connection timed out",
  ];

  return (
    <div className="relative h-full flex flex-col justify-center p-6 overflow-hidden">
      {/* Red glow */}
      <div className="absolute inset-0 bg-linear-to-br from-red-500/6 to-transparent" />

      <div className="relative z-10 space-y-2">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20, rotate: CHAOS_ROTATIONS[i] }}
            whileInView={{
              opacity: [0, 0.8, CHAOS_OPACITIES[i]],
              x: 0,
              rotate: CHAOS_ROTATIONS[i] * 0.5,
            }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            viewport={{ once: true }}
            className="font-mono text-[10px] sm:text-xs text-red-400/70 whitespace-nowrap"
            style={{
              transform: `translateX(${CHAOS_OFFSETS[i]}px)`,
            }}
          >
            <span className="text-red-500/50 mr-2">✕</span>
            {line}
          </motion.div>
        ))}
      </div>

      {/* Overlay chaos scatter */}
      <div className="absolute top-1/4 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
    </div>
  );
}

function CleanDashboard() {
  return (
    <div className="relative h-full flex flex-col justify-center p-6">
      {/* Cyan glow */}
      <div className="absolute inset-0 bg-linear-to-bl from-cyan-500/4 to-transparent" />

      <div className="relative z-10 space-y-4">
        {/* Mock panel rows */}
        {[
          { icon: "✓", label: "Auth & OAuth configured", color: "text-emerald-400" },
          { icon: "✓", label: "Real-time WebSocket ready", color: "text-emerald-400" },
          { icon: "✓", label: "AI provider connected", color: "text-emerald-400" },
          { icon: "✓", label: "Blockchain wallet synced", color: "text-emerald-400" },
          { icon: "✓", label: "Plugins marketplace live", color: "text-emerald-400" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/6 bg-white/2"
          >
            <span className={`${item.color} text-sm font-bold`}>{item.icon}</span>
            <span className="text-xs sm:text-sm text-white/70 font-mono">
              {item.label}
            </span>
          </motion.div>
        ))}

        {/* AI chat bubble */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/4 mt-2"
        >
          <div className="w-6 h-6 rounded-lg bg-linear-to-br from-cyan-500 to-purple-500 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-cyan-400/60 font-mono mb-1">NexusForge AI</div>
            <div className="text-xs text-white/60 leading-relaxed">
              All services deployed. Your API is live at
              <span className="text-cyan-400 font-mono"> /api/v1</span> with
              real-time, auth, and AI ready.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProblemSolution() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const leftX = useTransform(scrollYProgress, [0, 0.5], [-60, 0]);
  const rightX = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const dividerScale = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);

  return (
    <section ref={containerRef} className="relative py-24 sm:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <CinematicReveal className="text-center mb-16">
          <span className="inline-block text-xs font-mono text-cyan-400/80 uppercase tracking-[0.2em] mb-3">
            The Problem → The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-red-400/80">Stop Rebuilding.</span>{" "}
            <span className="text-purple-400">
              Start Forging.
            </span>
          </h2>
        </CinematicReveal>

        {/* Split panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-1 relative">
          {/* Left: chaos */}
          <motion.div
            style={{ x: leftX }}
            className="relative rounded-2xl border border-red-500/10 bg-[rgba(8,10,25,0.75)] min-h-100 overflow-hidden"
          >
            <div className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-widest text-red-400/50">
              Before NexusForge
            </div>
            <ChaoticCode />
          </motion.div>

          {/* Center divider */}
          <motion.div
            style={{ scaleY: dividerScale }}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-cyan-500/40 to-transparent origin-top"
          />

          {/* Right: solution */}
          <motion.div
            style={{ x: rightX }}
            className="relative rounded-2xl border border-cyan-500/10 bg-[rgba(8,10,25,0.75)] min-h-100 overflow-hidden"
          >
            <div className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest text-cyan-400/50">
              With NexusForge
            </div>
            <CleanDashboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
