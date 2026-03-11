"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
    role: string;
    content: string;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}

export default function ChatPanel({
    messages,
    input,
    onInputChange,
    onSubmit,
    loading,
}: ChatPanelProps) {
    return (
        <Card className="flex flex-col h-[500px]">
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Start a conversation with the AI...
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex flex-col max-w-[80%] ${
                                    msg.role === "user"
                                        ? "self-end items-end ml-auto"
                                        : "self-start items-start"
                                }`}
                            >
                                <span className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                                    {msg.role}
                                </span>
                                <div
                                    className={`px-4 py-2 rounded-2xl text-sm ${
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="self-start">
                            <div className="px-4 py-2 rounded-2xl bg-muted text-sm rounded-tl-sm flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" />
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce delay-200" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-border">
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Type a message..."
                            disabled={loading}
                        />
                        <Button type="submit" disabled={!input.trim() || loading}>
                            Send
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
