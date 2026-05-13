"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { refreshStoredAuthTokens } from "@/lib/authTokens";

const NON_RETRYABLE_CLOSE_CODES = new Set([4401, 4403, 4429]);
const DEFAULT_AUTH_EXPIRY_SKEW_MS = 30_000;

interface UseWebSocketOptions {
    url: string;
    token?: string | null;
    onMessage?: (data: unknown) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event) => void;
    onAuthExpired?: () => void;
    reconnect?: boolean;
    reconnectInterval?: number;
    authExpirySkewMs?: number;
    refreshOnAuthExpired?: boolean;
    enabled?: boolean;
}

function decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return atob(padded);
}

function getJwtExpirationMs(token: string): number | null {
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };
        const exp = Number(decoded.exp);
        return Number.isFinite(exp) ? exp * 1000 : null;
    } catch {
        return null;
    }
}

function isTokenExpiredOrExpiring(token: string | null | undefined, skewMs: number): boolean {
    if (!token) return false;
    const expiresAt = getJwtExpirationMs(token);
    return expiresAt !== null && expiresAt <= Date.now() + skewMs;
}

export function useWebSocket({
    url,
    token,
    onMessage,
    onOpen,
    onClose,
    onError,
    onAuthExpired,
    reconnect = true,
    reconnectInterval = 3000,
    authExpirySkewMs = DEFAULT_AUTH_EXPIRY_SKEW_MS,
    refreshOnAuthExpired = true,
    enabled = true,
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const connectionGenerationRef = useRef(0);
    const connectRef = useRef<() => void>(() => {});
    const mountedRef = useRef(false);
    const refreshInFlightRef = useRef(false);

    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);
    const onErrorRef = useRef(onError);
    const onAuthExpiredRef = useRef(onAuthExpired);

    useEffect(() => {
        onMessageRef.current = onMessage;
        onOpenRef.current = onOpen;
        onCloseRef.current = onClose;
        onErrorRef.current = onError;
        onAuthExpiredRef.current = onAuthExpired;
    }, [onAuthExpired, onClose, onError, onMessage, onOpen]);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = undefined;
        }
    }, []);

    const markDisconnected = useCallback(() => {
        queueMicrotask(() => {
            if (mountedRef.current) {
                setIsConnected(false);
            }
        });
    }, []);

    const handleAuthExpired = useCallback(() => {
        if (!refreshOnAuthExpired) {
            onAuthExpiredRef.current?.();
            return;
        }

        if (refreshInFlightRef.current) return;

        refreshInFlightRef.current = true;
        void refreshStoredAuthTokens()
            .catch(() => {
                onAuthExpiredRef.current?.();
            })
            .finally(() => {
                refreshInFlightRef.current = false;
            });
    }, [refreshOnAuthExpired]);

    const connect = useCallback(() => {
        clearReconnectTimer();
        markDisconnected();

        if (isTokenExpiredOrExpiring(token, authExpirySkewMs)) {
            handleAuthExpired();
            return;
        }

        const generation = ++connectionGenerationRef.current;
        const ws = token ? new WebSocket(url, ["access_token", token]) : new WebSocket(url);

        ws.onopen = () => {
            if (generation !== connectionGenerationRef.current) return;
            setIsConnected(true);
            onOpenRef.current?.();
        };

        ws.onmessage = (event) => {
            if (generation !== connectionGenerationRef.current) return;
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current?.(data);
            } catch {
                onMessageRef.current?.(event.data);
            }
        };

        ws.onclose = (event) => {
            if (generation !== connectionGenerationRef.current) return;
            setIsConnected(false);
            onCloseRef.current?.(event);

            if (NON_RETRYABLE_CLOSE_CODES.has(event.code)) {
                if (event.code === 4401) {
                    handleAuthExpired();
                }
                return;
            }

            if (isTokenExpiredOrExpiring(token, authExpirySkewMs)) {
                handleAuthExpired();
                return;
            }

            if (reconnect) {
                reconnectTimerRef.current = setTimeout(() => connectRef.current(), reconnectInterval);
            }
        };

        ws.onerror = (error) => {
            if (generation !== connectionGenerationRef.current) return;
            onErrorRef.current?.(error);
        };

        wsRef.current = ws;
    }, [authExpirySkewMs, clearReconnectTimer, handleAuthExpired, markDisconnected, reconnect, reconnectInterval, token, url]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        if (!enabled) {
            connectionGenerationRef.current += 1;
            clearReconnectTimer();
            wsRef.current?.close();
            wsRef.current = null;
            return;
        }

        connect();
        return () => {
            connectionGenerationRef.current += 1;
            clearReconnectTimer();
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [clearReconnectTimer, connect, enabled]);

    const send = useCallback((data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
        }
    }, []);

    return { isConnected: enabled && isConnected, send, ws: wsRef };
}
