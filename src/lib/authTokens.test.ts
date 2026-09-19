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

describe("cookie-first auth token handling", () => {
    beforeEach(() => {
        clearStoredAuthTokens();
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearStoredAuthTokens();
    });

    it("keeps only the access token in memory", () => {
        setStoredAuthTokens({ accessToken: "access-1", refreshToken: "refresh-1" });

        expect(getStoredAccessToken()).toBe("access-1");
        expect(getStoredRefreshToken()).toBeNull();
        expect(localStorage.getItem("accessToken")).toBeNull();
        expect(localStorage.getItem("refreshToken")).toBeNull();
        expect(sessionStorage.getItem("accessToken")).toBeNull();

        clearStoredAuthTokens();
        expect(getStoredAccessToken()).toBeNull();
    });

    it("refreshes once for concurrent callers using the httpOnly cookie", async () => {
        setStoredAuthTokens({ accessToken: "old-access" });
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
                body: "{}",
            }),
        );
        expect(getStoredAccessToken()).toBe("new-access");
        expect(getStoredRefreshToken()).toBeNull();
    });

    it("clears the in-memory access token when refresh is rejected", async () => {
        setStoredAuthTokens({ accessToken: "old-access" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid refresh token" }, 401)));

        await expect(refreshStoredAuthTokens()).rejects.toThrow("Invalid refresh token");
        expect(getStoredAccessToken()).toBeNull();
    });

    it("keeps the in-memory access token on transient refresh failures", async () => {
        setStoredAuthTokens({ accessToken: "old-access" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Service unavailable" }, 503)));

        await expect(refreshStoredAuthTokens()).rejects.toThrow("Service unavailable");
        expect(getStoredAccessToken()).toBe("old-access");
    });
});
