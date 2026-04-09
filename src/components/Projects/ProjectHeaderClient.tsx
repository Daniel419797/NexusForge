"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import ProjectService from "@/services/ProjectService";
import { useProjectStore } from "@/store/projectStore";
import ProjectDashboard from "@/components/Projects/ProjectDashboard";

export default function ProjectHeaderClient({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const projectId = params.id as string | undefined;
    const { activeProject, setActiveProject } = useProjectStore();
    const [loading, setLoading] = useState(!activeProject || activeProject.id !== projectId);

    const fetchProject = useCallback(async () => {
        if (!projectId) return;
        try {
            const result = await ProjectService.getById(projectId);
            // merge project detail (config + membership) into activeProject
            setActiveProject({ ...result.project, config: result.config ?? null, membership: result.membership ?? null });
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [projectId, setActiveProject]);

    useEffect(() => {
        if (!projectId) return;
        if (!activeProject || activeProject.id !== projectId) {
            fetchProject();
        } else {
            setLoading(false);
        }
    }, [projectId, activeProject, fetchProject]);

    // const tabs = [
    //     { label: "Overview", href: `/projects/${projectId}` },
    //     { label: "Documentation", href: `/projects/${projectId}/documentation` },
    //     { label: "API", href: `/projects/${projectId}/api` },
    //     { label: "API Keys", href: `/projects/${projectId}/api-keys` },
    //     { label: "Plugins", href: `/projects/${projectId}/plugins` },
    //     { label: "Settings", href: `/projects/${projectId}/settings` },
    // ];

    const pathSegmentsClient = pathname?.split("/").filter(Boolean) || [];
    const isRoot = pathSegmentsClient.length === 2 && pathSegmentsClient[0] === "projects" && pathSegmentsClient[1] === projectId;

    if (loading) {
        return (
            <div className="border-b border-white/[0.04] pb-5 mb-6">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="shrink-0 w-[3px] h-10 rounded-full bg-white/[0.06]" />
                    <div className="flex flex-col gap-2">
                        <div className="h-5 w-44 rounded bg-white/[0.06]" />
                        <div className="h-2.5 w-28 rounded bg-white/[0.04]" />
                    </div>
                </div>
            </div>
        );
    }
    // Replace header/tabs entirely with dashboard widget layout
    return (
        <div>
            <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Link href="/projects" className="hover:text-foreground transition-colors">
                        Projects
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{activeProject?.name || "Project"}</span>
                </div>
            </div>

            <ProjectDashboard />

            <div className="mt-6">{children}</div>
        </div>
    );
}
