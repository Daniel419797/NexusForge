"use client";

export const AUTH_TOKENS_CHANGED_EVENT = "auth:tokens-changed";

type AuthTokenChangeDetail = {
    accessToken: string | null;
};

type AuthTokenPayload = {
    accessToken: string;
    refreshToken?: string | null;
};

let refreshPromise: Promise<string> | null = null;

function emitAuthTokensChanged(accessToken: string | null): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent<AuthTokenChangeDetail>(AUTH_TOKENS_CHANGED_EVENT, {
            detail: { accessToken },
        }),
    );
}

export function getStoredAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

export function getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

export function setStoredAuthTokens(tokens: AuthTokenPayload): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", tokens.accessToken);
    if (tokens.refreshToken === null) {
        localStorage.removeItem("refreshToken");
    } else if (tokens.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
    }
    emitAuthTokensChanged(tokens.accessToken);
}

export function clearStoredAuthTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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
        refreshToken: typeof envelope.refreshToken === "string" ? envelope.refreshToken : undefined,
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
        const refreshToken = getStoredRefreshToken();
        const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: refreshToken ? JSON.stringify({ refreshToken }) : "{}",
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
