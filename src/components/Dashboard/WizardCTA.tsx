"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface WizardCTAProps {
  onOpenWizard?: () => void;
}

export default function WizardCTA({ onOpenWizard }: WizardCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-1 w-[3px] self-stretch rounded-full" style={{ background: "rgba(129,236,255,0.5)" }} />
        <div className="max-w-md">
          <motion.h3
            className="text-base font-semibold text-white/80"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            Launch your backend in minutes
          </motion.h3>
          <motion.p
            className="mt-1 text-sm leading-relaxed text-white/35"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            The Configuration Wizard walks you through models, auth, storage, and plugin setup.
          </motion.p>
        </div>
      </div>

      <motion.button
        onClick={onOpenWizard}
        className="shrink-0 self-start sm:self-auto text-sm font-medium text-[#81ecff] hover:text-white transition-colors flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.35, delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg aria-hidden="true" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Open Wizard
      </motion.button>
    </div>
  );
}