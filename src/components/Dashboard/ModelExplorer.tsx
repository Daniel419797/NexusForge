"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

import DashboardService, { type DataModelInfo } from "@/services/DashboardService";
import { useProjectStore } from "@/store/projectStore";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ModelExplorer â€” Dynamic data models
   Wired to GET /api/v1/dashboard/models
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TYPE_BADGE: Record<string, string> = {
  uuid: "text-cyan-400/70 bg-cyan-400/10",
  string: "text-emerald-400/70 bg-emerald-400/10",
  number: "text-amber-400/70 bg-amber-400/10",
  enum: "text-blue-400/70 bg-blue-400/10",
  text: "text-rose-400/70 bg-rose-400/10",
  jsonb: "text-cyan-400/70 bg-cyan-400/10",
  boolean: "text-emerald-400/70 bg-emerald-400/10",
};

export default function ModelExplorer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const activeProject = useProjectStore((s) => s.activeProject);

  const [models, setModels] = useState<DataModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      setError(false);
      const data = await DashboardService.getModels(activeProject?.id);
      setModels(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <div ref={ref}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Data Models
          </h3>
          <span className="text-xs text-white/30">
            {loading ? "â€¦" : `${models.length} schemas`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md p-4 border border-white/[0.04] animate-pulse"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-5 rounded bg-white/[0.06]" />
                  <div className="h-3.5 w-1/3 rounded bg-white/[0.08]" />
                  <div className="ml-auto h-2.5 w-1/4 rounded bg-white/[0.04]" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-3/4 rounded bg-white/[0.04]" />
                  <div className="h-2.5 w-1/2 rounded bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">Failed to load models</p>
            <button
              onClick={fetchModels}
              className="mt-2 text-xs text-cyan-400/60 hover:text-cyan-400/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : models.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">No data models found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {models.map((model, i) => (
              <motion.button
                key={model.id}
                onClick={() =>
                  setExpanded(expanded === model.id ? null : model.id)
                }
                className="text-left rounded-md p-4 transition-colors border border-white/[0.04] hover:border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{model.icon}</span>
                  <span className="text-sm font-semibold text-white/90">
                    {model.name}
                  </span>
                  <span className="ml-auto text-xs text-white/25">
                    {model.recordCount.toLocaleString()} rows
                  </span>
                </div>

                {/* Fields preview (always show first 2 + expand) */}
                <div className="space-y-1.5">
                  {model.fields
                    .slice(
                      0,
                      expanded === model.id ? model.fields.length : 2,
                    )
                    .map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-white/50 font-mono">
                          {f.name}
                        </span>
                        {f.required && (
                          <span className="text-rose-400/50 text-[10px]">
                            *
                          </span>
                        )}
                        <span
                          className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                            TYPE_BADGE[f.type] || "text-white/40 bg-white/5"
                          }`}
                        >
                          {f.type}
                        </span>
                      </div>
                    ))}
                  {model.fields.length > 2 && expanded !== model.id && (
                    <p className="text-[10px] text-white/20">
                      +{model.fields.length - 2} more fields
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
