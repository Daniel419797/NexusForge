"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

/* ─────────────────────────────────────────
   NAVBAR – NexusForge cinematic nav
   Glass on scroll, neon logo, smooth mobile menu
   ───────────────────────────────────────── */

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Web3 + AI", href: "#web3-ai" },
];

export default function Navbar() {
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
        scrolled
          ? "bg-black/60 backdrop-blur-xl border-b border-white/6 shadow-2xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav aria-label="Landing page navigation" className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center overflow-hidden">
            <span className="text-white font-extrabold text-sm font-mono relative z-10">
              NF
            </span>
            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-purple-400">
              Nexus
            </span>
            <span className="text-white">Forge</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/40 hover:text-white transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}

          <div className="w-px h-5 bg-white/10" />

          <Link
            href="https://github.com"
            target="_blank"
            className="text-sm text-white/40 hover:text-white transition-colors duration-200"
          >
            GitHub
          </Link>

          {isLoading ? (
            <div className="w-24 h-8 rounded-xl bg-white/5 animate-pulse" />
          ) : isAuthenticated ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/projects"
                className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-shadow duration-300"
              >
                Dashboard
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-white/50 hover:text-white transition-colors duration-200"
              >
                Sign In
              </Link>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-shadow duration-300"
                >
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 relative z-50"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="w-5 h-0.5 bg-white block"
          />
          <motion.span
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-5 h-0.5 bg-white block"
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="w-5 h-0.5 bg-white block"
          />
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
            className="md:hidden bg-black/90 backdrop-blur-2xl border-b border-white/6 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-white/60 hover:text-white transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-3 border-t border-white/6">
                {isLoading ? (
                  <div className="w-full h-10 rounded-xl bg-white/5 animate-pulse" />
                ) : isAuthenticated ? (
                  <Link
                    href="/projects"
                    className="block w-full text-center px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-500 text-white"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="block w-full text-center px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-500 text-white"
                  >
                    Get Started
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
