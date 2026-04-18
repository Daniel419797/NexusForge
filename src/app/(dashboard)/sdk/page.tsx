"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sdkCatalog } from "@/lib/sdk-catalog";
import { Button } from "@/components/ui/button";

export default function SdkIndexPage() {
    const [statusFilter, setStatusFilter] = useState<"all" | "stable" | "beta">("all");
    const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "frontend" | "backend">("all");

    const visibleSdk = useMemo(
        () => sdkCatalog.filter((sdk) => {
            if (statusFilter !== "all" && sdk.status !== statusFilter) return false;
            if (categoryFilter !== "all" && sdk.category !== categoryFilter) return false;
            return true;
        }),
        [statusFilter, categoryFilter],
    );

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">SDK</h1>
                <p className="text-sm text-white/55">
                    Browse available NexusForge SDKs and open dedicated pages for implementation details.
                </p>
            </header>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/45">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {(["all", "stable", "beta"] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setStatusFilter(option)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        statusFilter === option
                                            ? "border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                                            : "border border-white/15 bg-white/[0.02] text-white/60 hover:text-white/80"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/45">Category</p>
                        <div className="flex flex-wrap gap-2">
                            {(["all", "core", "frontend", "backend"] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setCategoryFilter(option)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        categoryFilter === option
                                            ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                                            : "border border-white/15 bg-white/[0.02] text-white/60 hover:text-white/80"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleSdk.map((sdk) => (
                    <article
                        key={sdk.slug}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-white">{sdk.name}</h2>
                                <p className="mt-1 text-xs text-white/45">{sdk.language}</p>
                            </div>
                            <span className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                                {sdk.status}
                            </span>
                        </div>

                        <div className="mb-3 inline-flex rounded border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
                            {sdk.category}
                        </div>

                        <p className="mb-4 text-sm text-white/65">{sdk.summary}</p>

                        <div className="mb-4 rounded bg-black/20 p-3 font-mono text-xs text-white/80">
                            npm install {sdk.packageName}
                        </div>

                        <Button asChild className="w-full">
                            <Link href={`/sdk/${sdk.slug}`}>Open SDK</Link>
                        </Button>
                    </article>
                ))}
            </div>

            {visibleSdk.length === 0 && (
                <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                    No SDKs match the selected filters.
                </p>
            )}
        </div>
    );
}
