"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export interface ApiResponse {
  status?: number;
  statusText?: string;
  data?: unknown;
  headers?: Record<string, string>;
  responseTime?: number;
  error?: string;
}

interface ResponsePanelProps {
  response: ApiResponse | null;
  loading?: boolean;
}

function StatusBadge({ status }: { status?: number }) {
  if (!status) return null;
  const isSuccess = status >= 200 && status < 300;
  const isClientError = status >= 400 && status < 500;
  const isServerError = status >= 500;

  if (isSuccess)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <CheckCircle className="w-3 h-3" /> {status}
      </span>
    );
  if (isClientError)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <AlertTriangle className="w-3 h-3" /> {status}
      </span>
    );
  if (isServerError)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30">
        <XCircle className="w-3 h-3" /> {status}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-slate-600 text-slate-300">
      {status}
    </span>
  );
}

export default function ResponsePanel({ response, loading }: ResponsePanelProps) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-500 text-sm italic">
        No response yet. Send a request to see the result.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Response meta */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-700 bg-slate-800/50">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Response</span>
        {response.status && <StatusBadge status={response.status} />}
        {response.statusText && (
          <span className="text-xs text-slate-400">{response.statusText}</span>
        )}
        {response.responseTime !== undefined && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" /> {response.responseTime}ms
          </span>
        )}
      </div>

      {/* Error message */}
      {response.error && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-400 font-mono">{response.error}</p>
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        <pre className="text-xs text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
          {response.data !== undefined
            ? JSON.stringify(response.data, null, 2)
            : response.error
            ? ""
            : "No body"}
        </pre>
      </div>
    </div>
  );
}
