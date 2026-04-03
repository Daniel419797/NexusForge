"use client";

import { useState } from "react";
import { Bot, MessageSquare, BarChart3, RefreshCw, Send } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface AITestProps {
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

export default function AITest({ onLog }: AITestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "chat" | "analyze" | "usage">("generate");

  // Generate
  const [prompt, setPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState("256");
  const [temperature, setTemperature] = useState("0.7");

  // Chat
  const [chatMessages, setChatMessages] = useState('[{"role":"user","content":"Hello!"}]');

  // Analyze
  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzeType, setAnalyzeType] = useState("sentiment");

  const run = async (method: "get" | "post", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  const tabs = [
    { id: "generate", label: "Generate", icon: Bot },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "analyze", label: "Analyze", icon: BarChart3 },
    { id: "usage", label: "Usage", icon: RefreshCw },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === tab.id ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /ai/generate</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt..." rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Tokens</label>
              <input value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} type="number" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Temperature</label>
              <input value={temperature} onChange={(e) => setTemperature(e.target.value)} type="number" step="0.1" min="0" max="2" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <button onClick={() => run("post", "/ai/generate", { prompt, maxTokens: parseInt(maxTokens), temperature: parseFloat(temperature) })} disabled={loading || !prompt} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Generate
          </button>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /ai/chat</div>
          <label className="text-xs text-slate-400">Messages (JSON array)</label>
          <textarea value={chatMessages} onChange={(e) => setChatMessages(e.target.value)} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono focus:outline-none focus:border-violet-500 resize-none" />
          <button onClick={() => { try { run("post", "/ai/chat", { messages: JSON.parse(chatMessages) }); } catch { setResponse({ error: "Invalid JSON in messages" }); } }} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Send Chat
          </button>
        </div>
      )}

      {activeTab === "analyze" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /ai/analyze</div>
          <textarea value={analyzeText} onChange={(e) => setAnalyzeText(e.target.value)} placeholder="Text to analyze..." rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
          <select value={analyzeType} onChange={(e) => setAnalyzeType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500">
            <option value="sentiment">Sentiment</option>
            <option value="summary">Summary</option>
            <option value="extract">Extract</option>
            <option value="moderate">Moderate</option>
          </select>
          <button onClick={() => run("post", "/ai/analyze", { text: analyzeText, type: analyzeType })} disabled={loading || !analyzeText} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">Analyze</button>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">GET /ai/usage</div>
          <button onClick={() => run("get", "/ai/usage")} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Get Usage Stats
          </button>
        </div>
      )}

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
