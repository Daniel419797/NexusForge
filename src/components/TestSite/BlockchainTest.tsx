"use client";

import { useState } from "react";
import { Link2, Wallet, ArrowRightLeft, Image as ImageIcon, RefreshCw, Plus } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface BlockchainTestProps {
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

export default function BlockchainTest({ onLog }: BlockchainTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chain, setChain] = useState("ethereum");

  const buildFakeAddress = () => {
    const alphabet = "0123456789abcdef";
    let value = "0x";
    for (let i = 0; i < 40; i += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return value;
  };

  const run = async (method: "get" | "post", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Wallet className="w-4 h-4 text-violet-400" /> List Wallets</div>
          <div className="text-xs text-slate-500 font-mono">GET /blockchain/wallets</div>
          <button onClick={() => run("get", "/blockchain/wallets")} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Fetch</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Plus className="w-4 h-4 text-emerald-400" /> Create Wallet</div>
          <div className="text-xs text-slate-500 font-mono">POST /blockchain/wallets</div>
          <select value={chain} onChange={(e) => setChain(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
            <option value="ethereum">Ethereum</option>
            <option value="base">Base</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
          <button
            onClick={() => run("post", "/blockchain/wallets", {
              address: buildFakeAddress(),
              chain,
              label: "Test Wallet",
            })}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors"
          >
            Create
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><ArrowRightLeft className="w-4 h-4 text-blue-400" /> Transactions</div>
          <div className="text-xs text-slate-500 font-mono">GET /blockchain/transactions</div>
          <button onClick={() => run("get", "/blockchain/transactions")} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Fetch</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><ImageIcon className="w-4 h-4 text-yellow-400" /> NFTs</div>
          <div className="text-xs text-slate-500 font-mono">GET /blockchain/nfts</div>
          <button onClick={() => run("get", "/blockchain/nfts")} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Fetch NFTs</button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Link2 className="w-4 h-4 text-orange-400" /> Networks</div>
          <div className="text-xs text-slate-500 font-mono">GET /blockchain/networks</div>
          <button onClick={() => run("get", "/blockchain/networks")} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Fetch</button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
