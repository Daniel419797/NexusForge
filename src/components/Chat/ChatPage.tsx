"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ChannelList from "@/components/Chat/ChannelList";
import MessageBubble from "@/components/Chat/MessageBubble";
import ChatInput from "@/components/Chat/ChatInput";
import ChatService, { type ChatRoom, type ChatMessage } from "@/services/ChatService";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";

export default function ChatPage() {
    const { activeProject } = useProjectStore();
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    useWebSocket({
        url: wsUrl,
        token,
        onMessage: (data: any) => {
            if (data?.type === "CHAT_MESSAGE" && data.payload?.roomId === activeRoomId) {
                setMessages((prev) => [...prev, data.payload]);
            }
        },
    });

    useEffect(() => {
        if (!activeProject) return;
        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const resp = await ChatService.getRooms(activeProject.id);
                const fetchedRooms = (resp as any).items || [];
                setRooms(fetchedRooms);
                if (fetchedRooms.length > 0 && !activeRoomId) setActiveRoomId(fetchedRooms[0].id);
            } catch { /* ignore */ } finally { setLoadingRooms(false); }
        };
        fetchRooms();
    }, [activeProject, activeRoomId]);

    useEffect(() => {
        if (!activeProject || !activeRoomId) return;
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const resp = await ChatService.getMessages(activeRoomId, activeProject.id, { limit: 50 });
                setMessages(((resp as any).items || []).reverse());
            } catch { /* ignore */ } finally { setLoadingMessages(false); }
        };
        fetchMessages();
    }, [activeProject, activeRoomId]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeProject || !activeRoomId) return;
        try {
            const msg = await ChatService.sendMessage(activeRoomId, activeProject.id, { content: newMessage.trim() });
            setMessages((prev) => [...prev, msg]);
            setNewMessage("");
        } catch { /* ignore */ }
    };

    const handleCreateRoom = async () => {
        if (!activeProject) return;
        const name = prompt("Enter room name:");
        if (!name) return;
        try {
            const room = await ChatService.createRoom(activeProject.id, { name, type: "public" });
            setRooms((prev) => [room, ...prev]);
            setActiveRoomId(room.id);
        } catch { /* ignore */ }
    };

    if (!activeProject) {
        return <div className="p-8 text-center text-white/50">Please select a project first.</div>;
    }

    return (
        <ScrollReveal direction="up">
            <div
                className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden"
                style={{
                    background: "linear-gradient(170deg, rgba(14,16,34,0.92) 0%, rgba(8,10,25,0.88) 100%)",
                    border: "1px solid rgba(0,245,255,0.08)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                }}
            >
                {/* Sidebar - Rooms */}
                <ChannelList
                    rooms={rooms}
                    activeRoomId={activeRoomId}
                    loadingRooms={loadingRooms}
                    onSelectRoom={setActiveRoomId}
                    onCreateRoom={handleCreateRoom}
                />

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/[0.06]" style={{ background: "rgba(10,12,28,0.6)" }}>
                        <h2 className="font-semibold text-white">{rooms.find((r) => r.id === activeRoomId)?.name || "Select a channel"}</h2>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                        {loadingMessages ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-3/4 rounded-lg bg-white/[0.04]" />
                                <Skeleton className="h-12 w-1/2 rounded-lg ml-auto bg-white/[0.04]" />
                            </div>
                        ) : (
                            <div className="space-y-4 flex flex-col">
                                {messages.length === 0 && (
                                    <div className="text-center text-white/40 text-sm my-10">
                                        No messages yet. Say hello!
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isMine={msg.senderId === user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSend}
                        disabled={!activeRoomId}
                    />
                </div>
            </div>
        </ScrollReveal>
    );
}
