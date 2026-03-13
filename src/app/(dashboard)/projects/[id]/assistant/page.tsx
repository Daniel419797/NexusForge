"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardAssistantService, { type AssistantMessage } from "@/services/DashboardAssistantService";
import { useProjectStore } from "@/store/projectStore";

export default function AssistantPage() {
    const { activeProject } = useProjectStore();
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activeProject) return;
        setLoadingHistory(true);
        DashboardAssistantService.getHistory(activeProject.id)
            .then((history) => setMessages(history))
            .catch(() => { })
            .finally(() => setLoadingHistory(false));
    }, [activeProject]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject || !input.trim() || sending) return;

        const userMessage: AssistantMessage = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setSending(true);

        try {
            const response = await DashboardAssistantService.chat(activeProject.id, {
                message: userMessage.content,
                history: messages,
            });
            setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleClearHistory = async () => {
        if (!activeProject || !confirm("Clear all conversation history?")) return;
        try {
            await DashboardAssistantService.clearHistory(activeProject.id);
            setMessages([]);
        } catch {
            // ignore
        }
    };

    const handleGetSummary = async () => {
        if (!activeProject) return;
        setLoadingSummary(true);
        try {
            const data = await DashboardAssistantService.getSummary(activeProject.id);
            setSummary(data.summary);
        } catch {
            setSummary("Failed to generate summary.");
        } finally {
            setLoadingSummary(false);
        }
    };

    if (!activeProject) {
        return <div className="text-muted-foreground text-center py-10">Select a project first.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between animate-in-up">
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight">AI Assistant</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ask questions about your project — the assistant has full context of your data.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleGetSummary} disabled={loadingSummary}>
                        {loadingSummary ? "Generating..." : "Project Summary"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                        Clear History
                    </Button>
                </div>
            </div>

            {/* Summary card */}
            {summary && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">AI-Generated Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{summary}</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setSummary(null)}>
                            Dismiss
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Messages */}
            <Card className="min-h-[400px] max-h-[600px] flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingHistory ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-10 w-1/2 ml-auto" />
                            <Skeleton className="h-10 w-2/3" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <svg aria-hidden="true" className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                            <p className="text-sm">Start a conversation about your project.</p>
                            <p className="text-xs mt-1">Ask about stats, users, configuration, or anything else.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="border-t border-border p-4">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            placeholder="Ask the AI assistant about your project..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={sending}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !input.trim()}>
                            {sending ? "..." : "Send"}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
