"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import GlassPanel from "./GlassPanel";
import PluginService, {
  type PluginMeta,
} from "@/services/PluginService";
import { useProjectStore } from "@/store/projectStore";

/* ───────────────────────────────────────
   PluginGrid — Plugin marketplace preview
   Wired to real PluginService endpoints
   ─────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

interface MergedPlugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  installed: boolean;
  category: string;
  accent: Accent;
}

const CATEGORY_ACCENTS: Record<string, Accent> = {
  core: "cyan",
  payments: "emerald",
  ai: "purple",
  web3: "magenta",
  blockchain: "magenta",
  comms: "amber",
  storage: "cyan",
  auth: "cyan",
};

const CATEGORY_ICONS: Record<string, string> = {
  core: "⚙️",
  payments: "💰",
  ai: "🧠",
  web3: "⛓️",
  blockchain: "⛓️",
  comms: "🔔",
  storage: "📁",
  auth: "🔐",
};

function resolveAccent(category?: string): Accent {
  if (!category) return "cyan";
  return CATEGORY_ACCENTS[category.toLowerCase()] ?? "cyan";
}

function resolveIcon(meta: PluginMeta): string {
  if (meta.icon) return meta.icon;
  if (meta.category) return CATEGORY_ICONS[meta.category.toLowerCase()] ?? "🧩";
  return "🧩";
}

const ACCENT_BG: Record<string, string> = {
  cyan: "rgba(0,245,255,0.06)",
  purple: "rgba(168,85,247,0.06)",
  magenta: "rgba(255,0,170,0.06)",
  emerald: "rgba(16,185,129,0.06)",
  amber: "rgba(245,158,11,0.06)",
};

export default function PluginGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const activeProject = useProjectStore((s) => s.activeProject);

  const [plugins, setPlugins] = useState<MergedPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPlugins = useCallback(async () => {
    if (!activeProject?.id) {
      setPlugins([]);
      setLoading(false);
      return;
    }

    try {
      setError(false);
      const [available, installed] = await Promise.all([
        PluginService.getAvailable(activeProject.id),
        PluginService.getInstalled(activeProject.id),
      ]);

      const installedSet = new Set(installed.map((p) => p.name.toLowerCase()));

      const merged: MergedPlugin[] = available.map((meta, i) => ({
        id: `avail-${i}-${meta.name}`,
        name: meta.name,
        description: meta.description,
        icon: resolveIcon(meta),
        installed: installedSet.has(meta.name.toLowerCase()),
        category: meta.category ?? "General",
        accent: resolveAccent(meta.category),
      }));

      // Add installed plugins not in available list (custom / private)
      for (const ip of installed) {
        if (!available.some((m) => m.name.toLowerCase() === ip.name.toLowerCase())) {
          merged.push({
            id: `inst-${ip.name}`,
            name: ip.name,
            description: `Installed v${ip.version}`,
            icon: "🧩",
            installed: true,
            category: "Custom",
            accent: "purple",
          });
        }
      }

      setPlugins(merged);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const installedCount = plugins.filter((p) => p.installed).length;

  return (
    <div ref={ref}>
      <GlassPanel accent="emerald" hover3d={false}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Plugins
          </h3>
          <span className="text-xs text-white/30">
            {loading ? "…" : `${installedCount}/${plugins.length} active`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-3.5 border border-white/[0.03] animate-pulse"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
                    <div className="h-2 w-full rounded bg-white/[0.04]" />
                    <div className="h-2 w-1/3 rounded bg-white/[0.03]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">Failed to load plugins</p>
            <button
              onClick={fetchPlugins}
              className="mt-2 text-xs text-emerald-400/60 hover:text-emerald-400/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : plugins.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">
              {activeProject ? "No plugins available" : "Select a project to view plugins"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plugins.map((plugin, i) => (
              <motion.div
                key={plugin.id}
                className="group relative rounded-xl p-3.5 border transition-colors cursor-pointer"
                style={{
                  background: ACCENT_BG[plugin.accent],
                  borderColor: plugin.installed
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.03)",
                }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{plugin.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/85 truncate">
                        {plugin.name}
                      </span>
                      {plugin.installed && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/35 line-clamp-2">
                      {plugin.description}
                    </p>
                    <span className="mt-2 inline-block text-[10px] uppercase tracking-wider text-white/20 font-medium">
                      {plugin.category}
                    </span>
                  </div>
                </div>

                {/* Install / Manage overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-xl py-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.03]">
                  <span className="text-[11px] font-medium text-white/50">
                    {plugin.installed ? "Manage →" : "Install →"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
