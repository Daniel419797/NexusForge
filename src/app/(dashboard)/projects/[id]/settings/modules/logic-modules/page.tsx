"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, CircleDot, Archive, FileText, Trash2 } from "lucide-react";

import LogicModuleService, { type LogicModuleDefinition } from "@/services/LogicModuleService";
import { Button } from "@/components/ui/button";

const STATUS_META: Record<
    LogicModuleDefinition["status"],
    { label: string; className: string; icon: React.ReactNode }
> = {
    active: {
        label: "Active",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: <CircleDot className="w-3 h-3" />,
    },
    draft: {
        label: "Draft",
        className: "bg-muted text-muted-foreground",
        icon: <FileText className="w-3 h-3" />,
    },
    archived: {
        label: "Archived",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Archive className="w-3 h-3" />,
    },
};

export default function LogicModulesListPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;

    const [modules, setModules] = useState<LogicModuleDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const [archiving, setArchiving] = useState<string | null>(null);

    const handleArchive = async (moduleKey: string) => {
        if (!projectId) return;
        if (!confirm(`Archive module "${moduleKey}"? It will stop running and cannot be triggered.`)) return;
        setArchiving(moduleKey);
        try {
            await LogicModuleService.archiveDefinition(projectId, moduleKey);
            await fetchModules();
        } catch {
            setMessage("Failed to archive module.");
        } finally {
            setArchiving(null);
        }
    };

    const fetchModules = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const data = await LogicModuleService.list(projectId);
            setModules(data);
        } catch {
            setMessage("Failed to load logic modules.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    if (!projectId) return null;

    const activeCount = modules.filter((m) => m.status === "active").length;
    const draftCount = modules.filter((m) => m.status === "draft").length;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link
                    href={`/projects/${projectId}/settings/modules`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold font-display tracking-tight">Logic Modules</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your custom workflow modules — create, edit, and publish versions.
                    </p>
                </div>
                <Link href={`/projects/${projectId}/settings/modules/logic-builder`}>
                    <Button size="sm" className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        New Module
                    </Button>
                </Link>
            </div>

            {message && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {message}
                </div>
            )}

            {!loading && modules.length > 0 && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{modules.length} total</span>
                    {activeCount > 0 && <span className="text-green-600 dark:text-green-400">{activeCount} active</span>}
                    {draftCount > 0 && <span>{draftCount} draft</span>}
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
                    ))
                ) : modules.length === 0 ? (
                    <div className="text-center py-16 border border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">No logic modules yet.</p>
                        <Link
                            href={`/projects/${projectId}/settings/modules/logic-builder`}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                            <Plus className="w-4 h-4" />
                            Create your first module
                        </Link>
                    </div>
                ) : (
                    modules.map((mod) => {
                        const meta = STATUS_META[mod.status];
                        return (
                            <div
                                key={mod.moduleKey}
                                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{mod.displayName}</p>
                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${meta.className}`}
                                        >
                                            {meta.icon}
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{mod.moduleKey}</p>
                                    {mod.description && (
                                        <p className="text-sm text-muted-foreground mt-1 truncate">{mod.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                    <Link
                                        href={`/projects/${projectId}/settings/modules/logic-builder?moduleKey=${encodeURIComponent(mod.moduleKey)}`}
                                    >
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </Button>
                                    </Link>
                                    {mod.status !== "archived" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 text-muted-foreground hover:text-destructive"
                                            disabled={archiving === mod.moduleKey}
                                            onClick={() => handleArchive(mod.moduleKey)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {archiving === mod.moduleKey ? "Archiving…" : "Archive"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {!loading && modules.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Use the Logic Builder to drag-and-drop nodes, configure triggers, and publish new versions.
                </p>
            )}
        </div>
    );
}
