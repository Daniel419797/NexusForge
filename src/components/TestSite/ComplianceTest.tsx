"use client";

import { useState } from "react";
import { Shield, Download, FileText, RefreshCw, ToggleLeft } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface ComplianceTestProps {
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

export default function ComplianceTest({ onLog }: ComplianceTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);

  const run = async (method: "get" | "post" | "patch", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Shield className="w-4 h-4 text-violet-400" /> Consent Status</div>
          <div className="text-xs text-slate-500 font-mono">GET /compliance/consent</div>
          <button onClick={() => run("get", "/compliance/consent")} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Get Status</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><ToggleLeft className="w-4 h-4 text-blue-400" /> Record Consent</div>
          <div className="text-xs text-slate-500 font-mono">POST /compliance/consent</div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="rounded" />
            Consent given: {consentGiven ? "Yes" : "No"}
          </label>
          <button onClick={() => run("post", "/compliance/consent", { given: consentGiven })} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">Record</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Download className="w-4 h-4 text-emerald-400" /> Export Data</div>
          <div className="text-xs text-slate-500 font-mono">POST /compliance/export</div>
          <button onClick={() => run("post", "/compliance/export", {})} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><Download className="w-3 h-3" /> Export</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Shield className="w-4 h-4 text-yellow-400" /> HIPAA Status</div>
          <div className="text-xs text-slate-500 font-mono">GET /compliance/hipaa</div>
          <button onClick={() => run("get", "/compliance/hipaa")} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Check</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><FileText className="w-4 h-4 text-orange-400" /> Audit Logs</div>
          <div className="text-xs text-slate-500 font-mono">GET /compliance/audit-logs</div>
          <button onClick={() => run("get", "/compliance/audit-logs")} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> View Logs</button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
