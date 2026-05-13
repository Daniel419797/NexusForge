import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setStoredAuthTokens } from "@/lib/authTokens";
import { useWebSocket } from "./useWebSocket";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function base64Url(value: string): string {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function jwtWithExp(expSeconds: number): string {
    return [
        base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
        base64Url(JSON.stringify({ exp: expSeconds })),
        "signature",
    ].join(".");
}

describe("useWebSocket", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the access token as a WebSocket subprotocol", () => {
        const WebSocketMock = vi.fn(function WebSocket(this: { close: () => void; send: () => void; readyState: number }) {
            this.readyState = 0;
            this.close = vi.fn();
            this.send = vi.fn();
        });
        vi.stubGlobal("WebSocket", WebSocketMock);

        const token = jwtWithExp(Math.floor(Date.now() / 1000) + 300);

        renderHook(() => useWebSocket({
            url: "wss://example.test/ws?projectId=p1",
            token,
        }));

        expect(WebSocketMock).toHaveBeenCalledWith(
            "wss://example.test/ws?projectId=p1",
            ["access_token", token],
        );
    });

    it("refreshes instead of opening a socket with an expired token", async () => {
        const WebSocketMock = vi.fn();
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                data: {
                    accessToken: jwtWithExp(Math.floor(Date.now() / 1000) + 300),
                    refreshToken: "new-refresh",
                },
            }),
        );

        vi.stubGlobal("WebSocket", WebSocketMock);
        vi.stubGlobal("fetch", fetchMock);
        setStoredAuthTokens({ accessToken: "old-access", refreshToken: "old-refresh" });

        renderHook(() => useWebSocket({
            url: "wss://example.test/ws?projectId=p1",
            token: jwtWithExp(Math.floor(Date.now() / 1000) - 60),
        }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        expect(WebSocketMock).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/auth/refresh",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ refreshToken: "old-refresh" }),
            }),
        );
    });
});
