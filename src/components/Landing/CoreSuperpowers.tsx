"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const dbLogos = [
  { name: "POSTGRESQL", abbr: "PG" },
  { name: "MONGODB", abbr: "MDB" },
  { name: "REDIS", abbr: "RD" },
  { name: "BUN.SQL", abbr: "SQL" },
];

export default function CoreSuperpowers() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="bg-[#0e0e0e] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="font-black tracking-tighter text-white leading-none mb-14"
              style={{
                fontFamily: "var(--font-space-grotesk, var(--font-dm-sans))",
                fontSize: "clamp(2rem,5vw,3.5rem)",
              }}
            >
              BRING YOUR OWN
              <br />
              <span className="text-[#81ecff]">DATA ENGINE.</span>
            </h2>

            <div className="space-y-10">
              <div>
                <div className="text-[10px] tracking-widest text-[#484847] mb-3">01/</div>
                <div className="text-xs font-bold tracking-widest text-white mb-2">
                  NATIVE INTROSPECTION
                </div>
                <p className="text-sm text-[#adaaaa] leading-relaxed">
                  Automatic schema discovery for PostgreSQL, MongoDB, and Redis.
                  No manual mapping required.
                </p>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-[#484847] mb-3">02/</div>
                <div className="text-xs font-bold tracking-widest text-white mb-2">
                  EDGE PERSISTENCE
                </div>
                <p className="text-sm text-[#adaaaa] leading-relaxed">
                  Built for distributed runtimes. 1ms cold starts on Cloudflare Workers and Vercel Edge.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — DB logo grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 gap-px bg-[#131313]">
              {dbLogos.map((db, i) => (
                <motion.div
                  key={db.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  className="aspect-square bg-[#0e0e0e] hover:bg-[#1a1a1a] transition-colors duration-300 flex flex-col items-center justify-center gap-4 p-8"
                >
                  <div className="w-12 h-12 bg-[#1a1a1a] flex items-center justify-center">
                    <span className="font-mono text-xs text-[#81ecff] font-bold">{db.abbr}</span>
                  </div>
                  <span className="text-[10px] tracking-widest text-[#adaaaa]">{db.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
