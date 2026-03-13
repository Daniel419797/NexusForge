"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import GlassPanel from "./GlassPanel";

/* ──────────────────────────────────────
   WizardCTA — Hero-size glowing call-to-action
   Links to project creation flow
   ────────────────────────────────────── */

interface WizardCTAProps {
  /** Callback to open the create-project dialog from the parent */
  onOpenWizard?: () => void;
}

export default function WizardCTA({ onOpenWizard }: WizardCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref}>
      <GlassPanel accent="magenta" hover3d className="relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div
          className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,0,170,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <motion.h3
              className="text-xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              Launch your backend in minutes
            </motion.h3>
            <motion.p
              className="mt-2 text-sm leading-relaxed text-white/45"
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Our Configuration Wizard walks you through models, auth, storage, blockchain, and plugin setup — all from a single spatial interface.
            </motion.p>
          </div>

          <motion.button
            onClick={onOpenWizard}
            className="relative shrink-0 rounded-xl px-7 py-3 text-sm font-semibold text-white overflow-hidden"
            style={{
              background: "rgba(168,85,247,0.3)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Shimmer */}
            <span
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open Wizard
            </span>
          </motion.button>
        </div>
      </GlassPanel>
    </div>
  );
}
