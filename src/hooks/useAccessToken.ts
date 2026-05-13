"use client";

import { useEffect, useState } from "react";

import { AUTH_TOKENS_CHANGED_EVENT, getStoredAccessToken } from "@/lib/authTokens";

export function useAccessToken(): string | null {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const syncToken = () => {
            setAccessToken(getStoredAccessToken());
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === "accessToken" || event.key === "refreshToken" || event.key === null) {
                syncToken();
            }
        };

        syncToken();
        window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, syncToken);
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, syncToken);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    return accessToken;
}
