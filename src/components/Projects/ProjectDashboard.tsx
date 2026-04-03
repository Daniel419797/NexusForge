"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";

export default function ProjectDashboard() {
    const project = useProjectStore((s) => s.activeProject);
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!project) return;
        let mounted = true;
        ProjectService.getById(project.id)
            .then((res) => {
                if (!mounted) return;
                // attempt to surface a few recent items from project config or membership
                setRecent((res.config as any)?.recentActivity || []);
            })
            .catch(() => {})
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, [project]);

    if (!project) return null;

    return (
        <div className="space-y-6">
            {/* Top header — compact Render-like banner */}
            <Card>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {/* <div className="text-xs text-muted-foreground tracking-widest">PROJECT</div> */}
                                <div>
                                    <div className="flex gap-5">
                                        <h2 className="text-2xl font-semibold">{project.name}</h2>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className={project.status === "active" ? "w-2 h-2 rounded-full bg-emerald-400" : "w-1 h-1 rounded-full bg-muted-foreground"} />
                                            <span className="text-sm font-semibold capitalize">{project.status}</span>
                                        </div>
                                        {project.config?.settings?.tenantOwnedAuth && (
                                            <Badge variant="outline" className="text-[10px] border-white/20 text-white/60 mt-1.5">
                                                Tenant Auth
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                                {/* <div className="flex items-center gap-3">
                                    <div className="font-medium text-foreground">ID</div>
                                    <div className="truncate max-w-xl">{project.id}</div>
                                    <button
                                        aria-label="Copy project id"
                                        className="p-1 rounded hover:bg-accent/10"
                                        onClick={() => navigator.clipboard?.writeText(project.id)}
                                    >
                                        <Copy className="size-4" />
                                    </button>
                                </div> */}

                                

                                <div className="flex items-center gap-3">
                                    <div className="font-medium text-foreground">Category</div>
                                    <div className="truncate">{project.category?.replace("-", " ")}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="font-medium text-foreground">Created</div>
                                    <div>{new Date(project.createdAt).toLocaleString()}</div>
                                    <div className="font-medium text-foreground ml-4">Updated</div>
                                    <div>{new Date(project.updatedAt ?? project.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {!project.config?.dbConnected && (
                            <div className="shrink-0 flex items-center gap-2">
                                <Link href={`/projects/${project.id}/settings/database`}>
                                    <Button variant="outline">Connect Database</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
