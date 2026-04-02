"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthService from "@/services/AuthService";
import { useAuthStore } from "@/store/authStore";

function OAuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);
    const exchanged = useRef(false);

    useEffect(() => {
        if (exchanged.current) return;
        exchanged.current = true;

        const code = searchParams.get("code");

        if (!code) {
            router.replace("/login?error=oauth_failed");
            return;
        }

        AuthService.exchangeOAuthCode(code)
            .then((result) => {
                localStorage.setItem("accessToken", result.accessToken);
                localStorage.setItem("refreshToken", result.refreshToken);
                setUser(result.user);
                router.replace("/projects");
            })
            .catch(() => {
                setLoading(false);
                router.replace("/login?error=oauth_failed");
            });
    }, [searchParams, router, setUser, setLoading]);

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
