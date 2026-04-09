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
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <div className="h-4 w-4 rounded bg-white/[0.06]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.08]" />
                <div className="ml-auto h-2.5 w-1/5 rounded bg-white/[0.04]" />
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
          <div className="divide-y divide-white/[0.04]">
            {models.map((model, i) => (
              <motion.div key={model.id}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <button
                  onClick={() => setExpanded(expanded === model.id ? null : model.id)}
                  className="w-full text-left py-3 flex items-center gap-3 hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors"
                >
                  <span className="text-base shrink-0">{model.icon}</span>
                  <span className="text-sm font-medium text-white/75">{model.name}</span>
                  <span className="ml-auto text-xs text-white/25 shrink-0">
                    {model.recordCount.toLocaleString()} rows
                  </span>
                  <svg className={`shrink-0 w-3 h-3 text-white/20 transition-transform ${expanded === model.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expanded === model.id && (
                  <div className="pb-3 pl-8 space-y-1.5">
                    {model.fields.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 text-xs">
                        <span className="text-white/40 font-mono">{f.name}</span>
                        {f.required && <span className="text-rose-400/40 text-[10px]">*</span>}
                        <span className={`ml-auto text-[10px] font-medium ${TYPE_BADGE[f.type] || 'text-white/30'}`}>
                          {f.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
