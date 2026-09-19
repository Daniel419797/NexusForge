"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import AuthService from "@/services/AuthService";
import { clearStoredAuthTokens, refreshStoredAuthTokens } from "@/lib/authTokens";

/**
 * Restores a browser session from httpOnly auth cookies. The access token is
 * refreshed into memory only so WebSocket clients can authenticate without
 * persisting JWTs in localStorage/sessionStorage.
 */
export default function AuthInitializer() {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            try {
                // The refresh cookie is scoped to /api/v1/auth and is never
                // exposed to JavaScript. This also repopulates the in-memory
                // access token used by WebSockets after a page reload.
                await refreshStoredAuthTokens();
                const profile = await AuthService.getProfile();
                if (!cancelled) setUser(profile);
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401 || status === 403 || err instanceof Error) {
                    clearStoredAuthTokens();
                }
                if (!cancelled) {
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        void restoreSession();
        return () => {
            cancelled = true;
        };
    }, [setLoading, setUser]);

    return null;
}
