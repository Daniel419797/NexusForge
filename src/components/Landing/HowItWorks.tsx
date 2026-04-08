"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[#0e0e0e] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#484847]/15">
          {/* Mode A: Self-hosted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="bg-[#131313] p-14 md:p-16"
          >
            <div className="text-[10px] tracking-widest text-[#484847] mb-8">MODE A</div>
            <h3
              className="font-black tracking-tight text-white leading-tight mb-6"
              style={{
                fontFamily: "var(--font-space-grotesk, var(--font-dm-sans))",
                fontSize: "clamp(1.5rem,3vw,2.25rem)",
              }}
            >
              SELF-HOSTED
              <br />
              BINARY
            </h3>
            <p className="text-sm text-[#adaaaa] leading-relaxed mb-10">
              Absolute data sovereignty. Run Nexus Forge as a single statically linked
              binary on your own infrastructure.
            </p>
            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-4 text-xs text-[#adaaaa]">
                <span className="w-4 h-px bg-[#484847]" />
                Docker &amp; K8s Compliant
              </div>
              <div className="flex items-center gap-4 text-xs text-[#adaaaa]">
                <span className="w-4 h-px bg-[#484847]" />
                Air-gapped Compatible
              </div>
            </div>
            <Link
              href="#"
              className="inline-block text-[11px] tracking-widest text-[#adaaaa] border border-[#484847]/30 px-6 py-2.5 hover:text-white hover:border-[#484847]/60 transition-colors"
            >
              DOWNLOAD SOURCE
            </Link>
          </motion.div>

          {/* Node B: Managed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-[#0e0e0e] p-14 md:p-16"
          >
            <div className="text-[10px] tracking-widest text-[#81ecff] mb-8">
              NODE B / RECOMMENDED
            </div>
            <h3
              className="font-black tracking-tight text-white leading-tight mb-6"
              style={{
                fontFamily: "var(--font-space-grotesk, var(--font-dm-sans))",
                fontSize: "clamp(1.5rem,3vw,2.25rem)",
              }}
            >
              MANAGED
              <br />
              INFRASTRUCTURE
            </h3>
            <p className="text-sm text-[#adaaaa] leading-relaxed mb-10">
              Global distribution with zero operational overhead. Automated scaling,
              snapshots, and observability.
            </p>
            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-4 text-xs text-[#81ecff]">
                <span className="w-4 h-px bg-[#81ecff]/40" />
                Auto-scaling Global Edge
              </div>
              <div className="flex items-center gap-4 text-xs text-[#81ecff]">
                <span className="w-4 h-px bg-[#81ecff]/40" />
                Real-time Telemetry
              </div>
            </div>
            <Link
              href="/register"
              className="inline-block text-[11px] tracking-widest font-semibold px-6 py-2.5 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e] hover:opacity-90 transition-opacity"
            >
              PROVISION INSTANCE
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
