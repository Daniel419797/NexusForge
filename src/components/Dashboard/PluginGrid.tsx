"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import PluginService, {
  type PluginMeta,
} from "@/services/PluginService";
import { useProjectStore } from "@/store/projectStore";

/* -----------------------------------
   PluginGrid - Plugin marketplace preview
   Wired to real PluginService endpoints
   ----------------------------------- */

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
  core: "",
  payments: "",
  ai: "",
  web3: "",
  blockchain: "",
  comms: "",
  storage: "",
  auth: "",
};

function resolveAccent(category?: string): Accent {
  if (!category) return "cyan";
  return CATEGORY_ACCENTS[category.toLowerCase()] ?? "cyan";
}

function resolveIcon(meta: PluginMeta): string {
  if (meta.icon) return meta.icon;
  if (meta.category) return CATEGORY_ICONS[meta.category.toLowerCase()] ?? "";
  return "";
}

const ACCENT_BG: Record<string, string> = {
  cyan:    "rgba(129,236,255,0.03)",
  purple:  "rgba(166,140,255,0.03)",
  magenta: "rgba(166,140,255,0.03)",
  emerald: "rgba(16,185,129,0.03)",
  amber:   "rgba(245,158,11,0.03)",
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
      const [availableResponse, installedResponse] = await Promise.all([
        PluginService.getAvailable(activeProject.id),
        PluginService.getInstalled(activeProject.id),
      ]);
      const available = Array.isArray(availableResponse) ? availableResponse : [];
      const installed = Array.isArray(installedResponse) ? installedResponse : [];

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
            icon: "",
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

  let content: ReactNode;
  if (error) {
    content = (
      <div className="py-8 text-center">
        <p className="text-xs text-white/25">Failed to load plugins</p>
        <button
          onClick={fetchPlugins}
          className="mt-2 text-xs text-emerald-400/60 hover:text-emerald-400/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  } else if (plugins.length === 0) {
    content = (
      <div className="py-8 text-center">
        <p className="text-xs text-white/25">
          {activeProject ? "No plugins available" : "Select a project to view plugins"}
        </p>
      </div>
    );
  } else {
    content = (
      <div className="divide-y divide-white/[0.04]">
        {plugins.map((plugin, i) => (
          <motion.div
            key={plugin.id}
            className="group flex items-center gap-3 py-2.5 -mx-2 px-2 hover:bg-white/[0.02] rounded transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <span className="text-base shrink-0">{plugin.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/75 truncate">{plugin.name}</span>
                {plugin.installed && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-white/30 line-clamp-1">{plugin.description}</p>
            </div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider shrink-0 hidden sm:block">{plugin.category}</span>
            <span className="text-[11px] text-white/20 group-hover:text-[#81ecff] transition-colors shrink-0">
              {plugin.installed ? "Manage" : "Install"} &rarr;
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Plugins
          </h3>
          <span className="text-xs text-white/30">
            {loading ? "..." : `${installedCount}/${plugins.length} active`}
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {["sk-1","sk-2","sk-3","sk-4","sk-5","sk-6"].map((id) => (
              <div key={id} className="flex items-center gap-3 py-2.5 animate-pulse">
                <div className="h-5 w-5 rounded bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
                  <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
                </div>
                <div className="h-2.5 w-10 rounded bg-white/[0.03]" />
              </div>
            ))}
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}