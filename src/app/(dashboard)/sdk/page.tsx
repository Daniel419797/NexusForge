import Link from "next/link";
import { sdkCatalog } from "@/lib/sdk-catalog";
import { Button } from "@/components/ui/button";

export default function SdkIndexPage() {
    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">SDK</h1>
                <p className="text-sm text-white/55">
                    Browse available NexusForge SDKs and open dedicated pages for implementation details.
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sdkCatalog.map((sdk) => (
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
        </div>
    );
}
