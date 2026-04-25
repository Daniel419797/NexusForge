import api from "./api";
import type { AxiosError } from "axios";
import { assert, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

/* ──────────────────────────────────────────
   DashboardService — powers the dashboard widgets
   with real aggregated data from the backend.

   Production features:
   - AbortSignal support on all methods (for React cleanup)
   - Retry with exponential backoff for transient failures
   - Typed error normalization
   - Safe defaults on null/undefined responses
   ────────────────────────────────────────── */

// ── Retry helper ──

const RETRYABLE_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const axiosErr = err as AxiosError;
      const status = axiosErr?.response?.status ?? 0;
      // Don't retry 4xx client errors (except 408/429)
      if (status > 0 && !RETRYABLE_CODES.has(status)) throw err;
      // Don't retry if request was aborted
      if (axiosErr?.code === "ERR_CANCELED") throw err;
      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ── Types ──

export interface DashboardStats {
  totalProjects: number;
  apiRequests24h: number;
  activeUsers: number;
  revenueMtd: number;
  totalWallets: number;
  totalTransactions: number;
  aiTokensUsed: number;
  installedPlugins: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  userId: string | null;
  userName: string | null;
  projectId: string;
  createdAt: string;
}

export interface DataModelInfo {
  id: string;
  name: string;
  icon: string;
  fields: Array<{ name: string; type: string; required?: boolean }>;
  recordCount: number;
  color: "cyan" | "purple" | "magenta" | "emerald" | "amber";
}

export interface ModuleUsage {
  module: string;
  count: number;
}

export interface TimeSeriesBucket {
  timestamp: string;
  apiRequests: number;
  wsEvents: number;
  dbOperations: number;
}

export interface AnalyticsResult {
  moduleUsage: ModuleUsage[];
  timeSeries: TimeSeriesBucket[];
}

export interface RealtimeSnapshot {
  wsConnectionsActive: number;
  dbConnectionsActive: number;
  httpRequestsTotal: number;
  requestsLastMinute: number;
  /** Server timestamp for clock drift detection */
  serverTime: string;
}

// ── Defaults (avoids undefined in destructured consumers) ──

const EMPTY_STATS: DashboardStats = {
  totalProjects: 0,
  apiRequests24h: 0,
  activeUsers: 0,
  revenueMtd: 0,
  totalWallets: 0,
  totalTransactions: 0,
  aiTokensUsed: 0,
  installedPlugins: 0,
};

const EMPTY_ANALYTICS: AnalyticsResult = { moduleUsage: [], timeSeries: [] };

const EMPTY_SNAPSHOT: RealtimeSnapshot = {
  wsConnectionsActive: 0,
  dbConnectionsActive: 0,
  httpRequestsTotal: 0,
  requestsLastMinute: 0,
  serverTime: new Date().toISOString(),
};

function requiredString(value: unknown, fieldName: string): string {
  assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
  return value;
}

function requiredNumber(value: unknown, fieldName: string): number {
  assert(typeof value === "number" && Number.isFinite(value), `${fieldName} must be a number`);
  return value;
}

function asDashboardStats(value: unknown): DashboardStats {
  assert(isRecord(value), "Invalid dashboard stats response");
  return {
    totalProjects: requiredNumber(value.totalProjects, "stats.totalProjects"),
    apiRequests24h: requiredNumber(value.apiRequests24h, "stats.apiRequests24h"),
    activeUsers: requiredNumber(value.activeUsers, "stats.activeUsers"),
    revenueMtd: requiredNumber(value.revenueMtd, "stats.revenueMtd"),
    totalWallets: requiredNumber(value.totalWallets, "stats.totalWallets"),
    totalTransactions: requiredNumber(value.totalTransactions, "stats.totalTransactions"),
    aiTokensUsed: requiredNumber(value.aiTokensUsed, "stats.aiTokensUsed"),
    installedPlugins: requiredNumber(value.installedPlugins, "stats.installedPlugins"),
  };
}

function asModuleUsage(value: unknown): ModuleUsage {
  assert(isRecord(value), "Invalid module usage item");
  return {
    module: requiredString(value.module, "moduleUsage.module"),
    count: requiredNumber(value.count, "moduleUsage.count"),
  };
}

function asTimeSeriesBucket(value: unknown): TimeSeriesBucket {
  assert(isRecord(value), "Invalid timeseries bucket item");
  return {
    timestamp: requiredString(value.timestamp, "timeSeries.timestamp"),
    apiRequests: requiredNumber(value.apiRequests, "timeSeries.apiRequests"),
    wsEvents: requiredNumber(value.wsEvents, "timeSeries.wsEvents"),
    dbOperations: requiredNumber(value.dbOperations, "timeSeries.dbOperations"),
  };
}

function asAnalyticsResult(value: unknown): AnalyticsResult {
  assert(isRecord(value), "Invalid analytics response");
  return {
    moduleUsage: toArray(value.moduleUsage, asModuleUsage),
    timeSeries: toArray(value.timeSeries, asTimeSeriesBucket),
  };
}

function asRealtimeSnapshot(value: unknown): RealtimeSnapshot {
  assert(isRecord(value), "Invalid realtime snapshot response");
  return {
    wsConnectionsActive: requiredNumber(value.wsConnectionsActive, "snapshot.wsConnectionsActive"),
    dbConnectionsActive: requiredNumber(value.dbConnectionsActive, "snapshot.dbConnectionsActive"),
    httpRequestsTotal: requiredNumber(value.httpRequestsTotal, "snapshot.httpRequestsTotal"),
    requestsLastMinute: requiredNumber(value.requestsLastMinute, "snapshot.requestsLastMinute"),
    serverTime: requiredString(value.serverTime, "snapshot.serverTime"),
  };
}

const DashboardService = {
  /**
   * Get aggregated dashboard stats (project count, API calls, users, wallets, etc.)
   * @param projectId Optional project scope
   * @param signal AbortSignal for request cancellation
   */
  async getStats(projectId?: string, signal?: AbortSignal): Promise<DashboardStats> {
    if (projectId !== undefined) assertProjectId(projectId);
    return withRetry(async () => {
      const { data } = await api.get("/dashboard/stats", {
        params: projectId ? { projectId } : undefined,
        signal,
      });
      const payload = unwrapDataEnvelope(data);
      return payload == null ? EMPTY_STATS : asDashboardStats(payload);
    });
  },

  /**
   * Get recent activity (audit log entries) across user's projects.
   */
  async getActivity(params?: {
    projectId?: string;
    limit?: number;
    before?: string;
  }, signal?: AbortSignal): Promise<ActivityEntry[]> {
    if (params?.projectId !== undefined) assertProjectId(params.projectId);
    return withRetry(async () => {
      const { data } = await api.get("/dashboard/activity", { params, signal });
      return toArray(unwrapDataEnvelope(data), (item) => item as ActivityEntry);
    });
  },

  /**
   * Get data model info with live row counts.
   */
  async getModels(projectId?: string, signal?: AbortSignal): Promise<DataModelInfo[]> {
    if (projectId !== undefined) assertProjectId(projectId);
    return withRetry(async () => {
      const { data } = await api.get("/dashboard/models", {
        params: projectId ? { projectId } : undefined,
        signal,
      });
      return toArray(unwrapDataEnvelope(data), (item) => item as DataModelInfo);
    });
  },

  /**
   * Get module usage + time-series analytics for chart visualizations.
   * @param opts.projectId Project scope
   * @param opts.buckets Number of time-series buckets (default 80)
   * @param opts.intervalSeconds Bucket width in seconds (default 30)
   * @param signal AbortSignal for request cancellation
   */
  async getAnalytics(
    opts?: { projectId?: string; buckets?: number; intervalSeconds?: number },
    signal?: AbortSignal,
  ): Promise<AnalyticsResult> {
    if (opts?.projectId !== undefined) assertProjectId(opts.projectId);
    return withRetry(async () => {
      const { data } = await api.get("/dashboard/analytics", {
        params: opts,
        signal,
      });
      const payload = unwrapDataEnvelope(data);
      return payload == null ? EMPTY_ANALYTICS : asAnalyticsResult(payload);
    });
  },

  /**
   * Get a real-time metrics snapshot (WS connections, DB connections, request rate).
   * Designed to be polled every few seconds for the live chart.
   *
   * NOTE: Intentionally NOT retried — stale data is better than blocking the
   * poll interval with exponential delay. Failures are silently skipped.
   *
   * @param projectId Project scope
   * @param signal AbortSignal for request cancellation
   */
  async getRealtimeSnapshot(projectId?: string, signal?: AbortSignal): Promise<RealtimeSnapshot> {
    if (projectId !== undefined) assertProjectId(projectId);
    const { data } = await api.get("/dashboard/analytics/snapshot", {
      params: projectId ? { projectId } : undefined,
      signal,
    });
    const payload = unwrapDataEnvelope(data);
    return payload == null ? EMPTY_SNAPSHOT : asRealtimeSnapshot(payload);
  },
};

export default DashboardService;
