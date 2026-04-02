"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

import DashboardService, { type ActivityEntry } from "@/services/DashboardService";
import { useProjectStore } from "@/store/projectStore";

/* ───────────────────────────────────────
   ActivityFeed — Live activity stream
   Wired to GET /api/v1/dashboard/activity
   ─────────────────────────────────────── */

type ActivityType = "create" | "deploy" | "update" | "delete" | "ai";

const TYPE_COLORS: Record<ActivityType, { dot: string; text: string }> = {
  create: { dot: "bg-emerald-400", text: "text-emerald-400/80" },
  deploy: { dot: "bg-cyan-400", text: "text-cyan-400/80" },
  update: { dot: "bg-amber-400", text: "text-amber-400/80" },
  delete: { dot: "bg-rose-400", text: "text-rose-400/80" },
  ai: { dot: "bg-purple-400", text: "text-purple-400/80" },
};

/** Map audit-log action strings to display type */
function resolveType(action: string): ActivityType {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("remove") || a.includes("uninstall")) return "delete";
  if (a.includes("deploy")) return "deploy";
  if (a.includes("update") || a.includes("patch") || a.includes("config")) return "update";
  if (a.includes("ai") || a.includes("generate") || a.includes("chat") || a.includes("analyze")) return "ai";
  return "create";
}

/** Relative time label */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const activeProject = useProjectStore((s) => s.activeProject);

  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      setError(false);
      const data = await DashboardService.getActivity({
        projectId: activeProject?.id,
        limit: 20,
      });
      setItems(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchActivity();
    // Poll every 30s for near-realtime updates
    const interval = setInterval(fetchActivity, 30_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div ref={ref}>
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Activity Feed
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-2 py-2.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white/10 shrink-0 mt-1.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-2 w-1/4 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">Failed to load activity</p>
            <button onClick={fetchActivity} className="mt-2 text-xs text-purple-400/60 hover:text-purple-400/80 transition-colors">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">No activity yet. Start building!</p>
          </div>
        ) : (
          <div className="space-y-0.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
            {items.map((item, i) => {
              const type = resolveType(item.action);
              const { dot, text } = TYPE_COLORS[type];
              const target = item.resource
                ? `${item.resource}${item.resourceId ? ` #${item.resourceId.slice(0, 8)}` : ""}`
                : "";
              return (
                <motion.div
                  key={item.id}
                  className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  {/* Timeline dot + line */}
                  <div className="relative flex flex-col items-center pt-1.5">
                    <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
                    {i < items.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-white/[0.06]" style={{ minHeight: 18 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 leading-snug">
                      <span className={`font-medium ${text}`}>{item.action}</span>{" "}
                      <span className="text-white/50">{target}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-white/25">
                      {item.userName && <span className="text-white/30 mr-1.5">{item.userName}</span>}
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
