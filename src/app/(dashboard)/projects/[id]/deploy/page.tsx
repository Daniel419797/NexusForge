"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-zinc-700 text-zinc-300",
    running: "bg-blue-600/20 text-blue-400 animate-pulse",
    done: "bg-emerald-600/20 text-emerald-400",
    failed: "bg-red-600/20 text-red-400",
    skipped: "bg-zinc-600/20 text-zinc-400",
};

const DEPLOY_STATUS_COLORS: Record<string, string> = {
    pending: "bg-zinc-700 text-zinc-300",
    validating: "bg-blue-600/20 text-blue-400",
    provisioning: "bg-amber-600/20 text-amber-400",
    activating: "bg-rose-600/20 text-rose-400",
    live: "bg-emerald-600/20 text-emerald-400",
    failed: "bg-red-600/20 text-red-400",
    rolled_back: "bg-orange-600/20 text-orange-400",
    superseded: "bg-zinc-600/20 text-zinc-400",
};

const STATUS_ICONS: Record<string, string> = {
    pending: "○",
    running: "◉",
    done: "✓",
    failed: "✕",
    skipped: "—",
};

/* ── Readiness Panel ── */
function ReadinessPanel({ projectId }: Readonly<{ projectId: string }>) {
    const { readiness, isLoadingReadiness, fetchReadiness } = useDeployStore();

    useEffect(() => {
        fetchReadiness(projectId);
    }, [projectId, fetchReadiness]);

    if (isLoadingReadiness) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-sm text-zinc-400">Deploy Readiness</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={`readiness-skeleton-${i}`} className="h-6 w-full bg-zinc-800" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!readiness) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-sm text-zinc-400">Deploy Readiness</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-red-400">Failed to load readiness checks. Try refreshing the page.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
                    Deploy Readiness
                    {readiness.ready ? (
                        <Badge className="bg-emerald-600/20 text-emerald-400 text-xs">Ready</Badge>
                    ) : (
                        <Badge className="bg-red-600/20 text-red-400 text-xs">Not Ready</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {readiness.checks.map((check) => (
                        <li key={check.name} className="flex items-center gap-3 text-sm">
                            {(() => {
                                const dotColorNonPass = check.status === "warn" ? "bg-amber-500" : "bg-red-500";
                                const dotColor = check.status === "pass" ? "bg-emerald-500" : dotColorNonPass;
                                const badgeColorNonPass = check.status === "warn" ? "text-amber-400 border-amber-800" : "text-red-400 border-red-800";
                                const badgeColor = check.status === "pass" ? "text-emerald-400 border-emerald-800" : badgeColorNonPass;
                                return (
                                    <>
                                        <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
                                        <span className="text-zinc-300 flex-1">{check.message}</span>
                                        <Badge variant="outline" className={`text-xs ${badgeColor}`}>
                                        {check.status}
                                        </Badge>
                                    </>
                                );
                            })()}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

/* ── Deploy Log Console ── */
function DeployLogConsole({ logs }: Readonly<{ logs: DeploymentLog[] }>) {
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to latest step
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div ref={consoleRef} className="bg-black/60 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1.5">
            {logs.map((log) => (
                <div key={log.id || log.step} className="flex gap-3 items-start">
                    {(() => {
                        const iconColorNonDoneRunning = log.status === "failed" ? "text-red-400" : "text-zinc-500";
                        const iconColorNonDone = log.status === "running" ? "text-blue-400" : iconColorNonDoneRunning;
                        const iconColor = log.status === "done" ? "text-emerald-400" : iconColorNonDone;
                        const messageColorNonRunningFailed = log.status === "done" ? "text-zinc-300" : "text-zinc-600";
                        const messageColorNonRunning = log.status === "failed" ? "text-red-300" : messageColorNonRunningFailed;
                        const messageColor = log.status === "running" ? "text-blue-300" : messageColorNonRunning;
                        const messageText = log.message || (log.status === "pending" ? "Waiting…" : "");
                        return (
                            <>
                                <span className={`shrink-0 w-4 text-center ${iconColor}`}>
                                    {STATUS_ICONS[log.status] || "○"}
                                </span>
                                <span className="text-zinc-500 shrink-0 w-28">{STEP_LABELS[log.step] || log.step}</span>
                                <span className={`flex-1 ${messageColor}`}>{messageText}</span>
                            </>
                        );
                    })()}
                    <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[log.status] || ""}`}>
                        {log.status}
                    </Badge>
                </div>
            ))}
            {logs.length === 0 && (
                <div className="text-zinc-600 text-center py-4">No steps logged yet</div>
            )}
        </div>
    );
}

/* ── Deploy Trigger Card ── */
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
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-sm text-zinc-400">
                    {isActive ? "Deployment In Progress" : "Deploy"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isActive && activeDeployment ? (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className={DEPLOY_STATUS_COLORS[activeDeployment.deployment.status] || ""}>
                                {activeDeployment.deployment.status}
                            </Badge>
                            <span className="text-xs text-zinc-500">v{activeDeployment.deployment.version}</span>
                        </div>
                        <DeployLogConsole logs={activeDeployment.logs} />
                    </>
                ) : (
                    <>
                        <Textarea
                            placeholder="Release note (optional)"
                            value={releaseNote}
                            onChange={(e) => setReleaseNote(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm resize-none h-20"
                            maxLength={500}
                        />
                        {error && (
                            <div className="text-red-400 text-xs bg-red-900/20 rounded p-2">{error}</div>
                        )}
                        <Button
                            onClick={handleDeploy}
                            disabled={isDeploying || !readiness?.ready}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                        >
                            {isDeploying ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>Deploying…</span>
                                </span>
                            ) : (
                                "Deploy Now"
                            )}
                        </Button>
                        {!readiness?.ready && readiness && (
                            <p className="text-xs text-amber-400">Resolve all readiness checks before deploying</p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

/* ── Deployment History ── */
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

    if (isLoadingList) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-sm text-zinc-400">Deployment History</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={`history-skeleton-${i}`} className="h-12 w-full bg-zinc-800" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Deployment History</span>
                    <span className="text-xs text-zinc-600">{total} total</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {deployments.length === 0 ? (
                    <div className="text-center text-zinc-600 py-8 text-sm">No deployments yet</div>
                ) : (
                    <div className="space-y-2">
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
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="text-zinc-400"
                        >
                            Previous
                        </Button>
                        <span className="text-xs text-zinc-500">
                            Page {page + 1} of {Math.ceil(total / LIMIT)}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={(page + 1) * LIMIT >= total}
                            className="text-zinc-400"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ── Deployment Row ── */
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
        <button
            type="button"
            className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-left ${isSelected ? "bg-zinc-800/80 ring-1 ring-zinc-700" : "bg-zinc-800/30 hover:bg-zinc-800/50"
                }`}
            onClick={() => onView(deployment.id)}
            aria-label={`View deployment v${deployment.version} — ${deployment.status}`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">v{deployment.version}</span>
                    <Badge className={`text-[10px] ${DEPLOY_STATUS_COLORS[deployment.status] || ""}`}>
                        {deployment.status}
                    </Badge>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {deployment.releaseNote || "No release note"}
                    {deployment.errorMessage && (
                        <span className="text-red-400 ml-2">— {deployment.errorMessage}</span>
                    )}
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className="text-xs text-zinc-500">
                    {new Date(deployment.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
                {deployment.liveAt && (
                    <div className="text-[10px] text-emerald-500">
                        Live: {new Date(deployment.liveAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                )}
            </div>

            {canRollback && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRollback(deployment.id, deployment.version);
                    }}
                    disabled={isRollingBack}
                    className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 shrink-0"
                >
                    Rollback
                </Button>
            )}
        </button>
    );
}

/* ── Detail Panel ── */
function DeploymentDetailPanel() {
    const { activeDeployment, isLoadingDetail } = useDeployStore();

    if (isLoadingDetail) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-6 space-y-3">
                    <Skeleton className="h-6 w-48 bg-zinc-800" />
                    <Skeleton className="h-64 w-full bg-zinc-800" />
                </CardContent>
            </Card>
        );
    }

    if (!activeDeployment) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-8">
                    <p className="text-sm text-zinc-500 text-center">Select a deployment to view details</p>
                </CardContent>
            </Card>
        );
    }

    const { deployment, logs } = activeDeployment;

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-sm text-zinc-400">
                    <span>v{deployment.version} Detail</span>
                    <Badge className={DEPLOY_STATUS_COLORS[deployment.status] || ""}>
                        {deployment.status}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Meta info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="text-zinc-500">Created</span>
                        <div className="text-zinc-300">{new Date(deployment.createdAt).toLocaleString()}</div>
                    </div>
                    {deployment.liveAt && (
                        <div>
                            <span className="text-zinc-500">Live Since</span>
                            <div className="text-emerald-400">{new Date(deployment.liveAt).toLocaleString()}</div>
                        </div>
                    )}
                    {deployment.apiUrl && (
                        <div>
                            <span className="text-zinc-500">API URL</span>
                            <div className="text-zinc-300 font-mono">{deployment.apiUrl}</div>
                        </div>
                    )}
                    {deployment.enabledModules && deployment.enabledModules.length > 0 && (
                        <div>
                            <span className="text-zinc-500">Modules</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {deployment.enabledModules.map((m) => (
                                    <Badge key={m} variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                                        {m}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {deployment.releaseNote && (
                    <div className="text-xs text-zinc-400 bg-zinc-800/50 rounded p-2 italic">
                        {deployment.releaseNote}
                    </div>
                )}

                {deployment.errorMessage && (
                    <div className="text-xs text-red-400 bg-red-900/20 rounded p-2">
                        {deployment.errorMessage}
                    </div>
                )}

                <Separator className="bg-zinc-800" />

                {/* Step log */}
                <DeployLogConsole logs={logs} />
            </CardContent>
        </Card>
    );
}

/* ── Main Page ── */
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
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Deploy</h2>
                <p className="text-sm text-zinc-500 mt-1">
                    Deploy your backend configuration to make it live. Each deployment creates an immutable versioned snapshot.
                </p>
            </div>

            {/* Live deployment banner */}
            {currentDeployment?.deployment?.status === "live" && currentDeployment.deployment.apiUrl && (
                <Card className="bg-emerald-950/30 border-emerald-800/40">
                    <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
                        <Badge className="bg-emerald-600/20 text-emerald-400 shrink-0">Live</Badge>
                        <span className="text-xs text-zinc-400 shrink-0">v{currentDeployment.deployment.version} · API URL</span>
                        <code className="text-sm font-mono text-emerald-300 flex-1 break-all">
                            {currentDeployment.deployment.apiUrl}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(currentDeployment.deployment.apiUrl!)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                        >
                            Copy
                        </button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column — readiness + trigger */}
                <div className="space-y-6">
                    <ReadinessPanel projectId={projectId} />
                    <DeployTrigger projectId={projectId} />
                </div>

                {/* Right column — detail panel */}
                <div className="space-y-6">
                    <DeploymentDetailPanel />
                </div>
            </div>

            <DeploymentHistory projectId={projectId} />
        </div>
    );
}
