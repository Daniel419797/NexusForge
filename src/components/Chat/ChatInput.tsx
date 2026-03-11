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
        <div className="p-4 border-t border-border bg-background/50">
            <form onSubmit={onSend} className="flex gap-2">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-card"
                    disabled={disabled}
                />
                <Button type="submit" disabled={disabled || !value.trim()}>
                    Send
                </Button>
            </form>
        </div>
    );
}
