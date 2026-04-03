"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────
   Cookie Consent Banner
   Pre-visit banner — shown before any non-essential cookies are set.
   Stores preference in localStorage (no cookie needed for the preference itself).
   ───────────────────────────────────────── */

const CONSENT_KEY = "nf_cookie_consent";

export type CookieConsent = {
  essential: true; // always true — required for auth
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

function storeConsent(consent: CookieConsent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

/** Check if user has given consent for a specific category. */
export function hasCookieConsent(category: keyof Omit<CookieConsent, "timestamp">): boolean {
  const consent = getStoredConsent();
  if (!consent) return category === "essential";
  return consent[category];
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Small delay for better UX — let the page render first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const consent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, []);

  const handleRejectNonEssential = useCallback(() => {
    const consent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const consent: CookieConsent = {
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, [analytics, marketing]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/40">
            {/* Main message */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1.5">Cookie Preferences</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                We use essential cookies for authentication and security. Non-essential cookies (analytics, marketing)
                are only set with your explicit consent.{" "}
                <Link href="/privacy#cookies" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Detailed toggle section */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-3 pt-3 border-t border-white/6">
                    {/* Essential — always on */}
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-white">Essential</span>
                        <p className="text-[11px] text-white/30">Authentication, security, session management. Always required.</p>
                      </div>
                      <div className="w-9 h-5 bg-rose-500/60 rounded-full relative cursor-not-allowed">
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </label>

                    {/* Analytics */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div>
                        <span className="text-xs font-medium text-white group-hover:text-white/80 transition-colors">Analytics</span>
                        <p className="text-[11px] text-white/30">Usage patterns and platform improvement metrics.</p>
                      </div>
                      <button
                        onClick={() => setAnalytics(!analytics)}
                        className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
                          analytics ? "bg-rose-600" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                            analytics ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </label>

                    {/* Marketing */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div>
                        <span className="text-xs font-medium text-white group-hover:text-white/80 transition-colors">Marketing</span>
                        <p className="text-[11px] text-white/30">Personalized content and promotional communications.</p>
                      </div>
                      <button
                        onClick={() => setMarketing(!marketing)}
                        className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
                          marketing ? "bg-rose-600" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                            marketing ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {showDetails ? (
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-2 text-xs font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                >
                  Save Preferences
                </button>
              ) : (
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2 text-xs font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                >
                  Accept All
                </button>
              )}
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/6"
              >
                Essential Only
              </button>
              {!showDetails && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 px-4 py-2 text-xs font-medium rounded-xl text-white/40 hover:text-white/60 transition-colors"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

