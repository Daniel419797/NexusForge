"use client";

import { format } from "date-fns";
import type { ChatMessage } from "@/services/ChatService";

interface MessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
    return (
        <div className={`flex flex-col max-w-[75%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                    {isMine ? "You" : message.sender?.name || message.sender?.email || "Unknown"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                    {format(new Date(message.createdAt), "HH:mm")}
                </span>
            </div>
            <div
                className={`px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                    }`}
            >
                {message.content}
            </div>
        </div>
    );
}
