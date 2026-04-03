"use client";

import { useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface NotificationTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

async function callApi(method: "get" | "post" | "patch", url: string, body: unknown, onLog: (e: Omit<LogEntry, "id" | "timestamp">) => void): Promise<ApiResponse> {
  const start = Date.now();
  try {
    const res = method === "get" ? await testApi.get(url) : method === "patch" ? await testApi.patch(url, body) : await testApi.post(url, body);
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

export default function NotificationTest({ onLog }: NotificationTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifId, setNotifId] = useState("");

  const run = async (method: "get" | "post" | "patch", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Bell className="w-4 h-4 text-yellow-400" /> List Notifications</div>
          <div className="text-xs text-slate-500 font-mono">GET /notifications</div>
          <button onClick={() => run("get", "/notifications")} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Fetch</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Bell className="w-4 h-4 text-orange-400" /> Unread Count</div>
          <div className="text-xs text-slate-500 font-mono">GET /notifications/unread-count</div>
          <button onClick={() => run("get", "/notifications/unread-count")} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Get Count</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><CheckCheck className="w-4 h-4 text-emerald-400" /> Mark as Read</div>
          <div className="text-xs text-slate-500 font-mono">PATCH /notifications/:id/read</div>
          <input value={notifId} onChange={(e) => setNotifId(e.target.value)} placeholder="Notification ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("patch", `/notifications/${notifId}/read`, {})} disabled={loading || !notifId} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">Mark Read</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><CheckCheck className="w-4 h-4 text-blue-400" /> Mark All Read</div>
          <div className="text-xs text-slate-500 font-mono">PATCH /notifications/read-all</div>
          <button onClick={() => run("patch", "/notifications/read-all", {})} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">Mark All Read</button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
