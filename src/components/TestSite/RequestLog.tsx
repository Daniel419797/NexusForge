"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  responseTime?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

interface RequestLogProps {
  entries: LogEntry[];
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    POST: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono border ${colors[method] || "bg-slate-600 text-slate-300"}`}>
      {method}
    </span>
  );
}

function StatusIcon({ status }: { status?: number }) {
  if (!status) return <span className="text-slate-500 text-xs">—</span>;
  if (status >= 200 && status < 300) return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status >= 400 && status < 500) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" />;
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon status={entry.status} />
        <MethodBadge method={entry.method} />
        <span className="flex-1 text-xs text-slate-300 font-mono truncate">{entry.url}</span>
        {entry.status && (
          <span className={`text-xs font-mono ${entry.status >= 200 && entry.status < 300 ? "text-emerald-400" : entry.status >= 400 && entry.status < 500 ? "text-yellow-400" : "text-red-400"}`}>
            {entry.status}
          </span>
        )}
        {entry.responseTime !== undefined && (
          <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
            <Clock className="w-3 h-3" /> {entry.responseTime}ms
          </span>
        )}
        <span className="text-xs text-slate-600">
          {entry.timestamp.toLocaleTimeString()}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {entry.requestBody !== undefined && entry.requestBody !== null && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Request Body</div>
              <pre className="text-xs text-slate-400 bg-slate-900 rounded p-2 overflow-auto max-h-32">
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </div>
          )}
          {entry.responseBody !== undefined && entry.responseBody !== null && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Response Body</div>
              <pre className="text-xs text-slate-300 bg-slate-900 rounded p-2 overflow-auto max-h-32">
                {JSON.stringify(entry.responseBody, null, 2)}
              </pre>
            </div>
          )}
          {entry.error && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded p-2">{entry.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RequestLog({ entries }: RequestLogProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/70 hover:bg-slate-800 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          Request Log
          <span className="text-xs bg-slate-700 text-slate-400 rounded px-1.5 py-0.5">{entries.length}</span>
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>
      {!collapsed && (
        <div className="max-h-64 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">No requests yet</div>
          ) : (
            entries.slice().reverse().map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}
