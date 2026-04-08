"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* -----------------------------------------------------------
   HERO -- Forge Editorial: "Architectural Void"
   "THE BACKEND YOU OWN." two-line display heading,
   SYSTEMS ARCHITECTURE badge, two editorial CTAs.
   No borders. Surface shifts define the space.
   ----------------------------------------------------------- */

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Ambient tint glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(129,236,255,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Architecture badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="text-[10px] tracking-[0.3em] text-[#adaaaa] uppercase">
            SYSTEMS ARCHITECTURE V2.4.0
          </span>
        </motion.div>

        {/* Display headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-black tracking-tighter leading-none mb-6 select-none"
          style={{ fontFamily: "var(--font-space-grotesk, var(--font-dm-sans))" }}
        >
          <span className="block text-white text-[clamp(3.5rem,10vw,8rem)]">
            THE BACKEND
          </span>
          <span className="block text-[#81ecff] italic text-[clamp(3.5rem,10vw,8rem)]">
            YOU OWN.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-[#adaaaa] text-base sm:text-lg max-w-lg mx-auto mb-12 leading-relaxed"
        >
          Modular. Scalable. Decentralized. Build with high-performance
          primitives or craft custom logic in a terminal-first environment.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="px-9 py-3.5 text-[11px] font-semibold tracking-[0.2em] bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e] hover:opacity-90 transition-opacity"
          >
            INITIALIZE FORGE
          </Link>
          <Link
            href="#"
            className="px-9 py-3.5 text-[11px] font-semibold tracking-[0.2em] text-[#adaaaa] hover:text-white transition-colors"
          >
            READ MANIFEST
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
