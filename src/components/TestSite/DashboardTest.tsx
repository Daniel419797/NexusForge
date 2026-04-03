"use client";

import { useState } from "react";
import { BarChart3, Activity, TrendingUp, RefreshCw } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface DashboardTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

async function callApi(url: string, onLog: (e: Omit<LogEntry, "id" | "timestamp">) => void): Promise<ApiResponse> {
  const start = Date.now();
  try {
    const res = await testApi.get(url);
    const responseTime = Date.now() - start;
    onLog({ method: "GET", url, status: res.status, responseTime, responseBody: res.data });
    return { status: res.status, statusText: res.statusText, data: res.data, responseTime };
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const axiosError = err as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
    onLog({ method: "GET", url, status: axiosError.response?.status, responseTime, responseBody: axiosError.response?.data, error: String(axiosError.message || err) });
    return { status: axiosError.response?.status, statusText: axiosError.response?.statusText, data: axiosError.response?.data, responseTime, error: String(axiosError.message || err) };
  }
}

export default function DashboardTest({ onLog }: DashboardTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (url: string) => {
    setLoading(true);
    setResponse(await callApi(url, onLog));
    setLoading(false);
  };

  const endpoints = [
    { label: "Dashboard Stats", icon: BarChart3, color: "violet", url: "/dashboard/stats" },
    { label: "Activity Feed", icon: Activity, color: "blue", url: "/dashboard/activity" },
    { label: "Analytics", icon: TrendingUp, color: "emerald", url: "/dashboard/analytics" },
    { label: "Overview", icon: BarChart3, color: "orange", url: "/dashboard" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {endpoints.map((ep) => (
          <div key={ep.url} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <ep.icon className={`w-4 h-4 text-${ep.color}-400`} />
              {ep.label}
            </div>
            <div className="text-xs text-slate-500 font-mono">GET {ep.url}</div>
            <button
              onClick={() => run(ep.url)}
              disabled={loading}
              className={`w-full bg-${ep.color}-600 hover:bg-${ep.color}-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1`}
            >
              <RefreshCw className="w-3 h-3" /> Fetch
            </button>
          </div>
        ))}
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
