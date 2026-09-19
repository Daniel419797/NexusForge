"use client";

export const AUTH_TOKENS_CHANGED_EVENT = "auth:tokens-changed";

type AuthTokenChangeDetail = {
    accessToken: string | null;
};

type AuthTokenPayload = {
    accessToken: string;
    refreshToken?: string | null;
};

// Browser auth is cookie-first. Keep the short-lived access token only in memory
// for WebSocket subprotocol authentication; never persist JWTs in web storage.
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

function emitAuthTokensChanged(nextAccessToken: string | null): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent<AuthTokenChangeDetail>(AUTH_TOKENS_CHANGED_EVENT, {
            detail: { accessToken: nextAccessToken },
        }),
    );
}

export function getStoredAccessToken(): string | null {
    return accessToken;
}

/**
 * Kept for compatibility with existing callers/tests. Refresh tokens are
 * intentionally httpOnly-cookie-only and are never exposed to JavaScript.
 */
export function getStoredRefreshToken(): string | null {
    return null;
}

export function setStoredAuthTokens(tokens: AuthTokenPayload): void {
    accessToken = tokens.accessToken;
    emitAuthTokensChanged(accessToken);
}

export function clearStoredAuthTokens(): void {
    accessToken = null;
    emitAuthTokensChanged(null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function extractAuthTokens(payload: unknown): AuthTokenPayload | null {
    const envelope = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
    if (!isRecord(envelope) || typeof envelope.accessToken !== "string" || envelope.accessToken.length === 0) {
        return null;
    }

    return {
        accessToken: envelope.accessToken,
    };
}

async function parseRefreshError(response: Response): Promise<Error> {
    try {
        const payload = await response.json();
        const message =
            (isRecord(payload) && typeof payload.message === "string" && payload.message) ||
            (isRecord(payload) && typeof payload.error === "string" && payload.error) ||
            `Token refresh failed (${response.status})`;
        return new Error(message);
    } catch {
        return new Error(`Token refresh failed (${response.status})`);
    }
}

export async function refreshStoredAuthTokens(): Promise<string> {
    if (typeof window === "undefined") {
        throw new Error("Token refresh is only available in the browser");
    }

    refreshPromise ??= (async () => {
        const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: "{}",
        });

        if (!response.ok) {
            const error = await parseRefreshError(response);
            if (response.status === 400 || response.status === 401 || response.status === 403) {
                clearStoredAuthTokens();
            }
            throw error;
        }

        const payload = await response.json();
        const tokens = extractAuthTokens(payload);
        if (!tokens) {
            throw new Error("Token refresh response did not include an access token");
        }

        setStoredAuthTokens(tokens);
        return tokens.accessToken;
    })().finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}
