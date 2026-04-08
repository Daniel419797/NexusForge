"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const frameworks = ["REACT.JS", "NEXT.JS", "VUE", "FLUTTER", "PYTHON", "RUST"];

const codeLines = [
  { indent: 0, parts: [{ color: "#adaaaa", text: "import " }, { color: "#81ecff", text: "{ Nexus } " }, { color: "#adaaaa", text: "from " }, { color: "#a68cff", text: "'@nexus-forge/sdk'" }] },
  { indent: 0, parts: [] },
  { indent: 0, parts: [{ color: "#adaaaa", text: "const " }, { color: "#ffffff", text: "forge " }, { color: "#adaaaa", text: "= " }, { color: "#81ecff", text: "new Nexus" }, { color: "#adaaaa", text: "({" }] },
  { indent: 2, parts: [{ color: "#ffffff", text: "apiKey" }, { color: "#adaaaa", text: ": " }, { color: "#a68cff", text: "process.env.NEXUS_KEY" }, { color: "#adaaaa", text: "," }] },
  { indent: 2, parts: [{ color: "#ffffff", text: "modules" }, { color: "#adaaaa", text: ": [" }, { color: "#a68cff", text: "'auth'" }, { color: "#adaaaa", text: ", " }, { color: "#a68cff", text: "'web3'" }, { color: "#adaaaa", text: ", " }, { color: "#a68cff", text: "'ai'" }, { color: "#adaaaa", text: "]" }] },
  { indent: 0, parts: [{ color: "#adaaaa", text: "});" }] },
  { indent: 0, parts: [] },
  { indent: 0, parts: [{ color: "#81ecff", text: "await " }, { color: "#ffffff", text: "forge" }, { color: "#adaaaa", text: "." }, { color: "#81ecff", text: "init" }, { color: "#adaaaa", text: "(); " }, { color: "#484847", text: "// Deployment live." }] },
];

export default function TechConstellation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="bg-[#131313] py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2
            className="font-black tracking-tighter text-white mb-4"
            style={{
              fontFamily: "var(--font-space-grotesk, var(--font-dm-sans))",
              fontSize: "clamp(2rem,5vw,2.75rem)",
            }}
          >
            IMPLEMENTATION
          </h2>
          <p className="text-sm text-[#adaaaa] mb-14 max-w-sm mx-auto leading-relaxed">
            Initialize your complete backend architecture in three lines of declarative code.
          </p>
        </motion.div>

        {/* Code block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-[#1a1a1a] text-left p-8 mb-20"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 bg-[#20201f] rounded-full" />
            <div className="w-2 h-2 bg-[#20201f] rounded-full" />
            <div className="w-2 h-2 bg-[#20201f] rounded-full" />
            <span className="ml-4 text-[10px] font-mono tracking-widest text-[#484847]">
              NEXUS.INIT.TS
            </span>
          </div>

          <div className="font-mono text-sm leading-8 overflow-x-auto">
            {codeLines.map((line, i) => (
              <div key={i} style={{ paddingLeft: `${line.indent * 0.5}rem` }}>
                {line.parts.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  line.parts.map((part, j) => (
                    <span key={j} style={{ color: part.color }}>
                      {part.text}
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Framework logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-10"
        >
          {frameworks.map((fw, i) => (
            <motion.span
              key={fw}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="text-[10px] tracking-widest text-[#484847] hover:text-[#adaaaa] transition-colors cursor-default"
            >
              {fw}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
