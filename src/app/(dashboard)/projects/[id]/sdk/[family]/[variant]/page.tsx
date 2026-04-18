import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getPublishedSdkVariant } from "@/lib/sdk-catalog";

interface ProjectSdkVariantPageProps {
    params: Promise<{ id: string; family: string; variant: string }>;
}

export default async function ProjectSdkVariantPage({ params }: ProjectSdkVariantPageProps) {
    const { id, family: familySlug, variant: variantSlug } = await params;
    const record = getPublishedSdkVariant(familySlug, variantSlug);

    if (!record) notFound();

    const { family, variant } = record;

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">{family.name}</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">{variant.name}</h1>
                <p className="max-w-3xl text-sm text-white/60">{variant.summary}</p>
            </header>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                    <span className="rounded border border-white/10 px-2 py-1">{variant.language}</span>
                    <span className="rounded border border-white/10 px-2 py-1">{variant.runtime}</span>
                    <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-cyan-200">{variant.status}</span>
                </div>

                <div className="mt-4 rounded bg-black/20 p-3 font-mono text-sm text-white/85">
                    {variant.packageName}
                </div>
                <div className="mt-3 rounded bg-black/20 p-3 font-mono text-xs text-white/75">
                    {variant.packageName.startsWith("@") ? `npm install ${variant.packageName}` : `pip install ${variant.packageName}`}
                </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Why this variation exists</h2>
                <p className="mt-3 text-sm text-white/60">
                    This variation is grouped under {family.name} so teams can choose the implementation style that matches their stack without losing the shared product context.
                </p>
            </section>

            <div className="flex flex-wrap gap-3">
                <Button asChild>
                    <Link href={`/projects/${id}/sdk/${family.slug}/${variant.slug}/documentation`}>Documentation</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/projects/${id}/sdk/${family.slug}`}>Back to {family.name}</Link>
                </Button>
            </div>
        </div>
    );
}
