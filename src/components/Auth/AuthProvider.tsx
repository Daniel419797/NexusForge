"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AuthService from "@/services/AuthService";

/**
 * AuthProvider — wraps protected routes.
 * On mount, attempts to fetch the user profile using the stored JWT.
 * Redirects to /login if unauthenticated.
 */
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, setUser, setLoading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setUser(null);
            router.replace("/login");
            return;
        }

        // Attempt to fetch user profile
        AuthService.getProfile()
            .then((profile) => {
                setUser(profile);
            })
            .catch(() => {
                setUser(null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                router.replace("/login");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="animate-spin w-8 h-8 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
