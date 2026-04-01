"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthService from "@/services/AuthService";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await AuthService.forgotPassword(email);
            setSubmitted(true);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div>
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg aria-hidden="true" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 font-display tracking-tight">Check your email</h1>
                    <p className="text-muted-foreground text-sm">
                        If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link.
                    </p>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Back to sign in
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 font-display tracking-tight">Forgot password?</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your email and we&apos;ll send you a reset link.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>

                <Button type="submit" className="w-full btn-glow" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg aria-hidden="true" className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending...
                        </span>
                    ) : (
                        "Send Reset Link"
                    )}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
