"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import GlassCard from "./GlassCard";

/* ─────────────────────────────────────────
   CORE SUPERPOWERS – Interactive 3D orbital cards
   Each card tilts on hover with neon glow,
   click to expand for details
   ───────────────────────────────────────── */

const superpowers = [
  {
    id: "wizard",
    title: "No-Code Wizard",
    subtitle: "Point. Click. Deploy.",
    description:
      "Visual configuration wizard that generates production-ready backends. Define models, routes, and permissions without writing a single line of code.",
    icon: (
      <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    color: "cyan",
    visual: (
      <div className="space-y-2 mt-4">
        {["Define Schema", "Configure Auth", "Set Permissions", "Deploy"].map((step, i) => (
          <motion.div
            key={step}
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: "100%", opacity: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-[10px] text-cyan-400 font-mono shrink-0">
              {i + 1}
            </div>
            <div className="h-px flex-1 bg-linear-to-r from-cyan-500/30 to-transparent" />
            <span className="text-[11px] font-mono text-cyan-400/60">{step}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "realtime",
    title: "Real-Time Everywhere",
    subtitle: "WebSockets at the Core.",
    description:
      "Native WebSocket gateway with rooms, channels, typing indicators, and live notifications. Every module pushes updates in real-time.",
    icon: (
      <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: "magenta",
    visual: (
      <div className="flex items-center justify-center gap-6 mt-4 min-h-15">
        {["User A", "Server", "User B"].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <motion.div
              className={`w-10 h-10 rounded-xl border ${i === 1 ? "border-fuchsia-500/30 bg-fuchsia-500/10" : "border-white/10 bg-white/5"} flex items-center justify-center`}
              animate={i === 1 ? {} : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[10px] font-mono text-white/60">{label.charAt(0)}</span>
            </motion.div>
            <span className="text-[9px] font-mono text-white/40">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "plugins",
    title: "Vetted Plugin Marketplace",
    subtitle: "GitHub PR Flow.",
    description:
      "Extend NexusForge with community plugins. Every plugin is submitted via GitHub PR, reviewed, and security-vetted before listing.",
    icon: (
      <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
    color: "purple",
    visual: (
      <div className="flex items-center gap-2 mt-4">
        {["Submit PR", "Review", "Security Audit", "Listed ✓"].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="w-3 h-3 rounded-full bg-rose-600/30 border border-rose-600/30 mx-auto mb-1" />
            <span className="text-[8px] sm:text-[9px] font-mono text-rose-400/60 leading-tight block">{step}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "blockchain",
    title: "Blockchain / Web3 Ready",
    subtitle: "Base Chain Prioritized.",
    description:
      "Manage wallets, track transactions, handle NFTs, and monitor smart contract events. Full Base chain integration with multi-chain support.",
    icon: (
      <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
    color: "cyan",
    visual: (
      <motion.div
        className="flex items-center justify-center mt-4 gap-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-bold text-cyan-400"
          >
            Ⓑ
          </motion.div>
        </div>
        <span className="text-[10px] font-mono text-white/40">Base • Ethereum • Multi-chain</span>
      </motion.div>
    ),
  },
  {
    id: "ai",
    title: "AI Built-In",
    subtitle: "Multi-Provider Intelligence.",
    description:
      "Text generation, chat completion, image understanding, and custom AI agents. Supports OpenAI, Anthropic, Google, and more.",
    icon: (
      <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    color: "magenta",
    visual: (
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        {["OpenAI", "Anthropic", "Google", "Mistral", "Groq"].map((provider) => (
          <span
            key={provider}
            className="text-[9px] font-mono text-fuchsia-400/50 border border-fuchsia-500/15 rounded-full px-2.5 py-0.5 bg-fuchsia-500/5"
          >
            {provider}
          </span>
        ))}
      </div>
    ),
  },
];

export default function CoreSuperpowers() {
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-24 sm:py-32 px-6 overflow-hidden">
      {/* Background neon accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-rose-600/4 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono text-cyan-400/80 uppercase tracking-[0.2em] mb-3">
            Core Superpowers
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-rose-400">
              Everything
            </span>{" "}
            You Need. Nothing You Don&apos;t.
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm sm:text-base">
            Five pillars that make NexusForge the definitive Backend-as-a-Service
            for the post-code era.
          </p>
        </motion.div>

        {/* Orbital card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {superpowers.map((power, i) => (
            <motion.div
              key={power.id}
              initial={{ opacity: 0, y: 60 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={i === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}
            >
              <GlassCard
                glowColor={power.color}
                className="h-full cursor-pointer"
              >
                <div
                  className="p-6"
                  onClick={() => setActive(active === power.id ? null : power.id)}
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      power.color === "cyan"
                        ? "bg-cyan-500/10 text-cyan-400"
                        : power.color === "magenta"
                          ? "bg-fuchsia-500/10 text-fuchsia-400"
                          : "bg-rose-600/10 text-rose-400"
                    }`}
                  >
                    {power.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-1">
                    {power.title}
                  </h3>
                  <p
                    className={`text-xs font-mono mb-3 ${
                      power.color === "cyan"
                        ? "text-cyan-400/60"
                        : power.color === "magenta"
                          ? "text-fuchsia-400/60"
                          : "text-rose-400/60"
                    }`}
                  >
                    {power.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-white/40 leading-relaxed">
                    {power.description}
                  </p>

                  {/* Visual mini-animation */}
                  <AnimatePresence>
                    {active === power.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        {power.visual}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expand hint */}
                  <div className="mt-3 text-[10px] font-mono text-white/20">
                    {active === power.id ? "Click to collapse" : "Click to explore →"}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

