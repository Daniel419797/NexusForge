"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationService, { type Notification } from "@/services/NotificationService";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);

    // Initialize WS connection for live notifications
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    useWebSocket({
        url: wsUrl,
        token,
        onMessage: (data: any) => {
            // If we receive a live notification event:
            if (data?.type === "NOTIFICATION_NEW") {
                setUnreadCount((c) => c + 1);
                if (open) {
                    // If popover is open, fetch latest
                    fetchRecent();
                }
            }
        },
    });

    const fetchUnreadCount = async () => {
        try {
            const count = await NotificationService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // ignore
        }
    };

    const fetchRecent = async () => {
        try {
            const resp = await NotificationService.getNotifications({ limit: 5 });
            setNotifications((resp as any).items || []);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        if (open) {
            fetchRecent();
        }
    }, [open]);

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            setUnreadCount(0);
            fetchRecent();
        } catch {
            // ignore
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            try {
                await NotificationService.markAsRead(notif.id);
                setUnreadCount((c) => Math.max(0, c - 1));
                fetchRecent();
            } catch {
                // ignore
            }
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                            <span className="text-2xl mb-2">📭</span>
                            You have no notifications.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href="/notifications"
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`flex flex-col gap-1 p-4 border-b border-border hover:bg-muted/50 transition-colors ${!notif.read ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <div className="flex justify-between gap-2">
                                        <span className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                                            {notif.title}
                                        </span>
                                        {!notif.read && <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-primary" />}
                                    </div>
                                    {notif.body && <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>}
                                    <span className="text-[10px] text-muted-foreground/80 mt-1">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t border-border">
                    <Button variant="ghost" className="w-full text-xs" asChild onClick={() => setOpen(false)}>
                        <Link href="/notifications">View all notifications</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
