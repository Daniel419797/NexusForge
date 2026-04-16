"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import GlassPanel from "./GlassPanel";
import BlockchainService, {
  type Wallet,
  type Transaction,
} from "@/services/BlockchainService";
import { useProjectStore } from "@/store/projectStore";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BlockchainStatus â€” Real chain metrics
   Wired to BlockchainService endpoints
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface ChainMetric {
  label: string;
  value: string;
  sub?: string;
}

export default function BlockchainStatus() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const activeProject = useProjectStore((s) => s.activeProject);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeProject?.id) {
      setWallets([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setError(false);
      const [w, tx] = await Promise.all([
        BlockchainService.getWallets(activeProject.id),
        BlockchainService.getTransactions(activeProject.id, { limit: 50 }),
      ]);
      setWallets(w);
      setTransactions(tx);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive metrics from real data
  const confirmedTx = transactions.filter((t) => t.status === "confirmed").length;
  const pendingTx = transactions.filter((t) => t.status === "pending").length;
  const uniqueChains = new Set(wallets.map((w) => w.chain));

  const metrics: ChainMetric[] = [
    {
      label: "Networks",
      value: uniqueChains.size > 0 ? Array.from(uniqueChains).join(", ") : "â€”",
    },
    { label: "Wallets", value: wallets.length.toLocaleString() },
    { label: "Confirmed Tx", value: confirmedTx.toLocaleString() },
    { label: "Pending Tx", value: pendingTx.toLocaleString() },
  ];

  return (
    <div ref={ref}>
      <GlassPanel accent="magenta" hover3d>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Blockchain
          </h3>
          {loading ? (
            <span className="text-xs text-white/20">Loadingâ€¦</span>
          ) : error ? (
            <button
              onClick={fetchData}
              className="text-xs text-rose-400/60 hover:text-rose-400/80 transition-colors"
            >
              Retry
            </button>
          ) : wallets.length > 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced
            </span>
          ) : (
            <span className="text-xs text-white/20">No wallets</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded p-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="h-2 w-1/2 rounded bg-white/[0.06] mb-2" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        ) : !activeProject ? (
          <div className="py-6 text-center">
            <p className="text-xs text-white/25">Select a project to view blockchain data</p>
          </div>
        ) : (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  className="rounded p-2.5"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                    {m.label}
                  </p>
                  <p className="text-sm font-bold text-white/90">
                    {m.value}
                    {m.sub && (
                      <span className="ml-1 text-xs font-normal text-white/35">{m.sub}</span>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Wallets */}
            {wallets.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Connected Wallets
                </p>
                {wallets.slice(0, 4).map((w, i) => (
                  <motion.div
                    key={w.id}
                    className="flex items-center justify-between rounded px-3 py-2 border border-white/[0.04]"
                    style={{ background: "rgba(255,255,255,0.015)" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                  >
                    <div>
                      <p className="text-xs font-semibold text-white/70">
                        {w.chain}
                      </p>
                      <p className="text-[11px] font-mono text-white/30">
                        {w.address.slice(0, 6)}â€¦{w.address.slice(-4)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-white/60">
                      {w.balanceCache || "â€“"}
                    </span>
                  </motion.div>
                ))}
                {wallets.length > 4 && (
                  <p className="text-[10px] text-white/20 text-center">
                    +{wallets.length - 4} more wallets
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </GlassPanel>
    </div>
  );
}
