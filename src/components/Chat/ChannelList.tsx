"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatRoom } from "@/services/ChatService";

interface ChannelListProps {
    rooms: ChatRoom[];
    activeRoomId: string | null;
    loadingRooms: boolean;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom: () => void;
}

export default function ChannelList({
    rooms,
    activeRoomId,
    loadingRooms,
    onSelectRoom,
    onCreateRoom,
}: ChannelListProps) {
    return (
        <aside className="flex w-full shrink-0 flex-col border-b border-border bg-background/50 md:w-64 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between border-b border-border px-3 py-3 md:p-4">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Channels</h3>
                    <p className="mt-0.5 text-[10px] text-muted-foreground md:hidden">
                        Swipe to switch rooms
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={onCreateRoom}
                    aria-label="Create chat room"
                >
                    <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Button>
            </div>

            <div className="overflow-x-auto px-3 py-2 md:flex-1 md:overflow-x-hidden md:overflow-y-auto md:p-2">
                {loadingRooms ? (
                    <div className="flex gap-2 md:block">
                        <Skeleton className="h-9 w-36 shrink-0 rounded-md md:mb-2 md:w-full" />
                        <Skeleton className="h-9 w-32 shrink-0 rounded-md md:w-full" />
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="px-1 py-3 text-center md:px-3 md:py-8">
                        <p className="text-xs font-medium text-muted-foreground">No channels yet</p>
                        <button
                            type="button"
                            onClick={onCreateRoom}
                            className="mt-2 text-[11px] text-cyan-300/70 hover:text-cyan-200"
                        >
                            Create the first room
                        </button>
                    </div>
                ) : (
                    <div className="flex min-w-max gap-2 md:min-w-0 md:flex-col md:gap-1">
                        {rooms.map((room) => (
                            <button
                                key={room.id}
                                type="button"
                                onClick={() => onSelectRoom(room.id)}
                                className={
                                    "shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors md:w-full " +
                                    (activeRoomId === room.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground")
                                }
                            >
                                # {room.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
