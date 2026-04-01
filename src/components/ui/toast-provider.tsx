"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onApiError } from "@/services/api";

type ToastType = "error" | "success" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "error") => {
        const id = ++nextId;
        setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    // Subscribe to global API errors
    useEffect(() => {
        return onApiError((message) => addToast(message, "error"));
    }, [addToast]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => removeToast(t.id)}
                            className={`cursor-pointer px-4 py-3 rounded-lg shadow-lg border text-sm backdrop-blur-sm ${
                                t.type === "error"
                                    ? "bg-destructive/90 border-destructive/50 text-destructive-foreground"
                                    : t.type === "success"
                                    ? "bg-emerald-600/90 border-emerald-500/50 text-white"
                                    : "bg-primary/90 border-primary/50 text-primary-foreground"
                            }`}
                        >
                            {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
