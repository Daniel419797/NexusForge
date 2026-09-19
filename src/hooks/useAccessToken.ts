"use client";

import { useEffect, useState } from "react";

import { AUTH_TOKENS_CHANGED_EVENT, getStoredAccessToken } from "@/lib/authTokens";

export function useAccessToken(): string | null {
    const [token, setToken] = useState<string | null>(() => getStoredAccessToken());

    useEffect(() => {
        const syncToken = () => setToken(getStoredAccessToken());
        syncToken();
        window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, syncToken);
        return () => window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, syncToken);
    }, []);

    return token;
}
