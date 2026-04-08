"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

/* ─────────────────────────────────────────────────────
   NAVBAR — Forge Editorial: "Architectural Void"
   No borders. Background shift on scroll.
   All-caps tracking-widest label typography.
   ───────────────────────────────────────────────────── */

const navLinks = [
  { label: "MODULARITY", href: "#features" },
  { label: "WEB3", href: "#web3-ai" },
  { label: "AI AGENTS", href: "#web3-ai" },
  { label: "DOCS", href: "#" },
];

export default function NavbarLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 30);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0e0e0e]/90 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Landing page navigation"
        className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        {/* Brand */}
        <Link href="/" className="flex items-center">
          <span className="text-sm font-bold tracking-widest uppercase">
            <span className="text-[#81ecff]">NEXUS</span>
            <span className="text-white"> FORGE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] font-medium tracking-widest text-[#adaaaa] hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-5">
          {isLoading ? (
            <div className="w-24 h-8 bg-[#1a1a1a] animate-pulse" />
          ) : isAuthenticated ? (
            <Link
              href="/projects"
              className="text-[11px] tracking-widest font-semibold px-5 py-2 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e] hover:opacity-90 transition-opacity"
            >
              DASHBOARD
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[11px] tracking-widest text-[#adaaaa] hover:text-white transition-colors"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="text-[11px] tracking-widest font-semibold px-5 py-2 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e] hover:opacity-90 transition-opacity"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1.5">
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="w-full h-0.5 bg-white block"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-full h-0.5 bg-white block"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
              className="w-full h-0.5 bg-white block"
            />
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[#0e0e0e]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-6 space-y-5">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-[11px] tracking-widest text-[#adaaaa] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4">
                {isLoading ? (
                  <div className="w-full h-10 bg-[#1a1a1a] animate-pulse" />
                ) : isAuthenticated ? (
                  <Link
                    href="/projects"
                    className="block w-full text-center text-[11px] tracking-widest font-semibold px-5 py-3 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e]"
                  >
                    DASHBOARD
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="block w-full text-center text-[11px] tracking-widest font-semibold px-5 py-3 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e]"
                  >
                    SIGN UP
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

