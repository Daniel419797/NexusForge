"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ChannelList from "@/components/Chat/ChannelList";
import MessageBubble from "@/components/Chat/MessageBubble";
import ChatInput from "@/components/Chat/ChatInput";
import ChatService, { type ChatRoom, type ChatMessage } from "@/services/ChatService";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useWebSocket } from "@/hooks/useWebSocket";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";

interface ServerEnvelope {
    event: string;
    data: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isServerEnvelope(value: unknown): value is ServerEnvelope {
    return isRecord(value) && typeof value.event === "string" && isRecord(value.data);
}

function isChatMessagePayload(value: unknown): value is ChatMessage {
    if (!isRecord(value)) return false;
    return (
        typeof value.id === "string" &&
        typeof value.roomId === "string" &&
        typeof value.senderId === "string" &&
        typeof value.content === "string" &&
        typeof value.type === "string" &&
        typeof value.createdAt === "string"
    );
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: { message?: unknown } } }).response;
        if (typeof response?.data?.message === "string") return response.data.message;
    }
    return error instanceof Error && error.message ? error.message : fallback;
}

export default function ChatPage() {
    const { activeProject } = useProjectStore();
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [chatNotice, setChatNotice] = useState<string | null>(null);
    const [chatError, setChatError] = useState<string | null>(null);
    const [createRoomOpen, setCreateRoomOpen] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    const scrollRef = useRef<HTMLDivElement>(null);
    const joinedRoomRef = useRef<string | null>(null);
    const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingActiveRef = useRef(false);
    const accessToken = useAccessToken();

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";
    const wsUrl = activeProject?.id
        ? wsBaseUrl + (wsBaseUrl.includes("?") ? "&" : "?") + "projectId=" + encodeURIComponent(activeProject.id)
        : wsBaseUrl;

    const { isConnected, send } = useWebSocket({
        url: wsUrl,
        token: accessToken,
        enabled: Boolean(activeProject?.id && accessToken),
        reconnect: Boolean(activeProject?.id && accessToken),
        onMessage: (value: unknown) => {
            if (!isServerEnvelope(value)) return;

            if (value.event === "message:new" && isChatMessagePayload(value.data)) {
                const incoming = value.data;
                if (incoming.roomId !== activeRoomId) return;
                setMessages((current) =>
                    current.some((message) => message.id === incoming.id)
                        ? current
                        : [...current, incoming],
                );
                return;
            }

            if (
                value.event === "message:updated" &&
                typeof value.data.messageId === "string" &&
                typeof value.data.roomId === "string" &&
                typeof value.data.content === "string" &&
                value.data.roomId === activeRoomId
            ) {
                const messageId = value.data.messageId;
                const contentValue = value.data.content;
                const editedAt = typeof value.data.editedAt === "string" ? value.data.editedAt : undefined;
                setMessages((current) =>
                    current.map((message) =>
                        message.id === messageId
                            ? {
                                ...message,
                                content: contentValue,
                                editedAt: editedAt ?? message.editedAt,
                            }
                            : message,
                    ),
                );
                return;
            }

            if (
                value.event === "message:deleted" &&
                typeof value.data.messageId === "string" &&
                typeof value.data.roomId === "string" &&
                value.data.roomId === activeRoomId
            ) {
                const messageId = value.data.messageId;
                setMessages((current) =>
                    current.filter((message) => message.id !== messageId),
                );
                return;
            }

            if (
                value.event === "typing" &&
                typeof value.data.userId === "string" &&
                typeof value.data.isTyping === "boolean" &&
                value.data.roomId === activeRoomId &&
                value.data.userId !== user?.id
            ) {
                const typingUserId = value.data.userId;
                const isTyping = value.data.isTyping;
                setTypingUsers((current) => {
                    const next = new Set(current);
                    if (isTyping) next.add(typingUserId);
                    else next.delete(typingUserId);
                    return next;
                });
            }
        },
    });

    useEffect(() => {
        if (!activeProject?.id) {
            setRooms([]);
            setActiveRoomId(null);
            setMessages([]);
            return;
        }

        let cancelled = false;
        const fetchRooms = async () => {
            setLoadingRooms(true);
            setChatError(null);
            try {
                const fetchedRooms = await ChatService.getRooms(activeProject.id);
                if (cancelled) return;
                setRooms(fetchedRooms);
                setActiveRoomId((current) => {
                    if (current && fetchedRooms.some((room) => room.id === current)) {
                        return current;
                    }
                    return fetchedRooms[0]?.id ?? null;
                });
            } catch (error: unknown) {
                if (!cancelled) {
                    setChatError(getApiErrorMessage(error, "Could not load chat rooms."));
                }
            } finally {
                if (!cancelled) setLoadingRooms(false);
            }
        };

        void fetchRooms();
        return () => {
            cancelled = true;
        };
    }, [activeProject?.id]);

    useEffect(() => {
        if (!activeProject?.id || !activeRoomId) {
            setMessages([]);
            return;
        }

        let cancelled = false;
        const fetchMessages = async () => {
            setLoadingMessages(true);
            setChatError(null);
            try {
                const page = await ChatService.getMessages(activeRoomId, activeProject.id, { limit: 50 });
                if (!cancelled) setMessages([...page.messages].reverse());
            } catch (error: unknown) {
                if (!cancelled) {
                    setChatError(getApiErrorMessage(error, "Could not load messages for this room."));
                }
            } finally {
                if (!cancelled) setLoadingMessages(false);
            }
        };

        void fetchMessages();
        return () => {
            cancelled = true;
        };
    }, [activeProject?.id, activeRoomId]);

    useEffect(() => {
        if (!isConnected) {
            joinedRoomRef.current = null;
            return;
        }

        const previousRoom = joinedRoomRef.current;
        if (previousRoom && previousRoom !== activeRoomId) {
            send({ event: "room:leave", data: { roomId: previousRoom } });
        }
        if (activeRoomId && previousRoom !== activeRoomId) {
            send({ event: "room:join", data: { roomId: activeRoomId } });
            joinedRoomRef.current = activeRoomId;
        }
        if (!activeRoomId) joinedRoomRef.current = null;
    }, [activeRoomId, isConnected, send]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setTypingUsers(new Set());
        typingActiveRef.current = false;
        if (typingStopTimerRef.current) {
            clearTimeout(typingStopTimerRef.current);
            typingStopTimerRef.current = null;
        }
    }, [activeRoomId]);

    useEffect(() => {
        return () => {
            if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        };
    }, []);

    const stopTyping = () => {
        if (!activeRoomId || !isConnected || !typingActiveRef.current) return;
        send({ event: "typing:stop", data: { roomId: activeRoomId } });
        typingActiveRef.current = false;
    };

    const handleMessageChange = (value: string) => {
        setNewMessage(value);

        if (!activeRoomId || !isConnected) return;
        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);

        if (!value.trim()) {
            stopTyping();
            return;
        }

        if (!typingActiveRef.current) {
            send({ event: "typing:start", data: { roomId: activeRoomId } });
            typingActiveRef.current = true;
        }

        typingStopTimerRef.current = setTimeout(() => {
            stopTyping();
            typingStopTimerRef.current = null;
        }, 1200);
    };

    const handleSend = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newMessage.trim() || !activeProject?.id || !activeRoomId) return;

        const messageContent = newMessage.trim();
        setChatError(null);
        setChatNotice(null);

        try {
            const message = await ChatService.sendMessage(activeRoomId, activeProject.id, { content: messageContent });
            setMessages((current) =>
                current.some((item) => item.id === message.id)
                    ? current
                    : [...current, message],
            );
            setNewMessage("");
            stopTyping();
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Message could not be sent."));
        }
    };

    const handleCreateRoom = async () => {
        if (!activeProject?.id || !roomName.trim()) return;

        setCreatingRoom(true);
        setChatError(null);
        try {
            const room = await ChatService.createRoom(activeProject.id, {
                name: roomName.trim(),
                type: "public",
            });
            setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)]);
            setActiveRoomId(room.id);
            setRoomName("");
            setCreateRoomOpen(false);
            setChatNotice("Created #" + room.name + ".");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Room could not be created."));
        } finally {
            setCreatingRoom(false);
        }
    };

    const handleDeleteRoom = async () => {
        if (!activeProject?.id || !activeRoomId) return;
        if (!confirm("Delete this room and all messages?")) return;

        setChatError(null);
        try {
            await ChatService.deleteRoom(activeRoomId, activeProject.id);
            const remaining = rooms.filter((room) => room.id !== activeRoomId);
            setRooms(remaining);
            setMessages([]);
            setActiveRoomId(remaining[0]?.id ?? null);
            setChatNotice("Room deleted.");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Room could not be deleted."));
        }
    };

    const handleEditMessage = async (messageId: string, currentContent: string) => {
        if (!activeProject?.id || !activeRoomId) return;
        const nextContent = prompt("Edit message", currentContent);
        if (!nextContent || nextContent.trim() === currentContent) return;

        setChatError(null);
        try {
            const updated = await ChatService.editMessage(
                activeRoomId,
                messageId,
                activeProject.id,
                { content: nextContent.trim() },
            );
            setMessages((current) =>
                current.map((message) =>
                    message.id === messageId ? { ...message, ...updated } : message,
                ),
            );
            setChatNotice("Message updated.");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Message could not be updated."));
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!activeProject?.id || !activeRoomId) return;

        setChatError(null);
        try {
            await ChatService.deleteMessage(activeRoomId, messageId, activeProject.id);
            setMessages((current) => current.filter((message) => message.id !== messageId));
            setChatNotice("Message deleted.");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Message could not be deleted."));
        }
    };

    if (!activeProject) {
        return <div className="p-8 text-center text-white/50">Please select a project first.</div>;
    }

    const activeRoom = rooms.find((room) => room.id === activeRoomId);

    return (
        <>
            <ScrollReveal direction="up">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/70">
                                Realtime communication
                            </p>
                            <h1 className="mt-1 text-2xl font-bold text-white">Project Chat</h1>
                            <p className="mt-1 text-sm text-white/40">
                                Project-scoped rooms with persisted history and live WebSocket updates.
                            </p>
                        </div>
                        <div
                            className={
                                "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs " +
                                (isConnected
                                    ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                                    : "border-amber-400/20 bg-amber-400/[0.06] text-amber-300")
                            }
                        >
                            <span
                                className={
                                    "size-1.5 rounded-full " +
                                    (isConnected ? "bg-emerald-300" : "bg-amber-300")
                                }
                            />
                            {isConnected ? "Realtime connected" : "Connecting realtime…"}
                        </div>
                    </div>

                    {chatError && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
                            {chatError}
                        </div>
                    )}
                    {chatNotice && !chatError && (
                        <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-2.5 text-xs text-cyan-100/70">
                            {chatNotice}
                        </div>
                    )}

                    <div
                        className="flex h-[calc(100vh-14rem)] min-h-[560px] overflow-hidden rounded-2xl"
                        style={{
                            background: "linear-gradient(170deg, rgba(14,16,34,0.92) 0%, rgba(8,10,25,0.88) 100%)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                        }}
                    >
                        <ChannelList
                            rooms={rooms}
                            activeRoomId={activeRoomId}
                            loadingRooms={loadingRooms}
                            onSelectRoom={(roomId) => {
                                setChatError(null);
                                setChatNotice(null);
                                setActiveRoomId(roomId);
                            }}
                            onCreateRoom={() => setCreateRoomOpen(true)}
                        />

                        <div className="flex min-w-0 flex-1 flex-col">
                            <div className="border-b border-white/[0.06] p-4" style={{ background: "rgba(10,12,28,0.6)" }}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <h2 className="truncate font-semibold text-white">
                                            {activeRoom ? "# " + activeRoom.name : "Select a channel"}
                                        </h2>
                                        {activeRoom && (
                                            <p className="mt-1 text-[11px] capitalize text-white/30">
                                                {activeRoom.type} room
                                            </p>
                                        )}
                                    </div>
                                    {activeRoom && (
                                        <ElectricRippleButton
                                            accent="amber"
                                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                                            onClick={handleDeleteRoom}
                                        >
                                            Delete Room
                                        </ElectricRippleButton>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                                {loadingMessages ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-3/4 rounded-lg bg-white/[0.04]" />
                                        <Skeleton className="ml-auto h-12 w-1/2 rounded-lg bg-white/[0.04]" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-4">
                                        {!activeRoomId && (
                                            <div className="my-10 text-center text-sm text-white/40">
                                                Select or create a channel to start chatting.
                                            </div>
                                        )}
                                        {activeRoomId && messages.length === 0 && (
                                            <div className="my-10 text-center text-sm text-white/40">
                                                No messages yet. Send the first message in this room.
                                            </div>
                                        )}
                                        {messages.map((message) => (
                                            <div key={message.id} className="space-y-1">
                                                <MessageBubble
                                                    message={message}
                                                    isMine={message.senderId === user?.id}
                                                />
                                                {message.senderId === user?.id && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            className="text-[10px] text-white/40 hover:text-white/70"
                                                            onClick={() => void handleEditMessage(message.id, message.content)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="text-[10px] text-red-300/70 hover:text-red-200"
                                                            onClick={() => void handleDeleteMessage(message.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {typingUsers.size > 0 && activeRoomId && (
                                <div className="px-4 pb-1 text-[11px] text-cyan-200/60">
                                    {typingUsers.size === 1
                                        ? "Someone is typing…"
                                        : String(typingUsers.size) + " people are typing…"}
                                </div>
                            )}

                            <ChatInput
                                value={newMessage}
                                onChange={handleMessageChange}
                                onSend={handleSend}
                                disabled={!activeRoomId}
                            />
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            <Dialog
                open={createRoomOpen}
                onOpenChange={(open) => {
                    if (!creatingRoom) {
                        setCreateRoomOpen(open);
                        if (!open) setRoomName("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create chat room</DialogTitle>
                        <DialogDescription>
                            Create a project-scoped public channel for realtime messaging.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="chat-room-name">Room name</Label>
                        <Input
                            id="chat-room-name"
                            value={roomName}
                            onChange={(event) => setRoomName(event.target.value)}
                            placeholder="e-commerce-support"
                            maxLength={255}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") void handleCreateRoom();
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateRoomOpen(false)}
                            disabled={creatingRoom}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleCreateRoom()}
                            disabled={creatingRoom || !roomName.trim()}
                        >
                            {creatingRoom ? "Creating…" : "Create room"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
