"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeployStore } from "@/store/deployStore";
import type { Deployment, DeploymentLog, DeployStep } from "@/types";

/* ── Step metadata ── */
const STEP_LABELS: Record<DeployStep, string> = {
    validate: "Validate Configuration",
    snapshot: "Freeze Snapshot",
    provision_db: "Provision Database",
    migrate_schema: "Run Migrations",
    activate_routes: "Activate Routes",
    apply_policies: "Apply Policies",
    health_check: "Health Check",
    go_live: "Go Live",
};

const STEP_STATUS_COLOR: Record<string, string> = {
    pending: "text-white/20",
    running: "text-[#81ecff] animate-pulse",
    done: "text-emerald-400",
    failed: "text-red-400",
    skipped: "text-white/20",
};

const STEP_STATUS_ICON: Record<string, string> = {
    pending: "○",
    running: "◉",
    done: "✓",
    failed: "✕",
    skipped: "—",
};

const DEPLOY_STATUS_COLOR: Record<string, string> = {
    pending: "text-white/30",
    validating: "text-[#81ecff]",
    provisioning: "text-amber-400",
    activating: "text-rose-400",
    live: "text-emerald-400",
    failed: "text-red-400",
    rolled_back: "text-orange-400",
    superseded: "text-white/25",
};

const DEPLOY_STATUS_DOT: Record<string, string> = {
    pending: "bg-white/20",
    validating: "bg-[#81ecff] animate-pulse",
    provisioning: "bg-amber-400 animate-pulse",
    activating: "bg-rose-400 animate-pulse",
    live: "bg-emerald-400",
    failed: "bg-red-400",
    rolled_back: "bg-orange-400",
    superseded: "bg-white/15",
};

/* -- Readiness Panel ----------------------------------------------- */

function ReadinessPanel({ projectId }: Readonly<{ projectId: string }>) {
    const { readiness, isLoadingReadiness, fetchReadiness } = useDeployStore();

    useEffect(() => {
        fetchReadiness(projectId);
    }, [projectId, fetchReadiness]);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Deploy Readiness</p>
                {!isLoadingReadiness && readiness && (
                    <span className={`text-[11px] font-medium ${readiness.ready ? "text-emerald-400" : "text-red-400"}`}>
                        {readiness.ready ? "Ready" : "Not ready"}
                    </span>
                )}
            </div>

            {isLoadingReadiness && (
                <div className="divide-y divide-white/[0.04] animate-pulse">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-white/[0.06]" />
                            <div className="h-2.5 flex-1 rounded bg-white/[0.04]" />
                            <div className="h-2 w-8 rounded bg-white/[0.03]" />
                        </div>
                    ))}
                </div>
            )}

            {!isLoadingReadiness && !readiness && (
                <p className="text-xs text-red-400/70 py-2">Failed to load readiness checks.</p>
            )}

            {!isLoadingReadiness && readiness && (
                <div className="divide-y divide-white/[0.04]">
                    {readiness.checks.map((check) => {
                        const dotColor = check.status === "pass" ? "bg-emerald-400" : check.status === "warn" ? "bg-amber-400" : "bg-red-400";
                        const textColor = check.status === "pass" ? "text-white/60" : check.status === "warn" ? "text-amber-400/80" : "text-red-400/80";
                        return (
                            <div key={check.name} className="flex items-center gap-3 py-2.5">
                                <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                <span className={`flex-1 text-xs ${textColor}`}>{check.message}</span>
                                <span className={`shrink-0 text-[10px] uppercase tracking-wider font-mono ${
                                    check.status === "pass" ? "text-emerald-400/60" : check.status === "warn" ? "text-amber-400/60" : "text-red-400/60"
                                }`}>{check.status}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* -- Log Console --------------------------------------------------- */

function DeployLogConsole({ logs }: Readonly<{ logs: DeploymentLog[] }>) {
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div ref={consoleRef} className="bg-black/40 border border-white/[0.04] rounded-md px-4 py-3 max-h-72 overflow-y-auto font-mono text-xs space-y-1.5">
            {logs.map((log) => (
                <div key={log.id || log.step} className="flex gap-3 items-start">
                    <span className={`shrink-0 w-4 text-center ${STEP_STATUS_COLOR[log.status] ?? "text-white/20"}`}>
                        {STEP_STATUS_ICON[log.status] ?? "○"}
                    </span>
                    <span className="text-white/25 shrink-0 w-32">{STEP_LABELS[log.step] ?? log.step}</span>
                    <span className={`flex-1 ${STEP_STATUS_COLOR[log.status] ?? "text-white/30"}`}>
                        {log.message || (log.status === "pending" ? "Waiting…" : "")}
                    </span>
                    <span className={`shrink-0 text-[10px] uppercase tracking-wider ${STEP_STATUS_COLOR[log.status] ?? "text-white/20"}`}>
                        {log.status}
                    </span>
                </div>
            ))}
            {logs.length === 0 && (
                <div className="text-white/15 text-center py-4">No steps logged yet</div>
            )}
        </div>
    );
}

/* -- Deploy Trigger ------------------------------------------------ */

function DeployTrigger({ projectId }: Readonly<{ projectId: string }>) {
    const { readiness, isDeploying, triggerDeploy, activeDeployment, error, clearError } = useDeployStore();
    const [releaseNote, setReleaseNote] = useState("");

    const handleDeploy = useCallback(async () => {
        if (!confirm("Start a new deployment? This will snapshot the current configuration and run the deploy pipeline.")) return;
        clearError();
        await triggerDeploy(projectId, releaseNote || undefined);
        setReleaseNote("");
    }, [projectId, releaseNote, triggerDeploy, clearError]);

    const isActive = activeDeployment &&
        ["pending", "validating", "provisioning", "activating"].includes(activeDeployment.deployment.status);

    return (
        <div className="border-t border-white/[0.04] pt-5 mt-6">
            <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono mb-3">
                {isActive ? "Deployment in progress" : "Trigger deployment"}
            </p>

            {isActive && activeDeployment ? (
                <div>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEPLOY_STATUS_DOT[activeDeployment.deployment.status] ?? "bg-white/20"}`} />
                        <span className={`text-sm font-medium capitalize ${DEPLOY_STATUS_COLOR[activeDeployment.deployment.status] ?? "text-white/50"}`}>
                            {activeDeployment.deployment.status}
                        </span>
                        <span className="text-xs text-white/20">v{activeDeployment.deployment.version}</span>
                    </div>
                    <DeployLogConsole logs={activeDeployment.logs} />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <Textarea
                        placeholder="Release note (optional)"
                        value={releaseNote}
                        onChange={(e) => setReleaseNote(e.target.value)}
                        className="bg-white/[0.03] border-white/[0.06] focus:border-[#81ecff]/30 text-sm text-white/70 resize-none h-20 placeholder:text-white/20"
                        maxLength={500}
                    />
                    {error && (
                        <p className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/10 rounded px-3 py-2">{error}</p>
                    )}
                    {!readiness?.ready && readiness && (
                        <p className="text-[11px] text-amber-400/70">Resolve all readiness checks before deploying</p>
                    )}
                    <Button
                        onClick={handleDeploy}
                        disabled={isDeploying || !readiness?.ready}
                        className="self-start bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 hover:text-emerald-300 disabled:opacity-30 transition-colors"
                    >
                        {isDeploying ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                                Deploying...
                            </span>
                        ) : (
                            "Deploy Now"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

/* -- Deployment History --------------------------------------------- */

function DeploymentHistory({ projectId }: Readonly<{ projectId: string }>) {
    const {
        deployments,
        total,
        isLoadingList,
        fetchDeployments,
        fetchDeploymentDetail,
        activeDeployment,
        rollback,
        isRollingBack,
    } = useDeployStore();
    const [page, setPage] = useState(0);
    const LIMIT = 10;

    useEffect(() => {
        fetchDeployments(projectId, LIMIT, page * LIMIT);
    }, [projectId, page, fetchDeployments]);

    const handleViewDetail = useCallback((deployId: string) => {
        fetchDeploymentDetail(projectId, deployId);
    }, [projectId, fetchDeploymentDetail]);

    const handleRollback = useCallback(async (deployId: string, version: number) => {
        if (!confirm(`Rollback to v${version}? This will create a new deployment with that configuration.`)) return;
        await rollback(projectId, deployId, `Manual rollback to v${version}`);
        fetchDeployments(projectId, LIMIT, 0);
        setPage(0);
    }, [projectId, rollback, fetchDeployments]);

    return (
        <div className="border-t border-white/[0.04] pt-6">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Deployment History</p>
                {!isLoadingList && total > 0 && (
                    <span className="text-[11px] text-white/15">{total} total</span>
                )}
            </div>

            {isLoadingList && (
                <div className="divide-y divide-white/[0.04] animate-pulse">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-white/[0.06]" />
                            <div className="h-2.5 w-8 rounded bg-white/[0.06]" />
                            <div className="h-2.5 flex-1 rounded bg-white/[0.04]" />
                            <div className="h-2 w-16 rounded bg-white/[0.03]" />
                        </div>
                    ))}
                </div>
            )}

            {!isLoadingList && deployments.length === 0 && (
                <p className="text-sm text-white/20 py-3">No deployments yet.</p>
            )}

            {!isLoadingList && deployments.length > 0 && (
                <div className="divide-y divide-white/[0.04]">
                    {deployments.map((dep) => (
                        <DeploymentRow
                            key={dep.id}
                            deployment={dep}
                            isSelected={activeDeployment?.deployment.id === dep.id}
                            onView={handleViewDetail}
                            onRollback={handleRollback}
                            isRollingBack={isRollingBack}
                        />
                    ))}
                </div>
            )}

            {total > LIMIT && (
                <div className="flex items-center justify-between pt-4 mt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="text-xs text-white/30 hover:text-white/60 disabled:opacity-30 transition-colors"
                    >
                        ← Previous
                    </button>
                    <span className="text-[11px] text-white/20">
                        {page + 1} / {Math.ceil(total / LIMIT)}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={(page + 1) * LIMIT >= total}
                        className="text-xs text-white/30 hover:text-white/60 disabled:opacity-30 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

/* -- Deployment Row ------------------------------------------------ */

function DeploymentRow({
    deployment,
    isSelected,
    onView,
    onRollback,
    isRollingBack,
}: Readonly<{
    deployment: Deployment;
    isSelected: boolean;
    onView: (id: string) => void;
    onRollback: (id: string, version: number) => void;
    isRollingBack: boolean;
}>) {
    const canRollback = deployment.status === "live" || deployment.status === "superseded";

    return (
        <div
            className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded transition-colors cursor-pointer ${
                isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
            }`}
            onClick={() => onView(deployment.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onView(deployment.id)}
            aria-label={`View deployment v${deployment.version}`}
        >
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${DEPLOY_STATUS_DOT[deployment.status] ?? "bg-white/20"}`} />

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-mono font-medium text-white/70">v{deployment.version}</span>
                    <span className={`text-xs capitalize ${DEPLOY_STATUS_COLOR[deployment.status] ?? "text-white/30"}`}>
                        {deployment.status}
                    </span>
                    {deployment.errorMessage && (
                        <span className="text-[11px] text-red-400/70 truncate">{deployment.errorMessage}</span>
                    )}
                </div>
                {deployment.releaseNote && (
                    <p className="text-[11px] text-white/25 truncate mt-0.5">{deployment.releaseNote}</p>
                )}
            </div>

            <div className="text-right shrink-0 hidden sm:block">
                <div className="text-[11px] text-white/20">
                    {new Date(deployment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" "}
                    <span className="text-white/15">{new Date(deployment.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {deployment.liveAt && (
                    <div className="text-[10px] text-emerald-400/50">
                        Live {new Date(deployment.liveAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                )}
            </div>

            {canRollback && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRollback(deployment.id, deployment.version); }}
                    disabled={isRollingBack}
                    className="shrink-0 text-[11px] text-amber-400/50 hover:text-amber-400 transition-colors disabled:opacity-30"
                >
                    Rollback
                </button>
            )}
        </div>
    );
}

/* ── Detail Panel ── */
function DeploymentDetailPanel() {
    const { activeDeployment, isLoadingDetail } = useDeployStore();

    if (isLoadingDetail) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
                <div className="h-48 rounded bg-white/[0.03]" />
            </div>
        );
    }

    if (!activeDeployment) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-white/20">Select a deployment to view details</p>
            </div>
        );
    }

    const { deployment, logs } = activeDeployment;

    return (
        <motion.div
            key={deployment.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
        >
            <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEPLOY_STATUS_DOT[deployment.status] ?? "bg-white/20"}`} />
                <span className="text-sm font-mono font-medium text-white/70">v{deployment.version}</span>
                <span className={`text-sm capitalize ${DEPLOY_STATUS_COLOR[deployment.status] ?? "text-white/30"}`}>{deployment.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono mb-0.5">Created</p>
                    <p className="text-xs text-white/50">{new Date(deployment.createdAt).toLocaleString()}</p>
                </div>
                {deployment.liveAt && (
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono mb-0.5">Live since</p>
                        <p className="text-xs text-emerald-400">{new Date(deployment.liveAt).toLocaleString()}</p>
                    </div>
                )}
                {deployment.apiUrl && (
                    <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono mb-0.5">API URL</p>
                        <p className="text-xs font-mono text-[#81ecff]/70 break-all">{deployment.apiUrl}</p>
                    </div>
                )}
                {deployment.enabledModules && deployment.enabledModules.length > 0 && (
                    <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono mb-1">Modules</p>
                        <div className="flex flex-wrap gap-1.5">
                            {deployment.enabledModules.map((m) => (
                                <span key={m} className="text-[10px] font-mono text-white/30 border border-white/[0.06] px-1.5 py-0.5 rounded">{m}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {deployment.releaseNote && (
                <p className="text-xs text-white/35 italic border-l-2 border-white/[0.06] pl-3 py-1">{deployment.releaseNote}</p>
            )}

            {deployment.errorMessage && (
                <p className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/10 rounded px-3 py-2">{deployment.errorMessage}</p>
            )}

            <div>
                <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono mb-2">Step log</p>
                <DeployLogConsole logs={logs} />
            </div>
        </motion.div>
    );
}

/* -- Page ---------------------------------------------------------- */

export default function DeployPage() {
    const params = useParams();
    const rawId = params.id;
    const resolvedId = Array.isArray(rawId) ? rawId[0] : "";
    const projectId = typeof rawId === "string" ? rawId : resolvedId;
    const { fetchCurrentDeployment, currentDeployment } = useDeployStore();

    useEffect(() => {
        if (projectId) fetchCurrentDeployment(projectId);
    }, [projectId, fetchCurrentDeployment]);

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto px-4 py-6 sm:px-6">

            {/* Header */}
            <div className="flex items-start gap-4 border-b border-white/[0.04] pb-6">
                <div className="shrink-0 mt-1 w-[3px] self-stretch rounded-full" style={{ background: "rgba(129,236,255,0.5)" }} />
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/90">Deploy</h1>
                    <p className="text-sm text-white/35 mt-1">
                        Deploy your backend configuration to make it live. Each deployment creates an immutable versioned snapshot.
                    </p>
                </div>
            </div>

            {/* Live deployment strip */}
            <AnimatePresence>
                {currentDeployment?.deployment?.status === "live" && currentDeployment.deployment.apiUrl && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-md border border-emerald-500/15 bg-emerald-500/5 overflow-hidden"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-xs text-emerald-400 font-medium shrink-0">Live</span>
                        <span className="text-xs text-white/25 shrink-0">v{currentDeployment.deployment.version} &middot; API URL</span>
                        <code className="text-xs font-mono text-[#81ecff]/70 flex-1 break-all min-w-0">{currentDeployment.deployment.apiUrl}</code>
                        <button
                            onClick={() => navigator.clipboard.writeText(currentDeployment.deployment.apiUrl!)}
                            className="shrink-0 text-[11px] text-white/25 hover:text-white/60 transition-colors"
                        >
                            Copy
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                {/* Left: readiness + trigger */}
                <div>
                    <ReadinessPanel projectId={projectId} />
                    <DeployTrigger projectId={projectId} />
                </div>

                {/* Right: detail panel */}
                <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono mb-3">Deployment detail</p>
                    <DeploymentDetailPanel />
                </div>
            </div>

            <DeploymentHistory projectId={projectId} />

        </div>
    );
}
