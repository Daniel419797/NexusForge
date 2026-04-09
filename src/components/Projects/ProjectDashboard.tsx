"use client";

import { useProjectStore } from "@/store/projectStore";
import Link from "next/link";

export default function ProjectDashboard() {
    const project = useProjectStore((s) => s.activeProject);

    if (!project) return null;

    const isActive = project.status === "active";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.04] pb-5 mb-6">
            {/* Left: name + meta */}
            <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 mt-1.5 w-[3px] self-stretch rounded-full" style={{ background: "rgba(129,236,255,0.45)" }} />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-bold font-display tracking-tight text-white/90 truncate">
                            {project.name}
                        </h2>
                        <span className="flex items-center gap-1.5 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-white/20"}`} />
                            <span className={`text-xs font-medium capitalize ${isActive ? "text-emerald-400" : "text-white/30"}`}>
                                {project.status}
                            </span>
                        </span>
                        {project.config?.settings?.tenantOwnedAuth && (
                            <span className="text-[10px] font-mono text-white/30 border border-white/[0.08] px-1.5 py-0.5 rounded">
                                Tenant Auth
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
                        {project.category && (
                            <span className="text-[11px] text-white/30">
                                {project.category.replace("-", " ")}
                            </span>
                        )}
                        <span className="text-[11px] text-white/20">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        {project.updatedAt && project.updatedAt !== project.createdAt && (
                            <span className="text-[11px] text-white/20">
                                Updated {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: CTA if db not connected */}
            {!project.config?.dbConnected && (
                <Link
                    href={`/projects/${project.id}/settings/database`}
                    className="shrink-0 self-start sm:self-auto text-[11px] font-medium text-amber-400/70 hover:text-amber-400 border border-amber-400/20 hover:border-amber-400/40 px-3 py-1.5 rounded transition-colors"
                >
                    Connect database →
                </Link>
            )}
        </div>
    );
}
