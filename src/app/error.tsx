"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught an error:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <svg aria-hidden="true" className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    We encountered an unexpected error. Please try refreshing the page or navigating back.
                </p>
            </div>

            <div className="flex gap-4">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                    Go Home
                </Button>
                <Button onClick={() => reset()}>
                    Try Again
                </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
                <div className="mt-8 p-4 bg-muted rounded-lg text-left max-w-2xl w-full overflow-auto text-xs font-mono text-muted-foreground">
                    <p className="font-bold mb-2">Error Details (Dev Only):</p>
                    <p>{error.message}</p>
                    <pre className="mt-2">{error.stack}</pre>
                </div>
            )}
        </div>
    );
}
