"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Workflow,
  X,
} from "lucide-react";

import type { NavItem } from "@/components/layout/nav-items";

const EXPANDED_ITEMS_KEY = "nexusforge.sidebar.expanded-items";

interface GlassSidebarProps {
  items: NavItem[];
  pathname: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProjectName?: string;
  mobileOpen?: boolean;
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      try {
        const stored = globalThis.localStorage?.getItem(EXPANDED_ITEMS_KEY);
        if (!stored || cancelled) return;
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setExpandedItems(parsed as Record<string, boolean>);
        }
      } catch {
        // Keep the deterministic server-rendered default when storage is unavailable.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(
        EXPANDED_ITEMS_KEY,
        JSON.stringify(expandedItems),
      );
    } catch {
      // Navigation remains usable without persistence.
    }
  }, [expandedItems]);

  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            aria-label="Close navigation"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed left-0 top-0 z-50 h-screen flex-col border-r border-[#1b272d] bg-[#080c0f] ${
          mobileOpen
            ? "flex translate-x-0"
            : "hidden -translate-x-full md:flex md:translate-x-0"
        }`}
        animate={{ width: mobileOpen ? 264 : collapsed ? 64 : 240 }}
        initial={false}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#1b272d] px-3">
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="flex size-9 items-center justify-center text-white/50 md:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <Link
            href="/projects"
            onClick={onMobileClose}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[5px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Workflow className="size-[18px]" aria-hidden="true" />
            </span>
            <AnimatePresence initial={false}>
              {showLabels && (
                <motion.span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-extrabold tracking-[0.08em] text-white"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  NEXUS <span className="text-cyan-300">FORGE</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {activeProjectName && showLabels && (
          <div className="mx-3 mt-3 border border-[#20343d] bg-[#0c1519] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">
              Active project
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-white/75">
              {activeProjectName}
            </p>
          </div>
        )}

        <nav
          aria-label="Workspace navigation"
          className="mt-3 flex-1 space-y-1 overflow-y-auto px-2 pb-4"
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (!item.exact && pathname?.startsWith(`${item.href}/`));
            const hasChildren = Boolean(item.children?.length);
            const expanded = expandedItems[item.href] ?? Boolean(active);

            return (
              <div key={item.href}>
                <div
                  className={`group relative flex min-h-10 items-center rounded-[5px] border transition-colors ${
                    active
                      ? "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200"
                      : "border-transparent text-white/40 hover:border-white/[0.06] hover:bg-white/[0.025] hover:text-white/70"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {showLabels && (
                      <span className="truncate text-[12px] font-semibold">
                        {item.label}
                      </span>
                    )}
                  </Link>

                  {hasChildren && showLabels && (
                    <button
                      type="button"
                      className="mr-1 flex size-8 items-center justify-center text-white/30 hover:text-white/70"
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedItems((current) => ({
                          ...current,
                          [item.href]: !expanded,
                        }))
                      }
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}

                  {collapsed && !mobileOpen && (
                    <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap border border-white/10 bg-[#0a0f12] px-2 py-1 text-[11px] text-white/75 opacity-0 group-hover:opacity-100 md:block">
                      {item.label}
                    </span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {hasChildren && expanded && showLabels && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-[21px] overflow-hidden border-l border-[#1d2a31] py-1 pl-3"
                    >
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onMobileClose}
                          className="block rounded-[4px] px-3 py-2 text-[10px] text-white/35 hover:bg-white/[0.025] hover:text-white/70"
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

        <div className="hidden shrink-0 border-t border-[#1b272d] p-2 md:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex min-h-10 w-full items-center gap-3 rounded-[5px] px-3 text-white/35 hover:bg-white/[0.025] hover:text-white/70"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-[18px]" aria-hidden="true" />
            )}
            {!collapsed && (
              <span className="text-[11px] font-semibold">Collapse</span>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
