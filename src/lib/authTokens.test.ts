import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearStoredAuthTokens,
    getStoredAccessToken,
    getStoredRefreshToken,
    refreshStoredAuthTokens,
    setStoredAuthTokens,
} from "./authTokens";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

describe("auth token storage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("stores, updates, and clears auth tokens", () => {
        setStoredAuthTokens({ accessToken: "access-1", refreshToken: "refresh-1" });

        expect(getStoredAccessToken()).toBe("access-1");
        expect(getStoredRefreshToken()).toBe("refresh-1");

        setStoredAuthTokens({ accessToken: "access-2", refreshToken: null });

        expect(getStoredAccessToken()).toBe("access-2");
        expect(getStoredRefreshToken()).toBeNull();

        clearStoredAuthTokens();

        expect(getStoredAccessToken()).toBeNull();
        expect(getStoredRefreshToken()).toBeNull();
    });

    it("refreshes tokens once for concurrent callers", async () => {
        setStoredAuthTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                data: {
                    accessToken: "new-access",
                    refreshToken: "new-refresh",
                },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const [first, second] = await Promise.all([
            refreshStoredAuthTokens(),
            refreshStoredAuthTokens(),
        ]);

        expect(first).toBe("new-access");
        expect(second).toBe("new-access");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/auth/refresh",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ refreshToken: "old-refresh" }),
            }),
        );
        expect(getStoredAccessToken()).toBe("new-access");
        expect(getStoredRefreshToken()).toBe("new-refresh");
    });

    it("clears stored tokens when refresh is explicitly rejected", async () => {
        setStoredAuthTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid refresh token" }, 401)));

        await expect(refreshStoredAuthTokens()).rejects.toThrow("Invalid refresh token");

        expect(getStoredAccessToken()).toBeNull();
        expect(getStoredRefreshToken()).toBeNull();
    });

    it("keeps stored tokens on transient refresh failures", async () => {
        setStoredAuthTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Service unavailable" }, 503)));

        await expect(refreshStoredAuthTokens()).rejects.toThrow("Service unavailable");

        expect(getStoredAccessToken()).toBe("old-access");
        expect(getStoredRefreshToken()).toBe("old-refresh");
    });
});
