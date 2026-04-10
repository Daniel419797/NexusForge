"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    number: "01.",
    title: "SECURITY",
    description:
      "Zero-trust architecture. Native JWT, OAuth 2.0, and multi-factor email verification as standard primitives.",
    tag: "PROTOCOL://SECURE-AUTH",
    accent: "text-[#81ecff]",
    bar: "bg-[#81ecff]",
  },
  {
    number: "02.",
    title: "WEB3 NATIVE",
    description:
      "Direct EVM interaction, smart contract hooks, and NFT minting without external middleware.",
    tag: "CHAINED://0X1_MAINNET",
    accent: "text-[#a68cff]",
    bar: "bg-[#a68cff]",
  },
  {
    number: "03.",
    title: "AUTONOMOUS AI",
    description:
      "Embed LLM workflows directly into your data streams. Pluggable models via standardized SDK hooks.",
    tag: "AGENT://MULTI_PROVIDER",
    accent: "text-[#6e9bff]",
    bar: "bg-[#6e9bff]",
  },
];

export default function ProblemSolution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[#131313]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="p-12 xl:p-16 border-r border-[#484847]/15 last:border-r-0 relative"
            >
              {/* Accent bar — module colour on card title */}
              <div className={`w-0.5 h-6 ${f.bar} mb-8`} />
              <div className="text-[10px] tracking-widest text-[#484847] mb-3">{f.number}</div>
              <h3 className="text-xs font-bold tracking-widest text-white mb-5">{f.title}</h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed mb-10">{f.description}</p>
              <span className={`font-mono text-[10px] tracking-wider ${f.accent} opacity-60`}>
                {f.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
