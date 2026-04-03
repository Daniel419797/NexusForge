"use client";

import { useState } from "react";
import { Wifi, WifiOff, Zap } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface ConnectionTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

export default function ConnectionTest({ onLog }: ConnectionTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const res = await testApi.get("/auth/me");
      const responseTime = Date.now() - start;
      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        responseTime,
      };
      setResponse(apiResponse);
      setConnected(true);
      onLog({ method: "GET", url: "/auth/me", status: res.status, responseTime, responseBody: res.data });
    } catch (err: unknown) {
      const responseTime = Date.now() - start;
      const axiosError = err as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
      const apiResponse: ApiResponse = {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        responseTime,
        error: axiosError.response ? undefined : String(axiosError.message || err),
      };
      setResponse(apiResponse);
      // If we get a 401, the server IS reachable — just need auth
      setConnected(axiosError.response !== undefined);
      onLog({
        method: "GET",
        url: "/auth/me",
        status: axiosError.response?.status,
        responseTime,
        responseBody: axiosError.response?.data,
        error: axiosError.response ? undefined : String(axiosError.message || err),
      });
    } finally {
      setLoading(false);
    }
  };

  const healthCheck = async () => {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const res = await testApi.get("/");
      const responseTime = Date.now() - start;
      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        responseTime,
      };
      setResponse(apiResponse);
      setConnected(true);
      onLog({ method: "GET", url: "/", status: res.status, responseTime, responseBody: res.data });
    } catch (err: unknown) {
      const responseTime = Date.now() - start;
      const axiosError = err as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
      const apiResponse: ApiResponse = {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        responseTime,
        error: axiosError.response ? undefined : String(axiosError.message || err),
      };
      setResponse(apiResponse);
      setConnected(axiosError.response !== undefined);
      onLog({
        method: "GET",
        url: "/",
        status: axiosError.response?.status,
        responseTime,
        responseBody: axiosError.response?.data,
        error: axiosError.response ? undefined : String(axiosError.message || err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${connected === null ? "bg-slate-800 text-slate-400 border-slate-700" : connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
          {connected === null ? <Wifi className="w-4 h-4" /> : connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {connected === null ? "Not tested" : connected ? "Connected" : "Unreachable"}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={healthCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" />
          Health Check (GET /)
        </button>
        <button
          onClick={testConnection}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <Wifi className="w-4 h-4" />
          Auth Ping (GET /auth/me)
        </button>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
