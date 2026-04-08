"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const coreSystem = [
  { label: "Documentation", href: "#" },
  { label: "OSS GitHub", href: "https://github.com" },
  { label: "Node Status", href: "#" },
];

const protocol = [
  { label: "Changelog", href: "#" },
  { label: "Governance", href: "#" },
  { label: "Terms", href: "/terms" },
];

export default function FooterLanding() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer ref={ref} className="bg-[#0e0e0e] pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 pb-16 border-b border-[#484847]/15"
        >
          {/* Brand */}
          <div>
            <div className="text-sm font-bold tracking-widest mb-4">
              <span className="text-[#81ecff]">NEXUS</span>
              <span className="text-white"> FORGE</span>
            </div>
            <p className="text-xs text-[#adaaaa] leading-relaxed">
              Architecting modular backend systems for the decentralized web.
            </p>
          </div>

          {/* Core System */}
          <div>
            <div className="text-[10px] tracking-widest text-[#adaaaa] mb-6">CORE SYSTEM</div>
            <ul className="space-y-3">
              {coreSystem.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-[#adaaaa] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Protocol */}
          <div>
            <div className="text-[10px] tracking-widest text-[#adaaaa] mb-6">PROTOCOL</div>
            <ul className="space-y-3">
              {protocol.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-[#adaaaa] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="text-[10px] tracking-widest text-[#adaaaa] mb-6">NEWSLETTER</div>
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                aria-label="Email address for newsletter"
                className="flex-1 bg-[#1a1a1a] text-xs text-[#adaaaa] placeholder:text-[#484847] px-4 py-2.5 focus:outline-none font-mono min-w-0"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="px-4 py-2.5 bg-gradient-to-br from-[#81ecff] to-[#00d4ec] text-[#0e0e0e] text-xs font-bold flex-shrink-0"
              >
                &#8594;
              </button>
            </form>
          </div>
        </motion.div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] tracking-wider text-[#484847]">
            &copy; 2024 NEXUS FORGE. THE ARCHITECTURAL VOID.
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#484847] hover:text-[#adaaaa] transition-colors"
            >
              GitHub
            </Link>
            <Link href="#" className="text-[11px] text-[#484847] hover:text-[#adaaaa] transition-colors">
              X
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
