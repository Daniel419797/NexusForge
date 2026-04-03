"use client";

import { useState } from "react";
import { LogIn, UserPlus, User, LogOut } from "lucide-react";
import testApi from "@/services/testApi";
import ResponsePanel, { ApiResponse } from "./ResponsePanel";
import { LogEntry } from "./RequestLog";

interface AuthTestProps {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  onAuthChange: (loggedIn: boolean, email?: string) => void;
}

async function callApi(
  method: "get" | "post",
  url: string,
  body: unknown,
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void
): Promise<ApiResponse> {
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

export default function AuthTest({ onLog, onAuthChange }: AuthTestProps) {
  const [activeTab, setActiveTab] = useState<"register" | "login" | "profile" | "logout">("login");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Register form
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    const res = await callApi("post", "/auth/register", { email: regEmail, password: regPassword, name: regName }, onLog);
    setResponse(res);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const res = await callApi("post", "/auth/login", { email: loginEmail, password: loginPassword }, onLog);
    if (res.status === 200 || res.status === 201) {
      const d = res.data as { data?: { accessToken?: string; refreshToken?: string; user?: { email?: string } } };
      if (d?.data?.accessToken) {
        localStorage.setItem("test_accessToken", d.data.accessToken);
        if (d.data.refreshToken) localStorage.setItem("test_refreshToken", d.data.refreshToken);
        onAuthChange(true, d.data.user?.email || loginEmail);
      }
    }
    setResponse(res);
    setLoading(false);
  };

  const handleGetProfile = async () => {
    setLoading(true);
    const res = await callApi("get", "/auth/me", null, onLog);
    setResponse(res);
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    const res = await callApi("post", "/auth/logout", {}, onLog);
    localStorage.removeItem("test_accessToken");
    localStorage.removeItem("test_refreshToken");
    onAuthChange(false);
    setResponse(res);
    setLoading(false);
  };

  const tabs = [
    { id: "login", label: "Login", icon: LogIn },
    { id: "register", label: "Register", icon: UserPlus },
    { id: "profile", label: "Profile", icon: User },
    { id: "logout", label: "Logout", icon: LogOut },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === tab.id ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "register" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /auth/register</div>
          <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Password" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={handleRegister} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            Register
          </button>
        </div>
      )}

      {activeTab === "login" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /auth/login</div>
          <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            Login
          </button>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">GET /auth/me</div>
          <button onClick={handleGetProfile} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            Get My Profile
          </button>
        </div>
      )}

      {activeTab === "logout" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono bg-slate-800 rounded px-2 py-1">POST /auth/logout</div>
          <button onClick={handleLogout} disabled={loading} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            Logout
          </button>
        </div>
      )}

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
}
