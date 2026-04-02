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
    const { setUser } = useAuthStore();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setUser(null);
            return;
        }

        AuthService.getProfile()
            .then((profile) => setUser(profile))
            .catch(() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setUser(null);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
