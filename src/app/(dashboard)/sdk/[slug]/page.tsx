import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSdkBySlug } from "@/lib/sdk-catalog";

interface SdkDetailPageProps {
    params: Promise<{ slug: string }>;
}

export default async function SdkDetailPage({ params }: SdkDetailPageProps) {
    const { slug } = await params;
    const sdk = getSdkBySlug(slug);

    if (!sdk) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">SDK</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">{sdk.name}</h1>
                <p className="max-w-3xl text-sm text-white/60">{sdk.longDescription}</p>
            </header>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Package</h2>
                <div className="mt-2 rounded bg-black/20 p-3 font-mono text-sm text-white/85">
                    {sdk.packageName}
                </div>
                <div className="mt-4 rounded bg-black/20 p-3 font-mono text-xs text-white/75">
                    npm install {sdk.packageName}
                </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">What this SDK includes</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                    {sdk.documentationSections.map((section) => (
                        <li key={section}>{section}</li>
                    ))}
                </ul>
            </section>

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild>
                    <Link href={`/sdk/${sdk.slug}/documentation`}>Documentation</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/sdk">Back to SDK list</Link>
                </Button>
            </div>
        </div>
    );
}
