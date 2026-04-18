import Link from "next/link";
import { sdkCatalog } from "@/lib/sdk-catalog";
import { Button } from "@/components/ui/button";

interface ProjectSdkIndexPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectSdkIndexPage({ params }: ProjectSdkIndexPageProps) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">Project SDK</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">SDK Library</h1>
                <p className="max-w-3xl text-sm text-white/60">
                    Choose an SDK family first, then drill into the variation that best matches your stack.
                </p>
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
                {sdkCatalog.map((family) => (
                    <article key={family.slug} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-widest text-cyan-200/80">{family.tagline}</p>
                            <h2 className="text-xl font-semibold text-white">{family.name}</h2>
                            <p className="text-sm text-white/60">{family.summary}</p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {family.variants.map((variant) => (
                                <Link
                                    key={variant.slug}
                                    href={`/projects/${id}/sdk/${family.slug}/${variant.slug}`}
                                    className="rounded-lg border border-white/10 bg-black/20 p-4 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">{variant.name}</h3>
                                            <p className="mt-1 text-xs text-white/45">{variant.runtime}</p>
                                        </div>
                                        <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/65">
                                            {variant.status}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-xs text-white/55">{variant.summary}</p>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-5">
                            <Button asChild variant="outline">
                                <Link href={`/projects/${id}/sdk/${family.slug}`}>Open {family.name}</Link>
                            </Button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
