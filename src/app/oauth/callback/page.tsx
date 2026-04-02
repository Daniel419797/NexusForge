"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthService from "@/services/AuthService";
import { useAuthStore } from "@/store/authStore";

// Module-level dedup set — survives React Strict Mode remounts (unlike useRef).
const inFlight = new Set<string>();

function OAuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useAuthStore((s) => s.logout);
    // Secondary guard: prevents re-entry within the same component instance
    // (e.g. if searchParams identity changes without the code changing).
    const exchanged = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            logout();
            router.replace("/login?error=oauth_failed");
            return;
        }

        // Primary dedup: module-level set survives Strict Mode remounts.
        // Secondary dedup: ref guards within the same instance.
        if (inFlight.has(code) || exchanged.current) return;
        exchanged.current = true;
        inFlight.add(code);

        AuthService.exchangeOAuthCode(code)
            .then((result) => {
                // Stale-response guard: bail if the URL code changed while in-flight.
                if (searchParams.get("code") !== code) return;
                localStorage.setItem("accessToken", result.accessToken);
                localStorage.setItem("refreshToken", result.refreshToken);
                setUser(result.user);
                router.replace("/projects");
            })
            .catch(() => {
                if (searchParams.get("code") !== code) return;
                logout();
                router.replace("/login?error=oauth_failed");
            })
            .finally(() => {
                inFlight.delete(code);
            });
    }, [searchParams, router, setUser, logout]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Signing you in…</p>
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
            }
        >
            <OAuthCallbackInner />
        </Suspense>
    );
}
