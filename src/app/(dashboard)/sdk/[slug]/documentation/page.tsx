import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSdkBySlug } from "@/lib/sdk-catalog";

interface SdkDocumentationPageProps {
    params: Promise<{ slug: string }>;
}

export default async function SdkDocumentationPage({ params }: SdkDocumentationPageProps) {
    const { slug } = await params;
    const sdk = getSdkBySlug(slug);

    if (!sdk) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">SDK Documentation</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">{sdk.name}</h1>
                <p className="text-sm text-white/60">
                    Route: /sdk/{sdk.slug}/documentation
                </p>
            </header>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Installation</h2>
                <div className="mt-3 rounded bg-black/20 p-3 font-mono text-xs text-white/80">
                    npm install {sdk.packageName}
                </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Quick Start</h2>
                <pre className="mt-3 overflow-x-auto rounded bg-black/20 p-3 text-xs text-white/80">
{sdk.quickStartSnippet}
                </pre>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Sections</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                    {sdk.documentationSections.map((section) => (
                        <li key={section}>{section}</li>
                    ))}
                </ul>
            </section>

            <div className="flex gap-3">
                <Button asChild variant="outline">
                    <Link href={`/sdk/${sdk.slug}`}>Back to SDK page</Link>
                </Button>
            </div>
        </div>
    );
}
