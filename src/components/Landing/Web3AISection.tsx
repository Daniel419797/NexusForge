"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import GlassCard from "./GlassCard";

/* ─────────────────────────────────────────
   WEB3 + AI + x402 SECTION
   Dark neon showcase with animated demo loop:
   AI → Blockchain tx → x402 micropayment → WS push
   ───────────────────────────────────────── */

const demoSteps = [
  {
    id: 0,
    label: "AI Suggests Yield Strategy",
    detail: "NexusForge AI analyzes Base chain pools and recommends optimal yield allocation.",
    icon: "✦",
    color: "text-rose-400",
    borderColor: "border-rose-600/20",
    bgColor: "bg-rose-600/[0.06]",
  },
  {
    id: 1,
    label: "Sign Transaction on Base",
    detail: "Smart contract call signed and broadcast to Base chain via integrated wallet.",
    icon: "⬡",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bgColor: "bg-cyan-500/[0.06]",
  },
  {
    id: 2,
    label: "x402 Micropayment Flows",
    detail: "API monetization via x402 protocol — pay-per-call with on-chain verification.",
    icon: "◈",
    color: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/20",
    bgColor: "bg-fuchsia-500/[0.06]",
  },
  {
    id: 3,
    label: "Live Result via WebSocket",
    detail: "Transaction confirmation pushed to all connected clients in real-time.",
    icon: "⚡",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/[0.06]",
  },
];

function DemoLoop() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % demoSteps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* Steps timeline */}
      <div className="flex items-center justify-between mb-8 relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/6" />

        {/* Active progress */}
        <motion.div
          className="absolute top-1/2 left-0 h-px bg-linear-to-r from-rose-600 via-cyan-500 to-emerald-500"
          animate={{ width: `${(activeStep / (demoSteps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {demoSteps.map((step, i) => (
          <motion.button
            key={step.id}
            onClick={() => setActiveStep(i)}
            className={`relative z-10 flex flex-col items-center gap-2 group ${
              i <= activeStep ? "opacity-100" : "opacity-30"
            } transition-opacity duration-500`}
          >
            <motion.div
              animate={
                i === activeStep
                  ? { scale: [1, 1.2, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-10 h-10 rounded-xl border ${step.borderColor} ${step.bgColor} flex items-center justify-center text-lg ${step.color}`}
            >
              {step.icon}
            </motion.div>
            <span className="text-[9px] font-mono text-white/40 max-w-20 text-center leading-tight hidden sm:block">
              {step.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Active step detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-xl border ${demoSteps[activeStep].borderColor} ${demoSteps[activeStep].bgColor} p-6`}
        >
          <div className="flex items-start gap-4">
            <div className={`text-2xl ${demoSteps[activeStep].color}`}>
              {demoSteps[activeStep].icon}
            </div>
            <div>
              <h4 className={`font-bold text-lg ${demoSteps[activeStep].color} mb-1`}>
                {demoSteps[activeStep].label}
              </h4>
              <p className="text-sm text-white/50 leading-relaxed">
                {demoSteps[activeStep].detail}
              </p>
            </div>
          </div>

          {/* Fake code snippet */}
          <div className="mt-4 rounded-lg bg-black/40 border border-white/4 p-3 font-mono text-[11px] text-white/40 overflow-x-auto">
            {activeStep === 0 && (
              <>
                <span className="text-rose-400">const</span> suggestion{" "}
                <span className="text-rose-400">=</span>{" "}
                <span className="text-cyan-400">await</span> nexus.ai.
                <span className="text-emerald-400">analyze</span>(
                <span className="text-amber-300">&quot;base-yield&quot;</span>);
              </>
            )}
            {activeStep === 1 && (
              <>
                <span className="text-rose-400">const</span> tx{" "}
                <span className="text-rose-400">=</span>{" "}
                <span className="text-cyan-400">await</span> nexus.blockchain.
                <span className="text-emerald-400">signAndSend</span>(&#123; chain:{" "}
                <span className="text-amber-300">&quot;base&quot;</span> &#125;);
              </>
            )}
            {activeStep === 2 && (
              <>
                <span className="text-rose-400">const</span> payment{" "}
                <span className="text-rose-400">=</span>{" "}
                <span className="text-cyan-400">await</span> nexus.x402.
                <span className="text-emerald-400">charge</span>(&#123; amount:{" "}
                <span className="text-amber-300">0.001</span>, asset:{" "}
                <span className="text-amber-300">&quot;USDC&quot;</span> &#125;);
              </>
            )}
            {activeStep === 3 && (
              <>
                nexus.ws.<span className="text-emerald-400">broadcast</span>(
                <span className="text-amber-300">&quot;tx:confirmed&quot;</span>, &#123;
                hash: tx.hash &#125;);
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Web3AISection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 sm:py-32 px-6 overflow-hidden">
      {/* Dark neon background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-fuchsia-500/2 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-125 h-125 rounded-full bg-rose-600/3 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-100 h-100 rounded-full bg-cyan-500/3 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono text-fuchsia-400/80 uppercase tracking-[0.2em] mb-3">
            Web3 • AI • x402
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            The{" "}
            <span className="text-rose-400">
              Trifecta
            </span>{" "}
            of Modern Backend
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base">
            Watch how AI intelligence, blockchain transactions, and x402 micropayments
            flow together through NexusForge — seamlessly, in real-time.
          </p>
        </motion.div>

        {/* Feature cards row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {[
            {
              title: "AI Agents",
              desc: "Multi-provider AI with agents that reason, plan, and execute.",
              glow: "purple",
              icon: "✦",
            },
            {
              title: "Base Chain",
              desc: "First-class Base chain support with multi-chain extensibility.",
              glow: "cyan",
              icon: "⬡",
            },
            {
              title: "x402 Protocol",
              desc: "Monetize APIs with pay-per-call micropayments on-chain.",
              glow: "magenta",
              icon: "◈",
            },
          ].map((item) => (
            <GlassCard key={item.title} glowColor={item.glow} className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{item.icon}</span>
                <h4 className="font-bold text-white">{item.title}</h4>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Interactive demo loop */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard glowColor="purple" className="p-6 sm:p-8">
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-6">
              ▶ Live Demo Loop
            </div>
            <DemoLoop />
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

