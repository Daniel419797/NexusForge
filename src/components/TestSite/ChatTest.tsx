"use client";

import { useState } from "react";
import { MessageSquare, Plus, Send, Trash2, RefreshCw } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface ChatTestProps {
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

export default function ChatTest({ onLog }: ChatTestProps) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [deleteMessageId, setDeleteMessageId] = useState("");

  const run = async (method: "get" | "post" | "delete", url: string, body: unknown = null) => {
    setLoading(true);
    setResponse(await callApi(method, url, body, onLog));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* List Channels */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <MessageSquare className="w-4 h-4 text-violet-400" /> List Channels
          </div>
          <div className="text-xs text-slate-500 font-mono">GET /channels</div>
          <button onClick={() => run("get", "/channels")} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" /> Fetch Channels
          </button>
        </div>

        {/* Create Channel */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Plus className="w-4 h-4 text-emerald-400" /> Create Channel
          </div>
          <div className="text-xs text-slate-500 font-mono">POST /channels</div>
          <input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="Channel name" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <select value={channelType} onChange={(e) => setChannelType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="direct">Direct</option>
          </select>
          <button onClick={() => run("post", "/channels", { name: channelName, type: channelType })} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">
            Create
          </button>
        </div>

        {/* List Messages */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <MessageSquare className="w-4 h-4 text-blue-400" /> Channel Messages
          </div>
          <div className="text-xs text-slate-500 font-mono">GET /channels/:id/messages</div>
          <input value={selectedChannelId} onChange={(e) => setSelectedChannelId(e.target.value)} placeholder="Channel ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("get", `/channels/${selectedChannelId}/messages`)} disabled={loading || !selectedChannelId} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">
            Fetch Messages
          </button>
        </div>

        {/* Send Message */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Send className="w-4 h-4 text-yellow-400" /> Send Message
          </div>
          <div className="text-xs text-slate-500 font-mono">POST /channels/:id/messages</div>
          <input value={selectedChannelId} onChange={(e) => setSelectedChannelId(e.target.value)} placeholder="Channel ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <input value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Message content" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("post", `/channels/${selectedChannelId}/messages`, { content: messageContent })} disabled={loading || !selectedChannelId} className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">
            Send
          </button>
        </div>

        {/* Delete Message */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Trash2 className="w-4 h-4 text-red-400" /> Delete Message
          </div>
          <div className="text-xs text-slate-500 font-mono">DELETE /channels/:channelId/messages/:messageId</div>
          <input value={selectedChannelId} onChange={(e) => setSelectedChannelId(e.target.value)} placeholder="Channel ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <input value={deleteMessageId} onChange={(e) => setDeleteMessageId(e.target.value)} placeholder="Message ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={() => run("delete", `/channels/${selectedChannelId}/messages/${deleteMessageId}`)} disabled={loading || !selectedChannelId || !deleteMessageId} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium transition-colors">
            Delete
          </button>
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
