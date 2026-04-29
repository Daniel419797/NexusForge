"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
    url: string;
    token?: string | null;
    onMessage?: (data: unknown) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event) => void;
    reconnect?: boolean;
    reconnectInterval?: number;
    enabled?: boolean;
}

export function useWebSocket({
    url,
    token,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    enabled = true,
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const NON_RETRYABLE_CLOSE_CODES = new Set([4401, 4403, 4429]);

    // Keep a ref to the latest onMessage so the ws.onmessage handler always
    // calls the current version without needing a reconnect every render.
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const connect = useCallback(() => {
        const wsUrl = token
            ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
            : url;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            onOpen?.();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current?.(data);
            } catch {
                onMessageRef.current?.(event.data);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            onClose?.(event);
            if (reconnect && !NON_RETRYABLE_CLOSE_CODES.has(event.code)) {
                reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
            }
        };

        ws.onerror = (error) => {
            onError?.(error);
        };

        wsRef.current = ws;
    // onMessage intentionally excluded — handled via ref above
    }, [url, token, onOpen, onClose, onError, reconnect, reconnectInterval]);

    useEffect(() => {
        if (!enabled) return;
        connect();
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, token, enabled]);

    const send = useCallback((data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
        }
    }, []);

    return { isConnected, send, ws: wsRef };
}
