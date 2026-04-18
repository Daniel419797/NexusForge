import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSdkVariant } from "@/lib/sdk-catalog";

interface ProjectSdkVariantDocumentationPageProps {
    params: Promise<{ id: string; family: string; variant: string }>;
}

export default async function ProjectSdkVariantDocumentationPage({ params }: ProjectSdkVariantDocumentationPageProps) {
    const { id, family: familySlug, variant: variantSlug } = await params;
    const record = getSdkVariant(familySlug, variantSlug);

    if (!record) notFound();

    const { family, variant } = record;

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">SDK Documentation</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">{family.name} · {variant.name}</h1>
                <p className="text-sm text-white/60">Project route: /projects/{id}/sdk/{family.slug}/{variant.slug}/documentation</p>
            </header>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Install</h2>
                <div className="mt-3 rounded bg-black/20 p-3 font-mono text-xs text-white/80">
                    {variant.packageName.startsWith("@") ? `npm install ${variant.packageName}` : `pip install ${variant.packageName}`}
                </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Quick Start</h2>
                <pre className="mt-3 overflow-x-auto rounded bg-black/20 p-3 text-xs text-white/80">
{variant.quickStartSnippet}
                </pre>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white/85">Sections</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                    {variant.documentationSections.map((section) => (
                        <li key={section}>{section}</li>
                    ))}
                </ul>
            </section>

            <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                    <Link href={`/projects/${id}/sdk/${family.slug}/${variant.slug}`}>Back to variant</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/projects/${id}/sdk/${family.slug}`}>Back to family</Link>
                </Button>
            </div>
        </div>
    );
}
