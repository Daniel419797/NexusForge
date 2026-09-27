"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe2, LockKeyhole, UserPlus, Users } from "lucide-react";
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
import ChatService, {
    type ChatRoom,
    type ChatMessage,
    type RoomParticipant,
} from "@/services/ChatService";
import MemberService, { type ProjectMember } from "@/services/MemberService";
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

function participantLabel(member: { name: string | null; email: string }): string {
    return member.name?.trim() || member.email;
}

export default function ChatPage() {
    const router = useRouter();
    const { activeProject } = useProjectStore();
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [chatNotice, setChatNotice] = useState<string | null>(null);
    const [chatError, setChatError] = useState<string | null>(null);

    const [createRoomOpen, setCreateRoomOpen] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [roomType, setRoomType] = useState<ChatRoom["type"]>("public");
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [creatingRoom, setCreatingRoom] = useState(false);

    const [manageParticipantsOpen, setManageParticipantsOpen] = useState(false);
    const [managedMemberIds, setManagedMemberIds] = useState<Set<string>>(new Set());
    const [savingParticipants, setSavingParticipants] = useState(false);
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

    const activeRoom = rooms.find((room) => room.id === activeRoomId);
    const otherProjectMembers = useMemo(
        () => projectMembers.filter((member) => member.id !== user?.id),
        [projectMembers, user?.id],
    );
    const projectRole = activeProject?.membership?.role;
    const canManageActiveRoom = Boolean(
        activeRoom &&
        user?.id &&
        (activeRoom.createdBy === user.id || projectRole === "owner" || projectRole === "admin"),
    );

    const { isConnected, send } = useWebSocket({
        url: wsUrl,
        token: accessToken,
        enabled: Boolean(activeProject?.id && accessToken),
        reconnect: Boolean(activeProject?.id && accessToken),
        onMessage: (value: unknown) => {
            if (!isServerEnvelope(value)) return;

            if (
                value.event === "room:access-revoked" &&
                typeof value.data.roomId === "string"
            ) {
                const revokedRoomId = value.data.roomId;
                setRooms((current) => current.filter((room) => room.id !== revokedRoomId));
                setActiveRoomId((current) => current === revokedRoomId ? null : current);
                if (activeRoomId === revokedRoomId) {
                    setMessages([]);
                    setParticipants([]);
                    setChatError("Your access to this private room was removed.");
                }
                return;
            }

            if (value.event === "project:access-revoked") {
                setRooms([]);
                setMessages([]);
                setParticipants([]);
                setActiveRoomId(null);
                setChatError("Your access to this project was removed.");
                router.replace("/projects");
                return;
            }

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
                            ? { ...message, content: contentValue, editedAt: editedAt ?? message.editedAt }
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
                setMessages((current) => current.filter((message) => message.id !== messageId));
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
                const typing = value.data.isTyping;
                setTypingUsers((current) => {
                    const next = new Set(current);
                    if (typing) next.add(typingUserId);
                    else next.delete(typingUserId);
                    return next;
                });
            }
        },
    });

    useEffect(() => {
        if (!activeProject?.id) {
            setRooms([]);
            setProjectMembers([]);
            setActiveRoomId(null);
            setMessages([]);
            setParticipants([]);
            return;
        }

        let cancelled = false;
        const fetchWorkspace = async () => {
            setLoadingRooms(true);
            setChatError(null);
            try {
                const [fetchedRooms, fetchedMembers] = await Promise.all([
                    ChatService.getRooms(activeProject.id),
                    MemberService.list(activeProject.id),
                ]);
                if (cancelled) return;
                setRooms(fetchedRooms);
                setProjectMembers(fetchedMembers);
                setActiveRoomId((current) => {
                    if (current && fetchedRooms.some((room) => room.id === current)) return current;
                    return fetchedRooms[0]?.id ?? null;
                });
            } catch (error: unknown) {
                if (!cancelled) setChatError(getApiErrorMessage(error, "Could not load project chat."));
            } finally {
                if (!cancelled) setLoadingRooms(false);
            }
        };

        void fetchWorkspace();
        return () => {
            cancelled = true;
        };
    }, [activeProject?.id]);

    useEffect(() => {
        if (!activeProject?.id || !activeRoomId) {
            setMessages([]);
            setParticipants([]);
            return;
        }

        let cancelled = false;
        const fetchRoomData = async () => {
            setLoadingMessages(true);
            setLoadingParticipants(true);
            setChatError(null);
            try {
                const [page, roomParticipants] = await Promise.all([
                    ChatService.getMessages(activeRoomId, activeProject.id, { limit: 50 }),
                    ChatService.getRoomMembers(activeRoomId, activeProject.id),
                ]);
                if (!cancelled) {
                    setMessages([...page.messages].reverse());
                    setParticipants(roomParticipants);
                }
            } catch (error: unknown) {
                if (!cancelled) setChatError(getApiErrorMessage(error, "Could not load this room."));
            } finally {
                if (!cancelled) {
                    setLoadingMessages(false);
                    setLoadingParticipants(false);
                }
            }
        };

        void fetchRoomData();
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
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
                current.some((item) => item.id === message.id) ? current : [...current, message],
            );
            setNewMessage("");
            stopTyping();
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Message could not be sent."));
        }
    };

    const resetCreateRoom = () => {
        setRoomName("");
        setRoomType("public");
        setSelectedMemberIds(new Set());
    };

    const toggleCreateMember = (memberId: string) => {
        setSelectedMemberIds((current) => {
            if (roomType === "direct") return new Set(current.has(memberId) ? [] : [memberId]);
            const next = new Set(current);
            if (next.has(memberId)) next.delete(memberId);
            else next.add(memberId);
            return next;
        });
    };

    const handleCreateRoom = async () => {
        if (!activeProject?.id || !roomName.trim()) return;
        if (roomType === "direct" && selectedMemberIds.size !== 1) {
            setChatError("Choose exactly one project member for a direct room.");
            return;
        }
        if (roomType === "private" && selectedMemberIds.size === 0) {
            setChatError("Choose at least one project member for a private room.");
            return;
        }

        setCreatingRoom(true);
        setChatError(null);
        try {
            const room = await ChatService.createRoom(activeProject.id, {
                name: roomName.trim(),
                type: roomType,
                memberIds: Array.from(selectedMemberIds),
            });
            setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)]);
            setActiveRoomId(room.id);
            setCreateRoomOpen(false);
            resetCreateRoom();
            setChatNotice("Created #" + room.name + ".");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Room could not be created."));
        } finally {
            setCreatingRoom(false);
        }
    };

    const openParticipantManager = () => {
        setManagedMemberIds(new Set(participants.map((participant) => participant.id)));
        setManageParticipantsOpen(true);
    };

    const saveParticipants = async () => {
        if (!activeProject?.id || !activeRoomId || !activeRoom || activeRoom.type !== "private") return;

        const creatorId = activeRoom.createdBy;
        const currentIds = new Set(participants.map((participant) => participant.id));
        const additions = Array.from(managedMemberIds).filter((id) => !currentIds.has(id));
        const removals = Array.from(currentIds).filter(
            (id) => id !== creatorId && !managedMemberIds.has(id),
        );

        setSavingParticipants(true);
        setChatError(null);
        try {
            if (additions.length > 0) {
                await ChatService.addRoomMembers(activeRoomId, activeProject.id, additions);
            }
            for (const userId of removals) {
                await ChatService.removeRoomMember(activeRoomId, activeProject.id, userId);
            }
            const refreshed = await ChatService.getRoomMembers(activeRoomId, activeProject.id);
            setParticipants(refreshed);
            setManageParticipantsOpen(false);
            setChatNotice("Room participants updated.");
        } catch (error: unknown) {
            setChatError(getApiErrorMessage(error, "Could not update room participants."));
        } finally {
            setSavingParticipants(false);
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
            setParticipants([]);
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
                current.map((message) => message.id === messageId ? { ...message, ...updated } : message),
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

    const participantSummary = loadingParticipants
        ? "Loading participants…"
        : participants.length === 0
            ? "No participants"
            : participants.length <= 3
                ? participants.map(participantLabel).join(", ")
                : participants.slice(0, 2).map(participantLabel).join(", ") + " +" + String(participants.length - 2);

    return (
        <>
            <ScrollReveal direction="up">
                <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/70">
                                Realtime communication
                            </p>
                            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Project Chat</h1>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">
                                Project-scoped rooms with persisted history, participant controls and live WebSocket updates.
                            </p>
                        </div>
                        <div
                            className={
                                "inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs " +
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

                    {projectMembers.length === 1 && (
                        <div className="flex flex-col gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-100/80 sm:flex-row sm:items-center sm:justify-between">
                            <span>You are currently the only project member. Add another member to chat with someone else.</span>
                            <Link
                                href={"/projects/" + activeProject.id + "/settings/members"}
                                className="shrink-0 text-xs font-semibold text-amber-200 underline underline-offset-4"
                            >
                                Manage members
                            </Link>
                        </div>
                    )}

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
                        className="flex h-[68dvh] min-h-[520px] w-full min-w-0 flex-col overflow-hidden rounded-2xl md:h-[calc(100vh-14rem)] md:min-h-[560px] md:flex-row"
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

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                            <div className="border-b border-white/[0.06] px-3 py-3 sm:p-4" style={{ background: "rgba(10,12,28,0.6)" }}>
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            {activeRoom?.type === "public" && <Globe2 className="size-4 shrink-0 text-cyan-300/70" />}
                                            {activeRoom?.type === "private" && <LockKeyhole className="size-4 shrink-0 text-amber-300/70" />}
                                            {activeRoom?.type === "direct" && <Users className="size-4 shrink-0 text-violet-300/70" />}
                                            <h2 className="truncate font-semibold text-white">
                                                {activeRoom ? "# " + activeRoom.name : "Select a channel"}
                                            </h2>
                                        </div>
                                        {activeRoom && (
                                            <p className="mt-1 truncate text-[11px] text-white/35">
                                                <span className="capitalize">{activeRoom.type}</span>
                                                <span className="mx-1.5">•</span>
                                                {participantSummary}
                                            </p>
                                        )}
                                    </div>
                                    {activeRoom && (
                                        <div className="flex shrink-0 items-center gap-2">
                                            {activeRoom.type === "private" && canManageActiveRoom && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1.5 px-2 text-[11px] sm:px-3"
                                                    onClick={openParticipantManager}
                                                >
                                                    <UserPlus className="size-3.5" />
                                                    <span className="hidden sm:inline">Participants</span>
                                                </Button>
                                            )}
                                            {canManageActiveRoom && (
                                                <ElectricRippleButton
                                                    accent="amber"
                                                    className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/20 sm:px-3 sm:text-xs"
                                                    onClick={handleDeleteRoom}
                                                >
                                                    Delete
                                                </ElectricRippleButton>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:p-4" ref={scrollRef}>
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
                                                <MessageBubble message={message} isMine={message.senderId === user?.id} />
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
                                <div className="px-3 pb-1 text-[11px] text-cyan-200/60 sm:px-4">
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
                        if (!open) resetCreateRoom();
                    }
                }}
            >
                <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create chat room</DialogTitle>
                        <DialogDescription>
                            Choose who can see and participate in this room.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="chat-room-name">Room name</Label>
                            <Input
                                id="chat-room-name"
                                value={roomName}
                                onChange={(event) => setRoomName(event.target.value)}
                                placeholder="e-commerce-support"
                                maxLength={255}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chat-room-type">Room access</Label>
                            <select
                                id="chat-room-type"
                                value={roomType}
                                onChange={(event) => {
                                    setRoomType(event.target.value as ChatRoom["type"]);
                                    setSelectedMemberIds(new Set());
                                }}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="public">Public — every project member</option>
                                <option value="private">Private — selected project members</option>
                                <option value="direct">Direct — you and one project member</option>
                            </select>
                        </div>

                        {roomType !== "public" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>{roomType === "direct" ? "Choose one member" : "Choose participants"}</Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {selectedMemberIds.size} selected
                                    </span>
                                </div>

                                {otherProjectMembers.length === 0 ? (
                                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm text-amber-100/75">
                                        No other project members are available.
                                        <Link
                                            href={"/projects/" + activeProject.id + "/settings/members"}
                                            className="ml-1 font-semibold underline underline-offset-4"
                                            onClick={() => setCreateRoomOpen(false)}
                                        >
                                            Add a member
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                                        {otherProjectMembers.map((member) => {
                                            const checked = selectedMemberIds.has(member.id);
                                            return (
                                                <label
                                                    key={member.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-white/[0.04]"
                                                >
                                                    <input
                                                        type={roomType === "direct" ? "radio" : "checkbox"}
                                                        name={roomType === "direct" ? "direct-member" : undefined}
                                                        checked={checked}
                                                        onChange={() => toggleCreateMember(member.id)}
                                                        className="size-4 accent-cyan-300"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {participantLabel(member)}
                                                        </p>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {member.email} · {member.role}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateRoomOpen(false)} disabled={creatingRoom}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleCreateRoom()}
                            disabled={
                                creatingRoom ||
                                !roomName.trim() ||
                                (roomType === "direct" && selectedMemberIds.size !== 1) ||
                                (roomType === "private" && selectedMemberIds.size === 0)
                            }
                        >
                            {creatingRoom ? "Creating…" : "Create room"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={manageParticipantsOpen}
                onOpenChange={(open) => {
                    if (!savingParticipants) setManageParticipantsOpen(open);
                }}
            >
                <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage room participants</DialogTitle>
                        <DialogDescription>
                            Only selected project members can access this private room.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                        {projectMembers.map((member) => {
                            const isCreator = member.id === activeRoom?.createdBy;
                            const checked = managedMemberIds.has(member.id) || isCreator;
                            return (
                                <label
                                    key={member.id}
                                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/[0.04]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={isCreator}
                                        onChange={() => {
                                            setManagedMemberIds((current) => {
                                                const next = new Set(current);
                                                if (next.has(member.id)) next.delete(member.id);
                                                else next.add(member.id);
                                                return next;
                                            });
                                        }}
                                        className="size-4 accent-cyan-300"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {participantLabel(member)}
                                            {isCreator ? " · creator" : ""}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {member.email} · {member.role}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setManageParticipantsOpen(false)}
                            disabled={savingParticipants}
                        >
                            Cancel
                        </Button>
                        <Button onClick={() => void saveParticipants()} disabled={savingParticipants}>
                            {savingParticipants ? "Saving…" : "Save participants"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
