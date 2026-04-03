"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";

/* ────────────────────────────────────────
   GlassTopBar — Floating spatial header
   Solid glass bg, user avatar, actions
   Mobile-responsive with hamburger toggle
   ──────────────────────────────────────── */

interface GlassTopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  sidebarCollapsed: boolean;
  /** Called when the hamburger menu is clicked (mobile) */
  onMenuToggle?: () => void;
  /** True when viewport < md breakpoint */
  isMobile?: boolean;
}

export default function GlassTopBar({
  userName,
  userEmail,
  onLogout,
  sidebarCollapsed,
  onMenuToggle,
  isMobile,
}: GlassTopBarProps) {
  const router = useRouter();
  const activeProject = useProjectStore((s) => s.activeProject);
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <motion.header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-6"
      style={{
        background: "rgba(10,10,12,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left: hamburger (mobile) + connected indicator */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:text-white/70 transition-colors md:hidden"
          style={{ background: "rgba(255,255,255,0.03)" }}
          aria-label="Open sidebar menu"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400/60 font-medium">Connected</span>
        </div>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick action buttons — hidden on mobile */}
        <motion.button
          className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </motion.button>

        <motion.button
          className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (activeProject) {
              router.push(`/projects/${activeProject.id}/deploy`);
            } else {
              router.push("/projects");
            }
          }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
          Deploy
        </motion.button>

        {/* Divider — hidden on mobile */}
        <div className="hidden md:block h-6 w-px bg-white/[0.06]" />

        {/* Notification bell */}
        <motion.button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:text-white/60 transition-colors"
          style={{ background: "rgba(255,255,255,0.02)" }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: "rgba(220,50,78,0.9)" }} />
        </motion.button>

        {/* User avatar */}
        <motion.button
          onClick={onLogout}
          className="group flex items-center gap-2.5"
          whileHover={{ scale: 1.02 }}
          title={`${userName} — Click to logout`}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white/80 transition-all"
            style={{
              background: "rgba(220,50,78,0.18)",
              border: "1px solid rgba(220,50,78,0.15)",
            }}
          >
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white/70 group-hover:text-white/90 transition-colors">
              {userName || "User"}
            </p>
            {userEmail && (
              <p className="text-[10px] text-white/25 truncate max-w-[120px]">{userEmail}</p>
            )}
          </div>
        </motion.button>
      </div>
    </motion.header>
  );
}
