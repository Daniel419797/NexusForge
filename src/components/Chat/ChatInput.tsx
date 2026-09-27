"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
    value: string;
    onChange: (val: string) => void;
    onSend: (e: React.FormEvent) => void;
    disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
    return (
        <div className="border-t border-border bg-background/50 p-3 sm:p-4">
            <form onSubmit={onSend} className="flex min-w-0 gap-2">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 bg-card"
                    disabled={disabled}
                />
                <Button type="submit" className="shrink-0 px-4" disabled={disabled || !value.trim()}>
                    Send
                </Button>
            </form>
        </div>
    );
}
