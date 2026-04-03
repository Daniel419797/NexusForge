"use client";

import { useState } from "react";
import { Copy, Check, Settings, User, LogOut } from "lucide-react";
import { getTestApiUrl, getApiKey } from "@/services/testApi";

interface ConfigPanelProps {
  isLoggedIn: boolean;
  userEmail?: string;
  onLogout: () => void;
}

export default function ConfigPanel({ isLoggedIn, userEmail, onLogout }: ConfigPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const apiUrl = getTestApiUrl();
  const apiKey = getApiKey();
  const maskedKey = apiKey.slice(0, 6) + "•".repeat(Math.max(0, apiKey.length - 10)) + apiKey.slice(-4);

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-slate-200">Config</span>
      </div>

      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">API Base URL</div>
        <div className="text-xs text-slate-300 font-mono bg-slate-800 rounded px-2 py-1.5 break-all">
          {apiUrl}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">API Key</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xs text-slate-300 font-mono bg-slate-800 rounded px-2 py-1.5 truncate">
            {showKey ? apiKey : maskedKey}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="text-xs text-slate-400 hover:text-slate-200 px-1.5 py-1 rounded hover:bg-slate-700 transition-colors"
          >
            {showKey ? "Hide" : "Show"}
          </button>
          <button
            onClick={copyKey}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Auth Status</div>
        {isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Logged In</span>
              {userEmail && <span className="text-xs text-slate-400 ml-1">({userEmail})</span>}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-400">Not logged in</span>
          </div>
        )}
        {isLoggedIn && userEmail && (
          <div className="flex items-center gap-1.5 mt-1">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-300">{userEmail}</span>
          </div>
        )}
      </div>
    </div>
  );
}
