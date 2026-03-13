"use client";

import NotificationBell from "@/components/Notifications/NotificationBell";

interface TopBarProps {
    userName?: string | null;
    userEmail?: string | null;
    onLogout: () => void;
}

export default function TopBar({ userName, userEmail, onLogout }: TopBarProps) {
    const displayInitial =
        userName?.charAt(0)?.toUpperCase() ||
        userEmail?.charAt(0)?.toUpperCase() ||
        "U";
    const displayName = userName || userEmail || "User";

    return (
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-border/50 bg-background/60 backdrop-blur-2xl backdrop-saturate-150">
            <div />
            <div className="flex items-center gap-4">
                <NotificationBell />
                {/* User avatar */}
                <div className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold font-mono ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                        {displayInitial}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Logout"
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
