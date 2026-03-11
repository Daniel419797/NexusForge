"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";
import DashboardService from "@/services/DashboardService";
import RealtimeStreamChart from "@/components/Dashboard/RealtimeStreamChart";

// Three.js must be loaded client-only (no SSR)
const WireframeChart3D = dynamic(
    () => import("@/components/Dashboard/WireframeChart3D"),
    { ssr: false },
);

/* ── Constants ── */
const POLL_INTERVAL_MS = 3_000;
const MAX_POINTS = 80;
const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 3_000;

/** Exponential backoff with jitter */
function backoffMs(failures: number): number {
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** failures);
    return delay + Math.random() * 1_000;
}

interface RecentActivity {
    title?: string;
    [key: string]: unknown;
}

export default function ProjectOverviewPage() {
    const project = useProjectStore((s) => s.activeProject);
    const [recent, setRecent] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Analytics state ──
    const [moduleData, setModuleData] = useState<number[]>([]);
    const [moduleLabels, setModuleLabels] = useState<string[]>([]);
    const [realtimeData, setRealtimeData] = useState<number[][] | undefined>(undefined);
    const [analyticsError, setAnalyticsError] = useState(false);

    // Poll tracking refs (not state — avoid re-render on every tick)
    const realtimePointsRef = useRef<number[][]>([[], [], []]);
    const runningMaxRef = useRef(1);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollFailuresRef = useRef(0);
    const isMountedRef = useRef(true);

    // Track mount status for all async ops
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // ── Fetch recent activity with AbortController ──
    useEffect(() => {
        if (!project) return;
        const ac = new AbortController();

        ProjectService.getById(project.id)
            .then((res) => {
                if (ac.signal.aborted) return;
                const config = (res.config ?? {}) as Record<string, unknown>;
                setRecent((config?.recentActivity as RecentActivity[]) || []);
            })
            .catch(() => { })
            .finally(() => { if (!ac.signal.aborted) setLoading(false); });

        return () => ac.abort();
    }, [project]);

    // ── Fetch analytics (module usage + time-series seed) with AbortController ──
    useEffect(() => {
        if (!project) return;
        const ac = new AbortController();

        DashboardService.getAnalytics(
            { projectId: project.id, buckets: MAX_POINTS, intervalSeconds: 30 },
            ac.signal,
        )
            .then((analytics) => {
                if (ac.signal.aborted) return;

                // Module usage → WireframeChart3D
                if (analytics.moduleUsage.length > 0) {
                    const maxCount = Math.max(1, ...analytics.moduleUsage.map((m: { count: number }) => m.count));
                    setModuleLabels(analytics.moduleUsage.map((m: { module: string }) => m.module));
                    setModuleData(analytics.moduleUsage.map((m: { count: number }) => m.count / maxCount));
                }

                // Time series → seed RealtimeStreamChart
                if (analytics.timeSeries.length > 0) {
                    const maxVal = Math.max(
                        1,
                        ...analytics.timeSeries.map((b: { apiRequests: number; wsEvents: number; dbOperations: number }) =>
                            Math.max(b.apiRequests, b.wsEvents, b.dbOperations),
                        ),
                    );
                    runningMaxRef.current = maxVal;
                    const api = analytics.timeSeries.map((b: { apiRequests: number }) => b.apiRequests / maxVal);
                    const ws = analytics.timeSeries.map((b: { wsEvents: number }) => b.wsEvents / maxVal);
                    const db = analytics.timeSeries.map((b: { dbOperations: number }) => b.dbOperations / maxVal);
                    realtimePointsRef.current = [api, ws, db];
                    setRealtimeData([api, ws, db]);
                }
            })
            .catch(() => {
                if (!ac.signal.aborted) setAnalyticsError(true);
            });

        return () => ac.abort();
    }, [project]);

    // ── Append snapshot point with running-max normalization ──
    const appendSnapshotPoint = useCallback(
        (snapshot: { requestsLastMinute: number; wsConnectionsActive: number; dbConnectionsActive: number }) => {
            // Update running max for proper 0–1 normalization
            const rawMax = Math.max(
                snapshot.requestsLastMinute,
                snapshot.wsConnectionsActive,
                snapshot.dbConnectionsActive,
            );
            if (rawMax > runningMaxRef.current) {
                runningMaxRef.current = rawMax;
            }
            const divisor = Math.max(1, runningMaxRef.current);

            const apiVal = Math.min(1, snapshot.requestsLastMinute / divisor);
            const wsVal = Math.min(1, snapshot.wsConnectionsActive / divisor);
            const dbVal = Math.min(1, snapshot.dbConnectionsActive / divisor);

            const pts = realtimePointsRef.current;
            pts[0] = [...pts[0], apiVal].slice(-MAX_POINTS);
            pts[1] = [...pts[1], wsVal].slice(-MAX_POINTS);
            pts[2] = [...pts[2], dbVal].slice(-MAX_POINTS);
            setRealtimeData([pts[0], pts[1], pts[2]]);
        },
        [],
    );

    // ── Poll realtime snapshot with visibility-awareness + exponential backoff ──
    useEffect(() => {
        if (!project) return;
        const ac = new AbortController();

        const schedulePoll = () => {
            const delay = pollFailuresRef.current > 0
                ? backoffMs(pollFailuresRef.current)
                : POLL_INTERVAL_MS;

            pollTimerRef.current = setTimeout(async () => {
                // Skip polling when tab is hidden (save bandwidth)
                if (document.hidden) {
                    schedulePoll();
                    return;
                }
                try {
                    const snapshot = await DashboardService.getRealtimeSnapshot(
                        project.id,
                        ac.signal,
                    );
                    if (ac.signal.aborted) return;
                    pollFailuresRef.current = 0;
                    appendSnapshotPoint(snapshot);
                } catch {
                    if (ac.signal.aborted) return;
                    pollFailuresRef.current = Math.min(pollFailuresRef.current + 1, 5);
                }
                if (!ac.signal.aborted) schedulePoll();
            }, delay);
        };

        // Start polling
        schedulePoll();

        // Resume polling faster when tab regains visibility
        const handleVisibilityChange = () => {
            if (!document.hidden && pollFailuresRef.current === 0) {
                // Clear pending timer and re-poll immediately
                if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
                DashboardService.getRealtimeSnapshot(project.id, ac.signal)
                    .then((snap) => {
                        if (!ac.signal.aborted) appendSnapshotPoint(snap);
                    })
                    .catch(() => { });
                schedulePoll();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            ac.abort();
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [project, appendSnapshotPoint]);

    if (!project) return null;

    return (
        <div className="space-y-6">
            {/* Top header */}
            <div className="animate-in-up">
                <h1 className="text-3xl font-bold font-display tracking-tight">{project.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">Project overview and quick access</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-3d animate-in-up stagger-1">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold capitalize mono">{project.status || "unknown"}</div>
                                <div className="text-xs text-muted-foreground mono mt-1">{new Date(project.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span className={`status-dot ${project.status === "active" ? "status-active" : "status-inactive"}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-3d animate-in-up stagger-2">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Plugins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold mono">{project.enabledModules?.length || 0}</div>
                            <Link href={`/projects/${project.id}/plugins`} className="text-sm text-primary hover:underline">Manage</Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-3d animate-in-up stagger-3">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">API Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">View</div>
                            <Link href={`/projects/${project.id}/api-keys`} className="text-sm text-primary hover:underline">Manage</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Data Visualization ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in-up stagger-3">
                {/* 3D Wireframe Bar Chart — real module usage from audit logs */}
                <div>
                    <h3 className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Module Usage</h3>
                    {analyticsError ? (
                        <div className="flex items-center justify-center rounded-xl h-70 text-xs font-mono text-white/20"
                            style={{ background: "rgba(8,10,25,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            Failed to load analytics — will retry on next navigation
                        </div>
                    ) : (
                        <WireframeChart3D
                            data={moduleData.length > 0 ? moduleData : [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]}
                            labels={moduleLabels.length > 0 ? moduleLabels : ["Auth", "DB", "AI", "WS", "Files", "Cron", "Hooks"]}
                            accent="purple"
                            height={280}
                            title={moduleData.length > 0 ? "Module activity (live) — hover to inspect" : "Module activity — awaiting data"}
                        />
                    )}
                </div>

                {/* Real-time Multi-Stream Line Chart — live backend metrics */}
                <div>
                    <h3 className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Live Data Streams</h3>
                    <RealtimeStreamChart
                        streams={[
                            { label: "API Requests", accent: "purple" },
                            { label: "WebSocket", accent: "cyan" },
                            { label: "DB Queries", accent: "emerald" },
                        ]}
                        externalData={realtimeData}
                        maxPoints={MAX_POINTS}
                        height={280}
                        title={`real-time · poll ${POLL_INTERVAL_MS / 1000}s`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in-up stagger-4">
                <Card className="lg:col-span-2 card-hover">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Loading…</div>
                        ) : recent.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No recent activity.</div>
                        ) : (
                            <ul className="space-y-2">
                                {recent.map((r, i) => (
                                    <li key={i} className="text-sm">{r.title || JSON.stringify(r)}</li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <Link href={`/projects/${project.id}/api`} className="text-sm text-primary">View API</Link>
                            <Link href={`/projects/${project.id}/settings`} className="text-sm">Settings</Link>
                            <Link href={`/projects/${project.id}/documentation`} className="text-sm">Documentation</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
