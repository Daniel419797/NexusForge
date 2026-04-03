"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "missing">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    fetch(`${apiBase}/api/v1/compliance/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        {status === "loading" && (
          <div>
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
            <p className="text-sm text-white/50">Processing your unsubscribe request...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <svg aria-hidden="true" className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Unsubscribed</h1>
            <p className="text-sm text-white/50 mb-6">
              You have been successfully unsubscribed from marketing emails. You will still receive essential
              transactional emails (security alerts, account verification).
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg aria-hidden="true" className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Unsubscribe Failed</h1>
            <p className="text-sm text-white/50 mb-6">
              The unsubscribe link may have expired or already been used. You can manage your email preferences
              from your account Settings → Compliance.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === "missing" && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
            <p className="text-sm text-white/50 mb-6">
              No unsubscribe token provided. If you want to manage email preferences, sign in to your account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
