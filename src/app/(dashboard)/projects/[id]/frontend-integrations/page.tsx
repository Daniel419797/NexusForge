"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, ExternalLink, Github, GitPullRequest, Lock, Play, RefreshCcw, ShieldAlert, Unlock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FrontendIntegrationService, {
    type GitHubRepositorySummary,
} from "@/services/FrontendIntegrationService";
import type {
    FrontendIntegration,
    FrontendIntegrationArtifact,
    FrontendIntegrationObservability,
    FrontendIntegrationRun,
    FrontendIntegrationRunDetail,
    FrontendIntegrationRunStatus,
} from "@/types";

const TERMINAL_STATUSES = new Set<FrontendIntegrationRunStatus>(["pr_created", "failed", "cancelled"]);

const STATUS_CLASS: Record<string, string> = {
    connected: "border-emerald-400/20 text-emerald-300 bg-emerald-400/10",
    queued: "border-white/10 text-white/45 bg-white/[0.03]",
    scanning: "border-cyan-300/20 text-cyan-200 bg-cyan-300/10",
    planning: "border-sky-300/20 text-sky-200 bg-sky-300/10",
    awaiting_approval: "border-amber-300/20 text-amber-200 bg-amber-300/10",
    patching: "border-fuchsia-300/20 text-fuchsia-200 bg-fuchsia-300/10",
    validating: "border-blue-300/20 text-blue-200 bg-blue-300/10",
    pr_created: "border-emerald-400/20 text-emerald-300 bg-emerald-400/10",
    failed: "border-red-400/20 text-red-300 bg-red-400/10",
    cancelled: "border-white/10 text-white/35 bg-white/[0.03]",
};

function StatusBadge({ status }: Readonly<{ status: string }>) {
    return (
        <Badge variant="outline" className={`rounded-md capitalize ${STATUS_CLASS[status] ?? "border-white/10 text-white/45"}`}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function formatDate(value: string | null): string {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
}

function ArtifactPanel({ artifact }: Readonly<{ artifact: FrontendIntegrationArtifact }>) {
    const content = asRecord(artifact.content);

    if (artifact.kind === "repo_manifest") {
        const candidates = asRecord(content.candidates);
        const signals = asRecord(content.signals);
        return (
            <div className="rounded-md border border-white/[0.05] bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/75">Scan Findings</div>
                    <div className="text-[11px] text-white/25">{formatDate(artifact.createdAt)}</div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Metric label="Framework" value={String(content.detectedFramework ?? "unknown")} />
                    <Metric label="Package Manager" value={String(content.packageManager ?? "unknown")} />
                    <Metric label="Files Inspected" value={String(asStringArray(content.filesInspected).length)} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <ListBlock label="API clients" values={asStringArray(candidates.apiClientFiles).slice(0, 8)} />
                    <ListBlock label="Auth files" values={asStringArray(candidates.authFiles).slice(0, 8)} />
                    <ListBlock label="Env files" values={asStringArray(candidates.envFiles).slice(0, 8)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(signals).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="rounded-md border-white/[0.08] text-white/50">
                            {key}: {String(value)}
                        </Badge>
                    ))}
                </div>
            </div>
        );
    }

    if (artifact.kind === "validation_report") {
        const checks = Array.isArray(content.checks) ? content.checks.map(asRecord) : [];
        return (
            <div className="rounded-md border border-white/[0.05] bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/75">Validation</div>
                    <StatusBadge status={String(content.status ?? "unknown")} />
                </div>
                <div className="mt-3 divide-y divide-white/[0.05]">
                    {checks.map((check, index) => (
                        <div key={`${check.name}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="text-white/60">{String(check.name ?? "check")}</span>
                            <span className="text-white/35">{String(check.status ?? "unknown")}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (artifact.kind === "ai_plan") {
        const changes = Array.isArray(content.proposedChanges) ? content.proposedChanges.map(asRecord) : [];
        const suggestions = asStringArray(content.integrationSuggestions);
        return (
            <div className="rounded-md border border-amber-300/10 bg-amber-300/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-amber-100/80">Approval Plan</div>
                    <StatusBadge status={String(content.riskLevel ?? "unknown")} />
                </div>
                <div className="mt-3 space-y-2">
                    {changes.map((change, index) => (
                        <div key={`${change.path}-${index}`} className="rounded-md border border-white/[0.05] bg-black/20 px-3 py-2">
                            <div className="font-mono text-xs text-white/70">{String(change.path ?? "")}</div>
                            <div className="mt-1 text-xs text-white/35">{String(change.reason ?? "")}</div>
                        </div>
                    ))}
                </div>
                {suggestions.length > 0 && (
                    <div className="mt-4 space-y-1">
                        {suggestions.map((suggestion) => (
                            <p key={suggestion} className="text-xs text-amber-100/55">{suggestion}</p>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (artifact.kind === "patch") {
        const files = Array.isArray(content.files) ? content.files.map(asRecord) : [];
        return (
            <div className="rounded-md border border-white/[0.05] bg-black/20 px-4 py-3">
                <div className="text-sm font-medium text-white/75">Generated Patch Preview</div>
                <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                        <details key={`${file.path}-${index}`} className="rounded-md border border-white/[0.05] bg-black/25 px-3 py-2">
                            <summary className="cursor-pointer font-mono text-xs text-white/65">
                                {String(file.path ?? "")} - {String(file.bytes ?? 0)} bytes
                            </summary>
                            <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-black/40 p-3 text-xs text-white/45">
                                {String(file.content ?? "")}
                            </pre>
                        </details>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-white/[0.05] bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white/70">{artifact.kind.replace(/_/g, " ")}</div>
                <div className="text-[11px] text-white/25">{formatDate(artifact.createdAt)}</div>
            </div>
            <pre className="mt-3 max-h-52 overflow-auto rounded-md bg-black/35 p-3 text-xs text-white/45">
                {JSON.stringify(artifact.content, null, 2)}
            </pre>
        </div>
    );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div className="rounded-md border border-white/[0.05] bg-black/20 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-white/25">{label}</div>
            <div className="mt-1 truncate text-sm text-white/70">{value}</div>
        </div>
    );
}

function ListBlock({ label, values }: Readonly<{ label: string; values: string[] }>) {
    return (
        <div className="rounded-md border border-white/[0.05] bg-black/20 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-white/25">{label}</div>
            <div className="mt-2 space-y-1">
                {values.length === 0 && <div className="text-xs text-white/25">None found</div>}
                {values.map((value) => (
                    <div key={value} className="truncate font-mono text-xs text-white/45">{value}</div>
                ))}
            </div>
        </div>
    );
}

function FrontendIntegrationsPageContent() {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = params.id as string;
    const callbackHandledRef = useRef(false);
    const [integrations, setIntegrations] = useState<FrontendIntegration[]>([]);
    const [availableRepos, setAvailableRepos] = useState<GitHubRepositorySummary[]>([]);
    const [installationId, setInstallationId] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");
    const [activeRun, setActiveRun] = useState<FrontendIntegrationRunDetail | null>(null);
    const [runHistory, setRunHistory] = useState<FrontendIntegrationRun[]>([]);
    const [observability, setObservability] = useState<FrontendIntegrationObservability | null>(null);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selectedIntegration = useMemo(
        () => integrations.find((item) => item.id === selectedIntegrationId) ?? integrations[0] ?? null,
        [integrations, selectedIntegrationId],
    );

    const refreshIntegrations = useCallback(async () => {
        setError(null);
        try {
            const rows = await FrontendIntegrationService.listIntegrations(projectId);
            setIntegrations(rows);
            if (!selectedIntegrationId && rows[0]) {
                setSelectedIntegrationId(rows[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load integrations");
        } finally {
            setLoading(false);
        }
    }, [projectId, selectedIntegrationId]);

    const refreshRun = useCallback(async () => {
        if (!activeRun) return;
        try {
            const detail = await FrontendIntegrationService.getRunDetail(
                projectId,
                activeRun.run.integrationId,
                activeRun.run.id,
            );
            setActiveRun(detail);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to refresh run");
        }
    }, [activeRun, projectId]);

    const refreshRunHistory = useCallback(async () => {
        if (!selectedIntegration) {
            setRunHistory([]);
            return;
        }
        try {
            const runs = await FrontendIntegrationService.listRuns(projectId, selectedIntegration.id);
            setRunHistory(runs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load run history");
        }
    }, [projectId, selectedIntegration]);

    const refreshObservability = useCallback(async () => {
        try {
            const result = await FrontendIntegrationService.getObservability(projectId);
            setObservability(result);
        } catch {
            setObservability(null);
        }
    }, [projectId]);

    useEffect(() => {
        refreshIntegrations();
        refreshObservability();
    }, [refreshIntegrations, refreshObservability]);

    useEffect(() => {
        refreshRunHistory();
    }, [refreshRunHistory]);

    useEffect(() => {
        if (callbackHandledRef.current) return;
        const installId = searchParams.get("installation_id");
        const state = searchParams.get("state");
        const setupAction = searchParams.get("setup_action") ?? undefined;
        if (!installId || !state) return;

        callbackHandledRef.current = true;
        setBusy("github-callback");
        setError(null);
        FrontendIntegrationService.completeGitHubInstall(projectId, {
            installationId: installId,
            state,
            setupAction,
        })
            .then((result) => {
                setInstallationId(result.installationId);
                setAvailableRepos(result.repositories);
                router.replace(pathname, { scroll: false });
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Failed to verify GitHub installation");
            })
            .finally(() => setBusy(null));
    }, [pathname, projectId, router, searchParams]);

    useEffect(() => {
        if (!activeRun || TERMINAL_STATUSES.has(activeRun.run.status)) return;
        const timer = setInterval(() => {
            refreshRun();
        }, 3000);
        return () => clearInterval(timer);
    }, [activeRun, refreshRun]);

    const handleInstall = async () => {
        setBusy("install");
        setError(null);
        try {
            const result = await FrontendIntegrationService.getGitHubInstallUrl(projectId, {
                redirectUrl: `${window.location.origin}${pathname}`,
            });
            if (!result.configured || !result.installUrl) {
                setError("GitHub App not configured");
                return;
            }
            window.location.href = result.installUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start GitHub install");
        } finally {
            setBusy(null);
        }
    };

    const handleConnectRepo = async (repo: GitHubRepositorySummary) => {
        if (!installationId) {
            setError("GitHub installation is missing. Install the GitHub App again.");
            return;
        }
        setBusy(`connect:${repo.id}`);
        setError(null);
        try {
            const integration = await FrontendIntegrationService.connectRepo(projectId, {
                provider: "github",
                repoOwner: repo.owner,
                repoName: repo.name,
                repoId: repo.id,
                installationId,
                defaultBranch: repo.defaultBranch,
            });
            setSelectedIntegrationId(integration.id);
            await refreshIntegrations();
            await refreshObservability();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect repository");
        } finally {
            setBusy(null);
        }
    };

    const handleCreateRun = async () => {
        if (!selectedIntegration) return;
        setBusy(`run:${selectedIntegration.id}`);
        setError(null);
        try {
            const run = await FrontendIntegrationService.createRun(projectId, selectedIntegration.id, {
                instructions: instructions.trim() || undefined,
            });
            setInstructions("");
            const detail = await FrontendIntegrationService.getRunDetail(projectId, selectedIntegration.id, run.id);
            setActiveRun(detail);
            await refreshRunHistory();
            await refreshObservability();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to queue run");
        } finally {
            setBusy(null);
        }
    };

    const handleCancelRun = async () => {
        if (!activeRun || TERMINAL_STATUSES.has(activeRun.run.status)) return;
        setBusy("cancel");
        setError(null);
        try {
            const run = await FrontendIntegrationService.cancelRun(
                projectId,
                activeRun.run.integrationId,
                activeRun.run.id,
            );
            setActiveRun((current) => current ? { ...current, run } : current);
            await refreshRunHistory();
            await refreshObservability();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel run");
        } finally {
            setBusy(null);
        }
    };

    const handleOpenPullRequest = async () => {
        if (!activeRun || activeRun.run.status !== "awaiting_approval") return;
        setBusy("open-pr");
        setError(null);
        try {
            const run = await FrontendIntegrationService.openPullRequest(
                projectId,
                activeRun.run.integrationId,
                activeRun.run.id,
            );
            const detail = await FrontendIntegrationService.getRunDetail(projectId, run.integrationId, run.id);
            setActiveRun(detail);
            await refreshRunHistory();
            await refreshObservability();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to open pull request");
            await refreshRun();
        } finally {
            setBusy(null);
        }
    };

    const handleSelectRun = async (run: FrontendIntegrationRun) => {
        setBusy(`history:${run.id}`);
        setError(null);
        try {
            const detail = await FrontendIntegrationService.getRunDetail(projectId, run.integrationId, run.id);
            setActiveRun(detail);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load run");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white/90">Frontend Wiring</h1>
                    <p className="mt-1 text-sm text-white/35">GitHub repo picker, scan, validation, and draft PRs</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-white/[0.08] bg-white/[0.02] text-white/65 hover:bg-white/[0.06]"
                        onClick={refreshIntegrations}
                        disabled={loading}
                    >
                        <RefreshCcw />
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        className="bg-white text-black hover:bg-white/85"
                        onClick={handleInstall}
                        disabled={busy === "install" || busy === "github-callback"}
                    >
                        <Github />
                        {busy === "github-callback" ? "Verifying" : "Install"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-400/15 bg-red-400/5 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {observability && (
                <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-cyan-200/70" />
                            <h2 className="text-sm font-medium text-white/75">Observability</h2>
                        </div>
                        <Badge variant="outline" className="rounded-md border-white/[0.08] text-white/40">
                            {observability.flags.requireMicroVmSandbox ? "microVM required" : "progressive rollout"}
                        </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                        <Metric label="Runs" value={String(observability.summary.totalRunsWindow)} />
                        <Metric label="PRs" value={String(observability.summary.prCreatedRunsWindow)} />
                        <Metric label="Approval" value={String(observability.summary.awaitingApprovalRunsWindow)} />
                        <Metric label="Failures" value={String(observability.summary.failedRunsWindow)} />
                    </div>
                    {observability.alerts.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {observability.alerts.map((alert) => (
                                <div
                                    key={`${alert.type}-${alert.message}`}
                                    className="flex items-start gap-2 rounded-md border border-amber-300/10 bg-amber-300/[0.04] px-3 py-2 text-xs text-amber-100/70"
                                >
                                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white/75">GitHub Repositories</h2>
                        <Badge variant="outline" className="rounded-md border-white/[0.08] text-white/35">
                            {availableRepos.length}
                        </Badge>
                    </div>
                    {availableRepos.length === 0 && (
                        <div className="rounded-md border border-white/[0.05] px-4 py-8 text-center text-sm text-white/30">
                            Install the GitHub App to select repositories
                        </div>
                    )}
                    <div className="space-y-2">
                        {availableRepos.map((repo) => (
                            <div key={repo.id} className="rounded-md border border-white/[0.06] bg-black/20 px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            {repo.private ? <Lock className="h-3.5 w-3.5 text-white/30" /> : <Unlock className="h-3.5 w-3.5 text-white/30" />}
                                            <span className="truncate text-sm font-medium text-white/80">{repo.fullName}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-white/30">
                                            {repo.defaultBranch} - updated {formatDate(repo.updatedAt)}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25"
                                        onClick={() => handleConnectRepo(repo)}
                                        disabled={busy === `connect:${repo.id}`}
                                    >
                                        Connect
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white/75">Connected Repositories</h2>
                        <span className="text-xs text-white/25">{integrations.length}</span>
                    </div>

                    {loading && (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }, (_, index) => (
                                <div key={index} className="h-16 animate-pulse rounded-md bg-white/[0.04]" />
                            ))}
                        </div>
                    )}

                    {!loading && integrations.length === 0 && (
                        <div className="rounded-md border border-white/[0.05] px-4 py-8 text-center text-sm text-white/30">
                            No repositories connected
                        </div>
                    )}

                    <div className="space-y-2">
                        {integrations.map((integration) => {
                            const selected = selectedIntegration?.id === integration.id;
                            return (
                                <button
                                    type="button"
                                    key={integration.id}
                                    onClick={() => setSelectedIntegrationId(integration.id)}
                                    className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                                        selected
                                            ? "border-cyan-300/25 bg-cyan-300/10"
                                            : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04]"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-white/80">
                                                {integration.repoOwner}/{integration.repoName}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/30">
                                                <span>{integration.defaultBranch}</span>
                                                <span>{formatDate(integration.updatedAt)}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={integration.status} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-4">
                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white/75">Run Scanner</h2>
                        {selectedIntegration && <StatusBadge status={selectedIntegration.status} />}
                    </div>
                    <Textarea
                        value={instructions}
                        onChange={(event) => setInstructions(event.target.value)}
                        placeholder="Optional instructions"
                        maxLength={2000}
                        className="min-h-28 border-white/[0.08] bg-black/20 text-white/75 placeholder:text-white/20"
                    />
                    <Button
                        type="button"
                        className="mt-4 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
                        onClick={handleCreateRun}
                        disabled={!selectedIntegration || busy === `run:${selectedIntegration?.id}`}
                    >
                        <Play />
                        Scan
                    </Button>
                </div>

                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white/75">Run History</h2>
                        <Badge variant="outline" className="rounded-md border-white/[0.08] text-white/35">
                            {runHistory.length}
                        </Badge>
                    </div>
                    {runHistory.length === 0 && (
                        <div className="rounded-md border border-white/[0.05] px-4 py-6 text-center text-sm text-white/30">
                            No runs yet
                        </div>
                    )}
                    <div className="space-y-2">
                        {runHistory.map((run) => (
                            <button
                                key={run.id}
                                type="button"
                                onClick={() => handleSelectRun(run)}
                                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                                    activeRun?.run.id === run.id
                                        ? "border-amber-300/25 bg-amber-300/10"
                                        : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04]"
                                }`}
                                disabled={busy === `history:${run.id}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs text-white/55">{run.id.slice(0, 8)}</span>
                                    <StatusBadge status={run.status} />
                                </div>
                                <div className="mt-1 truncate text-xs text-white/30">
                                    {formatDate(run.createdAt)} - {run.targetBranch ?? "branch pending"}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                </div>

                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-medium text-white/75">Plan & Approval</h2>
                        {activeRun && (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <StatusBadge status={activeRun.run.status} />
                                {!TERMINAL_STATUSES.has(activeRun.run.status) && (
                                    <>
                                        {activeRun.run.status === "awaiting_approval" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
                                                onClick={handleOpenPullRequest}
                                                disabled={busy === "open-pr"}
                                            >
                                                <GitPullRequest />
                                                Open PR
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-red-400/15 bg-red-400/5 text-red-200 hover:bg-red-400/10"
                                            onClick={handleCancelRun}
                                            disabled={busy === "cancel"}
                                        >
                                            <XCircle />
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {!activeRun && (
                        <div className="rounded-md border border-white/[0.05] px-4 py-8 text-center text-sm text-white/30">
                            Run a scan to preview findings and generated changes
                        </div>
                    )}

                    {activeRun && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Metric label="Branch" value={activeRun.run.targetBranch ?? "pending"} />
                                <Metric label="Artifacts" value={String(activeRun.artifacts.length)} />
                                <Metric label="Created" value={formatDate(activeRun.run.createdAt)} />
                            </div>

                            {activeRun.run.summary && (
                                <div className="rounded-md border border-white/[0.05] bg-black/20 px-4 py-3 text-sm text-white/55">
                                    {activeRun.run.summary}
                                </div>
                            )}

                            {activeRun.run.prUrl && (
                                <Button asChild variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                                    <a href={activeRun.run.prUrl} target="_blank" rel="noreferrer">
                                        <GitPullRequest />
                                        Pull Request
                                        <ExternalLink />
                                    </a>
                                </Button>
                            )}

                            <div className="space-y-3">
                                {activeRun.artifacts.map((artifact) => (
                                    <ArtifactPanel key={artifact.id} artifact={artifact} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default function FrontendIntegrationsPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-white/35">Loading frontend wiring...</div>}>
            <FrontendIntegrationsPageContent />
        </Suspense>
    );
}
