"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import AuthService from "@/services/AuthService";

/**
 * AuthInitializer — mounted once in the root layout.
 * Restores auth state on every page (including public routes) by
 * checking localStorage for an access token and fetching the profile.
 * Renders nothing — it is purely a side-effect component.
 */
export default function AuthInitializer() {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setUser(null);
            return;
        }

        // Capture the token value before the async call so we can detect
        // whether it has been replaced (e.g. by a concurrent login) by the
        // time the response arrives. Stale completions are silently ignored
        // to avoid overwriting newer auth state.
        const currentToken = token;

        AuthService.getProfile()
            .then((profile) => {
                if (localStorage.getItem("accessToken") !== currentToken) return;
                setUser(profile);
            })
            .catch((err) => {
                if (localStorage.getItem("accessToken") !== currentToken) return;

                const status = err?.response?.status;
                // Only invalidate the session for explicit auth rejections.
                // 401 is typically already handled by the Axios interceptor
                // (token refresh / redirect), but guard it here too.
                // All other failures (network, 5xx, offline) keep the
                // stored tokens intact so the user isn't logged out
                // due to a transient infrastructure error.
                if (status === 401 || status === 403) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    setUser(null);
                } else {
                    setLoading(false);
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
