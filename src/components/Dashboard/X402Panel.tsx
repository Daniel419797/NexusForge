"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import GlassPanel from "./GlassPanel";
import X402Service, { type X402Config } from "@/services/X402Service";
import BlockchainService, { type Transaction } from "@/services/BlockchainService";
import { useProjectStore } from "@/store/projectStore";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   X402Panel â€” x402 micropayment overview
   Wired to real X402Service + BlockchainService
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface PaymentStat {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function X402Panel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const activeProject = useProjectStore((s) => s.activeProject);

  const [config, setConfig] = useState<X402Config | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeProject?.id) {
      setConfig(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setError(false);
      const [cfg, txns] = await Promise.all([
        X402Service.getConfig(activeProject.id),
        BlockchainService.getTransactions(activeProject.id, { limit: 10 }),
      ]);
      setConfig(cfg);
      setTransactions(txns);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive stats from real data
  const confirmedTxns = transactions.filter((t) => t.status === "confirmed");
  const totalVolume = confirmedTxns.reduce((sum, t) => sum + (parseFloat(t.value ?? '0') || 0), 0);
  const avgPayment = confirmedTxns.length > 0 ? totalVolume / confirmedTxns.length : 0;

  const stats: PaymentStat[] = [
    {
      label: "Status",
      value: config?.enabled ? "Active" : "Disabled",
    },
    {
      label: "Monetized Calls",
      value: confirmedTxns.length.toLocaleString(),
    },
    {
      label: "Volume",
      value: totalVolume > 0 ? `$${totalVolume.toFixed(2)}` : "â€”",
    },
    {
      label: "Avg. Payment",
      value: avgPayment > 0 ? `$${avgPayment.toFixed(2)}` : "â€”",
    },
  ];

  return (
    <div ref={ref}>
      <GlassPanel accent="amber" hover3d>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            x402 Payments
          </h3>
          <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400/70 uppercase tracking-wider">
            HTTP 402
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded p-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="h-2 w-1/2 rounded bg-white/[0.06] mb-2" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-xs text-white/25">Failed to load payment data</p>
            <button
              onClick={fetchData}
              className="mt-2 text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !activeProject ? (
          <div className="py-6 text-center">
            <p className="text-xs text-white/25">Select a project to view x402 data</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="rounded p-2.5"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                    {s.label}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-white/90">{s.value}</span>
                    {s.change && (
                      <span
                        className={`text-[10px] font-semibold ${
                          s.positive ? "text-emerald-400/70" : "text-rose-400/70"
                        }`}
                      >
                        {s.change}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Wallet info */}
            {config?.walletAddress && (
              <div className="rounded px-3 py-2 border border-white/[0.04] mb-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                  Payment Wallet
                </p>
                <p className="text-xs font-mono text-white/50">
                  {config.walletAddress.slice(0, 10)}â€¦{config.walletAddress.slice(-6)}
                </p>
                {config.chain && (
                  <p className="text-[10px] text-white/25 mt-0.5">{config.chain}</p>
                )}
              </div>
            )}

            {/* Recent transactions */}
            {transactions.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                  Recent Transactions
                </p>
                <div className="space-y-1.5">
                  {transactions.slice(0, 4).map((t, i) => (
                    <motion.div
                      key={t.id}
                      className="flex items-center gap-3 rounded px-2.5 py-2 border border-white/[0.03]"
                      style={{ background: "rgba(255,255,255,0.01)" }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-white/50 truncate">
                          {t.txHash.slice(0, 10)}â€¦{t.txHash.slice(-6)}
                        </p>
                        <p className="text-[10px] text-white/20">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-white/80">
                          {t.value || "0"} {t.chain}
                        </p>
                        <p
                          className={`text-[10px] ${
                            t.status === "confirmed"
                              ? "text-emerald-400/60"
                              : t.status === "pending"
                              ? "text-amber-400/60"
                              : "text-rose-400/60"
                          }`}
                        >
                          {t.status}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </GlassPanel>
    </div>
  );
}
