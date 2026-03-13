"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <div className="w-64 border-r border-border flex flex-col bg-background/50">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Channels</h3>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onCreateRoom}>
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
                {loadingRooms && <Skeleton className="h-10 w-full rounded-md mb-2" />}
                {!loadingRooms &&
                    rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => onSelectRoom(room.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1 ${activeRoomId === room.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            # {room.name}
                        </button>
                    ))}
            </ScrollArea>
        </div>
    );
}
