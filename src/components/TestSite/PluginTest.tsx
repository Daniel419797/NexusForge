"use client";

import { useState } from "react";
import { Puzzle, Download, Trash2, RefreshCw } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface PluginTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

async function callApi(method: "get" | "post" | "delete", url: string, body: unknown, onLog: (e: Omit<LogEntry, "id" | "timestamp">) => void): Promise<ApiResponse> {
  const start = Date.now();
  try {
    const res = method === "get" ? await testApi.get(url) : method === "delete" ? await testApi.delete(url) : await testApi.post(url, body);
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

export default function PluginTest({ onLog }: PluginTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pluginId, setPluginId] = useState("");

  const run = async (method: "get" | "post" | "delete", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Puzzle className="w-4 h-4 text-violet-400" /> Available Plugins</div>
          <div className="text-xs text-slate-500 font-mono">GET /plugins</div>
          <button onClick={() => run("get", "/plugins")} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> List</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Download className="w-4 h-4 text-emerald-400" /> Installed Plugins</div>
          <div className="text-xs text-slate-500 font-mono">GET /plugins/installed</div>
          <button onClick={() => run("get", "/plugins/installed")} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> List Installed</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Download className="w-4 h-4 text-blue-400" /> Install Plugin</div>
          <div className="text-xs text-slate-500 font-mono">POST /plugins/:id/install</div>
          <input value={pluginId} onChange={(e) => setPluginId(e.target.value)} placeholder="Plugin ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("post", `/plugins/${pluginId}/install`, {})} disabled={loading || !pluginId} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">Install</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Trash2 className="w-4 h-4 text-red-400" /> Uninstall Plugin</div>
          <div className="text-xs text-slate-500 font-mono">DELETE /plugins/:id/uninstall</div>
          <input value={pluginId} onChange={(e) => setPluginId(e.target.value)} placeholder="Plugin ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("delete", `/plugins/${pluginId}/uninstall`)} disabled={loading || !pluginId} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">Uninstall</button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
