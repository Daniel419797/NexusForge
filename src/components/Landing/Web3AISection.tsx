"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function Web3AISection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="web3-ai" className="bg-[#0e0e0e] py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#131313]">
          {/* Web3 card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="bg-[#0e0e0e] p-12"
          >
            <div className="inline-flex items-center gap-2 bg-[#591adc]/20 rounded-full px-3 py-1 mb-8">
              <span className="text-[10px] tracking-widest text-[#e4daff]">WEB3</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-4">
              EVM Native Protocol
            </h3>
            <p className="text-sm text-[#adaaaa] leading-relaxed mb-8">
              Deploy smart contracts, manage wallets, and interact with EVM chains
              without leaving your backend.
            </p>
            <span className="font-mono text-[10px] text-[#a68cff]">CHAIN://EVM_MAINNET</span>
          </motion.div>

          {/* AI card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-[#131313] p-12"
          >
            <div className="inline-flex items-center gap-2 bg-[#6e9bff]/10 rounded-full px-3 py-1 mb-8">
              <span className="text-[10px] tracking-widest text-[#6e9bff]">AI AGENTS</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-4">
              Autonomous Data Streams
            </h3>
            <p className="text-sm text-[#adaaaa] leading-relaxed mb-8">
              Embed any LLM provider via the standardized adapter interface.
              OpenAI, Anthropic, Grok, HuggingFace — one SDK.
            </p>
            <span className="font-mono text-[10px] text-[#6e9bff]">AGENT://MULTI_PROVIDER</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
