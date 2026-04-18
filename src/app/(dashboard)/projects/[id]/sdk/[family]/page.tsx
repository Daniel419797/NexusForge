import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSdkFamilyBySlug } from "@/lib/sdk-catalog";

interface ProjectSdkFamilyPageProps {
    params: Promise<{ id: string; family: string }>;
}

export default async function ProjectSdkFamilyPage({ params }: ProjectSdkFamilyPageProps) {
    const { id, family: familySlug } = await params;
    const family = getSdkFamilyBySlug(familySlug);

    if (!family) notFound();

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">SDK Family</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">{family.name}</h1>
                <p className="text-sm text-cyan-200/80">{family.tagline}</p>
                <p className="max-w-3xl text-sm text-white/60">{family.summary}</p>
            </header>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {family.variants.map((variant) => (
                    <article key={variant.slug} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-white">{variant.name}</h2>
                                <p className="mt-1 text-xs text-white/45">{variant.language} · {variant.runtime}</p>
                            </div>
                            <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                                {variant.status}
                            </span>
                        </div>

                        <p className="mt-3 text-sm text-white/60">{variant.summary}</p>

                        <div className="mt-4 rounded bg-black/20 p-3 font-mono text-xs text-white/80">
                            {variant.packageName.startsWith("@") ? `npm install ${variant.packageName}` : `pip install ${variant.packageName}`}
                        </div>

                        <div className="mt-4 flex gap-3">
                            <Button asChild>
                                <Link href={`/projects/${id}/sdk/${family.slug}/${variant.slug}`}>Open Variant</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={`/projects/${id}/sdk/${family.slug}/${variant.slug}/documentation`}>Documentation</Link>
                            </Button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
