"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { NavItem } from "@/components/layout/nav-items";

const SIDEBAR_EXPANDED_ITEMS_STORAGE_KEY = "nexusforge.sidebar.expanded-items";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   GlassSidebar â€” Spatial glass navigation
   Desktop: fixed collapsible sidebar
   Mobile: overlay drawer with backdrop
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface GlassSidebarProps {
  items: NavItem[];
  pathname: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProjectName?: string;
  /** Mobile drawer open state */
  mobileOpen?: boolean;
  /** Close the mobile drawer */
  onMobileClose?: () => void;
}

export default function GlassSidebar({
  items,
  pathname,
  collapsed,
  onToggleCollapse,
  activeProjectName,
  mobileOpen = false,
  onMobileClose,
}: GlassSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};

    try {
      const stored = window.localStorage.getItem(SIDEBAR_EXPANDED_ITEMS_STORAGE_KEY);
      if (!stored) return {};

      const parsed = JSON.parse(stored);
      return typeof parsed === "object" && parsed !== null ? parsed as Record<string, boolean> : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_EXPANDED_ITEMS_STORAGE_KEY,
      JSON.stringify(expandedItems),
    );
  }, [expandedItems]);

  return (
    <>
      {/* â”€â”€ Mobile backdrop â”€â”€ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* â”€â”€ Sidebar â”€â”€ */}
      <motion.aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
        animate={{
          width: mobileOpen ? 260 : collapsed ? 64 : 240,
        }}
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          background: "rgba(10,10,12,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* â”€â”€ Logo â”€â”€ */}
        <div
          className="flex h-16 items-center gap-3 px-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Close button â€” mobile only */}
          <button
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/40 hover:text-white/60 md:hidden"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Orb */}
          <div
            className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center"
            style={
              {
                background: "rgba(129,236,255,0.10)",
              }
            }
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <AnimatePresence>
            {(!collapsed || mobileOpen) && (
              <motion.span
                className="text-sm font-bold text-white/90 whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                NexusForge
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* â”€â”€ Active project indicator â”€â”€ */}
        <AnimatePresence>
          {activeProjectName && (!collapsed || mobileOpen) && (
            <motion.div
              className="mx-3 mt-3 rounded px-3 py-2"
              style={{
                background: "rgba(129,236,255,0.05)",
                border: "1px solid rgba(129,236,255,0.10)",
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">Active Project</p>
              <p className="text-xs font-semibold text-white/70 truncate">{activeProjectName}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Navigation â”€â”€ */}
        <nav aria-label="Sidebar navigation" className="mt-4 flex-1 overflow-y-auto px-2 space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href ||
              (!item.exact && item.href !== "/" && pathname?.startsWith(item.href + "/"));
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expandedItems[item.href] ?? isActive;
            const showChildren = hasChildren && isExpanded && (!collapsed || mobileOpen);

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                    isActive
                      ? "text-white/95"
                      : "text-white/40 hover:text-white/65 hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-md"
                      style={{
                        background: "rgba(129,236,255,0.06)",
                        border: "1px solid rgba(129,236,255,0.12)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}

                  {/* Left accent line */}
                  {isActive && (
                    <motion.span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
                      style={{ background: "rgba(129,236,255,0.80)" }}
                      layoutId="sidebar-bar"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}

                  <span className="relative z-10 shrink-0">{item.icon}</span>

                  <AnimatePresence>
                    {(!collapsed || mobileOpen) && (
                      <motion.span
                        className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {hasChildren && (!collapsed || mobileOpen) && (
                    <button
                      type="button"
                      aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                      aria-expanded={isExpanded}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setExpandedItems((current) => ({
                          ...current,
                          [item.href]: !current[item.href],
                        }));
                      }}
                      className="relative z-10 rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
                    >
                      <motion.svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </motion.svg>
                    </button>
                  )}

                  {/* Tooltip when collapsed (desktop only) */}
                  {collapsed && !mobileOpen && (
                    <div className="pointer-events-none absolute left-full ml-2 rounded px-2.5 py-1.5 text-xs font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block"
                      style={{
                      background: "rgba(10,10,12,0.97)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </Link>

                <AnimatePresence>
                  {showChildren && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 pl-3 border-l border-white/[0.06] space-y-1 overflow-hidden"
                    >
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onMobileClose}
                          className="block rounded-md px-3 py-1.5 text-[11px] text-white/35 hover:text-white/65 hover:bg-white/[0.03] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* â”€â”€ Collapse toggle (desktop only) â”€â”€ */}
        <div className="shrink-0 px-2 pb-4 pt-2 hidden md:block" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
          >
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </motion.svg>

            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="text-xs font-medium whitespace-nowrap overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
