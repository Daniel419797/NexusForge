"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
    url: string;
    token?: string | null;
    onMessage?: (data: unknown) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    reconnect?: boolean;
    reconnectInterval?: number;
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
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const connect = useCallback(() => {
        const wsUrl = token ? `${url}?token=${token}` : url;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            onOpen?.();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch {
                onMessage?.(event.data);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            onClose?.();
            if (reconnect) {
                reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
            }
        };

        ws.onerror = (error) => {
            onError?.(error);
        };

        wsRef.current = ws;
    }, [url, token, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, token]);

    const send = useCallback((data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
        }
    }, []);

    return { isConnected, send, ws: wsRef };
}
