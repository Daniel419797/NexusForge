"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import GlassPanel from "./GlassPanel";

/* ──────────────────────────────────────
   WizardCTA — Call-to-action banner
   Clean, brand-accented flat card
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
      <GlassPanel accent="brand">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <motion.h3
              className="text-xl font-bold text-white/90"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
            >
              Launch your backend in minutes
            </motion.h3>
            <motion.p
              className="mt-2 text-sm leading-relaxed text-white/45"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              Our Configuration Wizard walks you through models, auth, storage, blockchain, and plugin setup — all from a single interface.
            </motion.p>
          </div>

          <motion.button
            onClick={onOpenWizard}
            className="relative shrink-0 rounded-xl px-7 py-3 text-sm font-semibold text-white"
            style={{
              background: "rgba(220,50,78,0.18)",
              border: "1px solid rgba(220,50,78,0.25)",
            }}
            whileHover={{ scale: 1.03, background: "rgba(220,50,78,0.25)" }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <span className="flex items-center gap-2">
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
