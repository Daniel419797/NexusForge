"use client";

import { format } from "date-fns";
import type { ChatMessage } from "@/services/ChatService";

interface MessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
    return (
        <div className={`flex max-w-[88%] flex-col sm:max-w-[80%] lg:max-w-[72%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                    {isMine ? "You" : message.sender?.name || message.sender?.email || "Unknown"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                    {format(new Date(message.createdAt), "HH:mm")}
                </span>
            </div>
            <div
                className={`break-words px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${isMine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                    }`}
            >
                {message.content}
            </div>
        </div>
    );
}
