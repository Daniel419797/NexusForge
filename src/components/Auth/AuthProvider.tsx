"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AuthService from "@/services/AuthService";
import {
    clearStoredAuthTokens,
    getStoredAccessToken,
    refreshStoredAuthTokens,
} from "@/lib/authTokens";

/**
 * AuthProvider — wraps protected routes.
 *
 * Browser auth is cookie-first. The in-memory access token is only an
 * optimization for API/WebSocket calls and disappears on a full reload, so a
 * missing in-memory token must not be treated as proof that the user is logged
 * out. Restore the cookie session first, then verify the profile.
 */
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, setUser } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let cancelled = false;

        const ensureSession = async () => {
            try {
                if (!getStoredAccessToken()) {
                    await refreshStoredAuthTokens();
                }

                const profile = await AuthService.getProfile();
                if (!cancelled) {
                    setUser(profile);
                }
            } catch {
                if (cancelled) return;
                clearStoredAuthTokens();
                setUser(null);
                router.replace("/login");
            }
        };

        void ensureSession();

        return () => {
            cancelled = true;
        };
    }, [pathname, router, setUser]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <svg aria-hidden="true" className="animate-spin w-8 h-8 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
