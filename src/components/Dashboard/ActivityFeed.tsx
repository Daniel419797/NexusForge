"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";

import { type ActivityEntry } from "@/services/DashboardService";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useProjectStore } from "@/store/projectStore";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ActivityFeed â€” Live activity stream
  Wired to WS event: activity:new
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type ActivityType = "create" | "deploy" | "update" | "delete" | "ai";

const TYPE_COLORS: Record<ActivityType, { dot: string; text: string }> = {
  create: { dot: "bg-emerald-400", text: "text-emerald-400/80" },
  deploy: { dot: "bg-cyan-400", text: "text-cyan-400/80" },
  update: { dot: "bg-amber-400", text: "text-amber-400/80" },
  delete: { dot: "bg-rose-400", text: "text-rose-400/80" },
  ai: { dot: "bg-rose-400", text: "text-rose-400/80" },
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
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "auth_failed" | "disconnected">("connecting");

  const wsToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, [activeProject?.id]);

  const wsUrl = useMemo(() => {
    if (!activeProject?.id) return null;
    const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
    const joiner = base.includes("?") ? "&" : "?";
    return `${base}${joiner}projectId=${encodeURIComponent(activeProject.id)}`;
  }, [activeProject?.id]);

  const { isConnected } = useWebSocket({
    url: wsUrl || "ws://localhost:3001/ws",
    token: wsToken,
    enabled: Boolean(wsUrl && wsToken),
    reconnect: Boolean(wsUrl && wsToken),
    onOpen: () => {
      setWsStatus("connected");
    },
    onClose: (event) => {
      if (event.code === 4401 || event.code === 4403) {
        setWsStatus("auth_failed");
        return;
      }
      setWsStatus("disconnected");
    },
    onMessage: (message) => {
      if (!wsUrl || !message || typeof message !== "object") return;
      const payload = message as { event?: string; data?: unknown };
      if (payload.event !== "activity:new" || !payload.data || typeof payload.data !== "object") return;

      const incoming = payload.data as ActivityEntry;
      if (!incoming?.id || !incoming?.action || !incoming?.createdAt) return;
      if (activeProject?.id && incoming.projectId !== activeProject.id) return;

      setItems((prev) => {
        const deduped = prev.filter((item) => item.id !== incoming.id);
        return [incoming, ...deduped].slice(0, 20);
      });
    },
  });

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

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">
              {isConnected || wsStatus === "connected"
                ? "Waiting for live activity events..."
                : wsStatus === "auth_failed"
                  ? "Live stream authorization failed. Please refresh and sign in again."
                  : wsStatus === "disconnected"
                    ? "Live stream disconnected. Reconnecting..."
                    : "Connecting to live activity stream..."}
            </p>
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
                  className="group flex items-start gap-3 rounded px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
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
