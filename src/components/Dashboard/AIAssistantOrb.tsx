"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import DashboardAssistantService, {
  type AssistantMessage,
} from "@/services/DashboardAssistantService";
import { useProjectStore } from "@/store/projectStore";

/* ──────────────────────────────────────
   AIAssistantOrb — Floating AI chat widget
   Wired to real DashboardAssistantService
   ────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const WELCOME: Message[] = [
  {
    id: "0",
    role: "ai",
    text: "Hi! I'm your NexusForge AI assistant. Ask me anything about your project — schemas, deployments, API design, or blockchain config.",
  },
];

export default function AIAssistantOrb() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(WELCOME);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeProject = useProjectStore((s) => s.activeProject);

  // Load history on first open
  const loadHistory = useCallback(async () => {
    if (!activeProject?.id || historyLoaded) return;

    try {
      const history = await DashboardAssistantService.getHistory(activeProject.id);
      if (history.length > 0) {
        const mapped: Message[] = history.map((m, i) => ({
          id: `hist-${i}`,
          role: m.role === "assistant" ? "ai" : "user",
          text: m.content,
        }));
        setMessages([...WELCOME, ...mapped]);
      }
    } catch {
      // Silently fail — keep welcome message
    } finally {
      setHistoryLoaded(true);
    }
  }, [activeProject?.id, historyLoaded]);

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  // Reset history loaded flag when project changes
  useEffect(() => {
    setHistoryLoaded(false);
    setMessages(WELCOME);
  }, [activeProject?.id]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    scrollToBottom();

    // Build history for context
    const history: AssistantMessage[] = messages
      .filter((m) => m.id !== "0") // exclude welcome
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

    try {
      if (!activeProject?.id) {
        throw new Error("No active project");
      }
      const response = await DashboardAssistantService.chat(activeProject.id, {
        message: text,
        history: [...history, { role: "user", content: text }],
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Sorry, I couldn't process your request right now. Please check your project selection and try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.5) 0%, rgba(0,245,255,0.4) 100%)",
          border: "1px solid rgba(168,85,247,0.3)",
          boxShadow: open
            ? "0 0 30px rgba(168,85,247,0.3)"
            : "0 0 20px rgba(168,85,247,0.15)",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
          {open ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <circle cx="12" cy="10" r="1" fill="white" />
              <circle cx="8" cy="10" r="1" fill="white" />
              <circle cx="16" cy="10" r="1" fill="white" />
            </>
          )}
        </svg>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:w-[360px] max-h-[70vh] sm:max-h-[520px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,12,28,0.96)",
              border: "1px solid rgba(168,85,247,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.08)",
            }}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{
                background: "linear-gradient(90deg, rgba(168,85,247,0.12), rgba(0,245,255,0.08))",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(168,85,247,0.25)" }}
              >
                <span className="text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90">NexusForge AI</p>
                <p className="text-[10px] text-emerald-400/60">
                  {sending ? "Thinking…" : activeProject ? `${activeProject.name}` : "Online"}
                </p>
              </div>
              {activeProject && (
                <button
                  onClick={async () => {
                    try {
                      await DashboardAssistantService.clearHistory(activeProject.id);
                      setMessages(WELCOME);
                      setHistoryLoaded(true);
                    } catch { /* ignore */ }
                  }}
                  className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
                  title="Clear history"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
              style={{ maxHeight: 360 }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-white/90"
                        : "text-white/70"
                    }`}
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,245,255,0.15))"
                          : "rgba(255,255,255,0.04)",
                      border:
                        msg.role === "user"
                          ? "1px solid rgba(168,85,247,0.2)"
                          : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="rounded-xl px-4 py-3 flex items-center gap-1.5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div
              className="shrink-0 flex items-center gap-2 px-3 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={activeProject ? "Ask anything..." : "Select a project first…"}
                disabled={sending || !activeProject}
                className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-purple-400/30 transition-colors disabled:opacity-40"
              />
              <motion.button
                onClick={send}
                disabled={sending || !activeProject || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-30"
                style={{
                  background: "rgba(168,85,247,0.25)",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
                whileHover={{ scale: sending ? 1 : 1.05 }}
                whileTap={{ scale: sending ? 1 : 0.95 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
