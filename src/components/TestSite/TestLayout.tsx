"use client";

import { useState, useCallback } from "react";
import {
  Wifi,
  Lock,
  MessageSquare,
  Bell,
  Puzzle,
  Link2,
  Bot,
  BarChart3,
  Key,
  Shield,
  Rocket,
  Menu,
  X,
  FlaskConical,
} from "lucide-react";
import ConnectionTest from "./ConnectionTest";
import AuthTest from "./AuthTest";
import ChatTest from "./ChatTest";
import NotificationTest from "./NotificationTest";
import PluginTest from "./PluginTest";
import BlockchainTest from "./BlockchainTest";
import AITest from "./AITest";
import DashboardTest from "./DashboardTest";
import ApiKeyTest from "./ApiKeyTest";
import ComplianceTest from "./ComplianceTest";
import DeployTest from "./DeployTest";
import RequestLog, { LogEntry } from "./RequestLog";
import ConfigPanel from "./ConfigPanel";

type TabId =
  | "connection"
  | "auth"
  | "chat"
  | "notifications"
  | "plugins"
  | "blockchain"
  | "ai"
  | "dashboard"
  | "apikeys"
  | "compliance"
  | "deploy";

const TABS = [
  { id: "connection" as TabId, label: "Connection", icon: Wifi, emoji: "🔌" },
  { id: "auth" as TabId, label: "Auth", icon: Lock, emoji: "🔐" },
  { id: "chat" as TabId, label: "Chat", icon: MessageSquare, emoji: "💬" },
  { id: "notifications" as TabId, label: "Notifications", icon: Bell, emoji: "🔔" },
  { id: "plugins" as TabId, label: "Plugins", icon: Puzzle, emoji: "🧩" },
  { id: "blockchain" as TabId, label: "Blockchain", icon: Link2, emoji: "⛓️" },
  { id: "ai" as TabId, label: "AI", icon: Bot, emoji: "🤖" },
  { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3, emoji: "📊" },
  { id: "apikeys" as TabId, label: "API Keys", icon: Key, emoji: "🔑" },
  { id: "compliance" as TabId, label: "Compliance", icon: Shield, emoji: "🛡️" },
  { id: "deploy" as TabId, label: "Deploy", icon: Rocket, emoji: "🚀" },
];

export default function TestLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogEntries((prev) => [
      ...prev,
      { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
    ]);
  }, []);

  const handleAuthChange = useCallback((loggedIn: boolean, email?: string) => {
    setIsLoggedIn(loggedIn);
    setUserEmail(email);
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("test_accessToken");
      localStorage.removeItem("test_refreshToken");
    }
    setIsLoggedIn(false);
    setUserEmail(undefined);
  }, []);

  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Reuse API Tester</h1>
            <p className="text-xs text-slate-400 leading-tight">NexusForge Test Harness</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isLoggedIn ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {userEmail || "Logged in"}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
              Not authenticated
            </span>
          )}
          <span className="text-xs text-slate-600 hidden sm:block font-mono">
            reuse-tnt4.onrender.com
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 lg:top-[57px] left-0 h-full lg:h-[calc(100vh-57px)] w-52 bg-slate-900 border-r border-slate-800 z-30 transition-transform duration-200 flex flex-col pt-14 lg:pt-0`}
        >
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-800">
            <ConfigPanel
              isLoggedIn={isLoggedIn}
              userEmail={userEmail}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeTabInfo.emoji}</span>
              <div>
                <h2 className="text-lg font-bold text-white">{activeTabInfo.label} Module</h2>
                <p className="text-xs text-slate-400">
                  Test the <span className="font-mono text-violet-400">/{activeTabInfo.id === "apikeys" ? "keys" : activeTabInfo.id}</span> gateway endpoints
                </p>
              </div>
            </div>

            {/* Module panel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              {activeTab === "connection" && <ConnectionTest onLog={addLog} />}
              {activeTab === "auth" && (
                <AuthTest onLog={addLog} onAuthChange={handleAuthChange} />
              )}
              {activeTab === "chat" && <ChatTest onLog={addLog} />}
              {activeTab === "notifications" && <NotificationTest onLog={addLog} />}
              {activeTab === "plugins" && <PluginTest onLog={addLog} />}
              {activeTab === "blockchain" && <BlockchainTest onLog={addLog} />}
              {activeTab === "ai" && <AITest onLog={addLog} />}
              {activeTab === "dashboard" && <DashboardTest onLog={addLog} />}
              {activeTab === "apikeys" && <ApiKeyTest onLog={addLog} />}
              {activeTab === "compliance" && <ComplianceTest onLog={addLog} />}
              {activeTab === "deploy" && <DeployTest onLog={addLog} />}
            </div>

            {/* Request log */}
            <RequestLog entries={logEntries} />
          </div>
        </main>
      </div>
    </div>
  );
}
