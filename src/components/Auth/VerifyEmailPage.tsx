"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthService from "@/services/AuthService";
import Link from "next/link";

type VerifyState = "verifying" | "success" | "error" | "no-token";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
                <Card className="w-full max-w-md animate-in-up">
                    <CardContent className="py-12 text-center">
                        <div className="w-10 h-10 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </CardContent>
                </Card>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [state, setState] = useState<VerifyState>(token ? "verifying" : "no-token");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Resend form
    const [resendEmail, setResendEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        AuthService.verifyEmail(token)
            .then(() => setState("success"))
            .catch((err) => {
                setState("error");
                setErrorMessage(err?.response?.data?.message || "Verification failed. The token may have expired.");
            });
    }, [token]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail.trim()) return;
        setResending(true);
        setResendMessage(null);
        try {
            await AuthService.resendVerification(resendEmail.trim());
            setResendMessage("Verification email sent! Check your inbox.");
        } catch (err: any) {
            setResendMessage(err?.response?.data?.message || "Failed to resend. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
            <Card className="w-full max-w-md animate-in-up card-hover">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-display tracking-tight">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {state === "verifying" && (
                        <div className="text-center space-y-3">
                            <div className="w-10 h-10 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Verifying your email...</p>
                        </div>
                    )}

                    {state === "success" && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                                <svg aria-hidden="true" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Email Verified!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your email has been successfully verified. You can now sign in.
                                </p>
                            </div>
                            <Link href="/login">
                                <Button className="w-full">Go to Login</Button>
                            </Link>
                        </div>
                    )}

                    {state === "error" && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                <svg aria-hidden="true" className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Verification Failed</h3>
                                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {(state === "error" || state === "no-token") && (
                        <div className="border-t border-border pt-6">
                            <p className="text-sm font-medium mb-3">Resend verification email</p>
                            <form onSubmit={handleResend} className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="resendEmail">Email address</Label>
                                    <Input
                                        id="resendEmail"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {resendMessage && (
                                    <p className="text-sm text-primary">{resendMessage}</p>
                                )}
                                <Button type="submit" variant="outline" className="w-full" disabled={resending}>
                                    {resending ? "Sending..." : "Resend Verification"}
                                </Button>
                            </form>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
