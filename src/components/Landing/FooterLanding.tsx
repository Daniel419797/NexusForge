"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import ParticleButton from "./ParticleButton";

/* ─────────────────────────────────────────
   FOOTER – NexusForge cinematic footer
   GitHub, docs, contact + project credit
   ───────────────────────────────────────── */

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Tech Stack", href: "#tech-stack" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Plugin SDK", href: "#" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: "#" },
      { label: "Twitter / X", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export default function FooterLanding() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <footer ref={ref} className="relative border-t border-white/4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-rose-600/2 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-16 backdrop-blur-2xl relative z-10">
        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            Ready to{" "}
            <span className="text-rose-400">
              Forge Something Remarkable
            </span>
            ?
          </h3>
          <p className="text-white/40 text-sm mb-6 max-w-lg mx-auto">
            Deploy your own NexusForge instance in minutes. Self-hosted, open-source,
            and built for the builders.
          </p>
          <div className="flex items-center justify-center gap-4">
            <ParticleButton variant="primary" href="https://github.com">
              <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </ParticleButton>
            <ParticleButton variant="secondary" href="#deploy">
              Deploy with Docker
            </ParticleButton>
          </div>
        </motion.div>

        {/* Links grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-cyan-500 via-rose-600 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs font-mono">NF</span>
              </div>
              <span className="text-sm font-bold">
                <span className="text-cyan-400">Nexus</span>
                <span className="text-white">Forge</span>
              </span>
            </Link>
            <p className="text-xs text-white/30 leading-relaxed max-w-50">
              The self-hosted, no-code Backend-as-a-Service for the post-code era.
              AI, Web3, Real-time — all in one.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/20 font-mono">
            © 2026 NexusForge. Final Year Project by Daniel.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors font-mono"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors font-mono"
            >
              Terms
            </Link>
            <span className="text-[11px] text-white/10 font-mono">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

