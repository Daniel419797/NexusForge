"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ─────────────────────────────────────────
   TECH STACK CONSTELLATION
   Animated icon grid with neural lines
   connecting related technologies
   ───────────────────────────────────────── */

const techItems = [
  { name: "Next.js", category: "Frontend", x: 15, y: 20 },
  { name: "React", category: "Frontend", x: 30, y: 15 },
  { name: "TypeScript", category: "Language", x: 50, y: 10 },
  { name: "Fastify", category: "Backend", x: 70, y: 18 },
  { name: "Node.js", category: "Runtime", x: 85, y: 12 },
  { name: "PostgreSQL", category: "Database", x: 20, y: 45 },
  { name: "Drizzle ORM", category: "ORM", x: 40, y: 40 },
  { name: "Redis", category: "Cache", x: 60, y: 42 },
  { name: "WebSocket", category: "Real-time", x: 80, y: 38 },
  { name: "Docker", category: "DevOps", x: 10, y: 70 },
  { name: "Three.js", category: "3D", x: 25, y: 68 },
  { name: "Framer Motion", category: "Animation", x: 45, y: 65 },
  { name: "Tailwind CSS", category: "Styling", x: 65, y: 72 },
  { name: "Base Chain", category: "Web3", x: 80, y: 65 },
  { name: "Viem", category: "Web3", x: 90, y: 55 },
  { name: "BullMQ", category: "Queues", x: 35, y: 85 },
  { name: "GSAP", category: "Animation", x: 55, y: 88 },
  { name: "OpenAI", category: "AI", x: 75, y: 85 },
];

// Define connections between related tech
const connections: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Frontend → Backend flow
  [5, 6], [6, 7], [7, 8],          // Data layer
  [9, 5], [3, 7],                   // Docker → PG, Fastify → Redis
  [10, 11], [11, 12],               // 3D & Animation
  [13, 14],                          // Web3
  [15, 3], [16, 11],                // BullMQ → Fastify, GSAP → Framer
  [17, 2],                           // OpenAI → TypeScript
  [4, 8],                            // Node → WebSocket
];

const categoryColors: Record<string, string> = {
  Frontend: "rgb(0, 240, 255)",
  Language: "rgb(168, 85, 247)",
  Backend: "rgb(255, 0, 229)",
  Runtime: "rgb(34, 197, 94)",
  Database: "rgb(59, 130, 246)",
  ORM: "rgb(99, 102, 241)",
  Cache: "rgb(239, 68, 68)",
  "Real-time": "rgb(0, 240, 255)",
  DevOps: "rgb(34, 197, 94)",
  "3D": "rgb(168, 85, 247)",
  Animation: "rgb(255, 0, 229)",
  Styling: "rgb(0, 240, 255)",
  Web3: "rgb(59, 130, 246)",
  Queues: "rgb(245, 158, 11)",
  AI: "rgb(168, 85, 247)",
};

export default function TechConstellation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 sm:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono text-cyan-400/80 uppercase tracking-[0.2em] mb-3">
            Tech Stack
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Built With the{" "}
            <span className="text-purple-400">
              Best
            </span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm sm:text-base">
            Modern, battle-tested technologies connected in a powerful constellation.
          </p>
        </motion.div>

        {/* Constellation map */}
        <div className="relative w-full aspect-video max-h-125">
          {/* SVG connections */}
          <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map(([a, b], i) => {
              const from = techItems[a];
              const to = techItems[b];
              return (
                <motion.line
                  key={i}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="rgba(0, 240, 255, 0.08)"
                  strokeWidth={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{
                    duration: 1.2,
                    delay: 0.5 + i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              );
            })}

            {/* Animated pulse along connections */}
            {connections.slice(0, 8).map(([a, b], i) => {
              const from = techItems[a];
              const to = techItems[b];
              return (
                <motion.circle
                  key={`pulse-${i}`}
                  r={2}
                  fill="rgba(0, 240, 255, 0.6)"
                  initial={{ opacity: 0 }}
                  animate={
                    inView
                      ? {
                          cx: [`${from.x}%`, `${to.x}%`],
                          cy: [`${from.y}%`, `${to.y}%`],
                          opacity: [0, 0.8, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    delay: 1 + i * 0.3,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "linear",
                  }}
                />
              );
            })}
          </svg>

          {/* Tech nodes */}
          {techItems.map((tech, i) => (
            <motion.div
              key={tech.name}
              className="absolute group cursor-default"
              style={{
                left: `${tech.x}%`,
                top: `${tech.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.06,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              whileHover={{ scale: 1.3, zIndex: 10 }}
            >
              {/* Glow halo */}
              <div
                className="absolute -inset-3 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                style={{ background: categoryColors[tech.category] }}
              />

              {/* Node dot */}
              <div
                className="relative w-3 h-3 rounded-full border"
                style={{
                  background: categoryColors[tech.category],
                  borderColor: `${categoryColors[tech.category]}40`,
                  boxShadow: `0 0 8px ${categoryColors[tech.category]}30`,
                }}
              />

              {/* Label */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1">
                  <div className="text-[10px] font-mono text-white font-medium">
                    {tech.name}
                  </div>
                  <div
                    className="text-[8px] font-mono mt-0.5"
                    style={{ color: categoryColors[tech.category] }}
                  >
                    {tech.category}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12"
        >
          {Object.entries(categoryColors)
            .filter((_, i) => i % 2 === 0)
            .map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[10px] font-mono text-white/30">
                  {name}
                </span>
              </div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
