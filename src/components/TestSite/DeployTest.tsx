"use client";

import { useState } from "react";
import { Rocket, CheckCircle, History, Activity, RefreshCw } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface DeployTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

async function callApi(method: "get" | "post", url: string, body: unknown, onLog: (e: Omit<LogEntry, "id" | "timestamp">) => void): Promise<ApiResponse> {
  const start = Date.now();
  try {
    const res = method === "get" ? await testApi.get(url) : await testApi.post(url, body);
    const responseTime = Date.now() - start;
    onLog({ method: method.toUpperCase(), url, status: res.status, responseTime, requestBody: body, responseBody: res.data });
    return { status: res.status, statusText: res.statusText, data: res.data, responseTime };
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const axiosError = err as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
    onLog({ method: method.toUpperCase(), url, status: axiosError.response?.status, responseTime, requestBody: body, responseBody: axiosError.response?.data, error: String(axiosError.message || err) });
    return { status: axiosError.response?.status, statusText: axiosError.response?.statusText, data: axiosError.response?.data, responseTime, error: String(axiosError.message || err) };
  }
}

export default function DeployTest({ onLog }: DeployTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (method: "get" | "post", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><CheckCircle className="w-4 h-4 text-emerald-400" /> Readiness Check</div>
          <div className="text-xs text-slate-500 font-mono">GET /deploy/readiness</div>
          <button onClick={() => run("get", "/deploy/readiness")} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Check</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Rocket className="w-4 h-4 text-violet-400" /> Trigger Deploy</div>
          <div className="text-xs text-slate-500 font-mono">POST /deploy</div>
          <button onClick={() => run("post", "/deploy", {})} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><Rocket className="w-3 h-3" /> Deploy</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><History className="w-4 h-4 text-blue-400" /> Deploy History</div>
          <div className="text-xs text-slate-500 font-mono">GET /deploy/history</div>
          <button onClick={() => run("get", "/deploy/history")} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> History</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Activity className="w-4 h-4 text-yellow-400" /> Current Status</div>
          <div className="text-xs text-slate-500 font-mono">GET /deploy/status</div>
          <button onClick={() => run("get", "/deploy/status")} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Status</button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
