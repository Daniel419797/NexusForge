"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ParticleButton from "./ParticleButton";
import { FloatingElement } from "./AnimationWrappers";

/* ─────────────────────────────────────────
   HERO – Full viewport cinematic opener
   Massive glitch-hologram headline,
   cycling subtitle, floating dashboard,
   two neon CTA buttons
   ───────────────────────────────────────── */

const CYCLE_WORDS = [
  "Self-hosted",
  "Real-time",
  "AI Agents",
  "Web3 Ready",
  "x402 Payments",
  "Multi-tenant",
  "Plugin Marketplace",
];

function TypewriterCycle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLE_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-3 h-8">
      <span className="text-cyan-400 text-sm">●</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={CYCLE_WORDS[index]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-lg sm:text-xl text-white/80 tracking-wide"
        >
          {CYCLE_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Floating holographic dashboard mockup */
function HoloDashboard() {
  return (
    <FloatingElement amplitude={10} duration={5}>
      <div className="relative w-85 sm:w-120 lg:w-150 mx-auto">
        {/* Main card */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-[rgba(8,10,25,0.85)] p-4 sm:p-6 shadow-2xl">
          {/* Glow behind */}
          <div className="absolute -inset-1 rounded-2xl bg-purple-500/20 blur-xl opacity-60" />

          <div className="relative z-10">
            {/* Title bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[10px] font-mono text-white/30">
                nexusforge.local/dashboard
              </span>
            </div>

            {/* Mock dashboard content */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Active Projects", value: "12", color: "text-cyan-400" },
                { label: "WebSocket Conns", value: "1.2k", color: "text-fuchsia-400" },
                { label: "AI Queries", value: "48k", color: "text-purple-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className={`text-lg font-bold font-mono ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Fake code / AI chat line */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-cyan-400/60 font-mono mb-1">
                  AI Assistant
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.2,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingElement>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    const words = headingRef.current.querySelectorAll(".hero-word");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        words,
        {
          y: 100,
          opacity: 0,
          rotateX: -40,
          skewY: 4,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          skewY: 0,
          duration: 1,
          stagger: 0.08,
        },
        0.3
      );

      // Glitch flash on certain words
      tl.to(".hero-accent", {
        textShadow:
          "0 0 20px rgba(0,240,255,0.6), 0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(255,0,229,0.2)",
        duration: 0.6,
        ease: "power2.out",
      }, "-=0.3");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const line1Words = ["Forge", "Your", "Backend."];
  const line2Words = ["No", "Code."];
  const line3Words = ["Full", "Power."];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-12"
    >
      {/* Radial vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.7)_100%)] pointer-events-none z-[1]" />

      {/* Scan lines subtle */}
      <div
        className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300/80 uppercase tracking-widest">
            Open Source • Self-Hosted • v1.0
          </span>
        </motion.div>

        {/* Kinetic Headline */}
        <h1
          ref={headingRef}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tighter mb-6"
          style={{ perspective: "1000px" }}
        >
          <span className="block">
            {line1Words.map((word, i) => (
              <span
                key={i}
                className={`hero-word inline-block mr-[0.25em] opacity-0 ${word === "Forge" ? "hero-accent text-purple-400" : "text-white"}`}
              >
                {word}
              </span>
            ))}
          </span>
          <span className="block">
            {line2Words.map((word, i) => (
              <span
                key={i}
                className="hero-word inline-block mr-[0.25em] opacity-0 text-white/70"
              >
                {word}
              </span>
            ))}
            {line3Words.map((word, i) => (
              <span
                key={i}
                className={`hero-word inline-block mr-[0.25em] opacity-0 ${word === "Power." ? "hero-accent text-purple-400" : "text-white/70"}`}
              >
                {word}
              </span>
            ))}
          </span>
        </h1>

        {/* Cycling subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mb-10"
        >
          <TypewriterCycle />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <ParticleButton variant="primary" href="#deploy">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0h.375a2.625 2.625 0 010 5.25H3.375a2.625 2.625 0 010-5.25H3.75" />
            </svg>
            Deploy Now (Docker)
          </ParticleButton>
          <ParticleButton variant="secondary" href="#demo">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            See It in Action (60s)
          </ParticleButton>
        </motion.div>

        {/* Floating holographic dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <HoloDashboard />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 rounded-full bg-cyan-400/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
