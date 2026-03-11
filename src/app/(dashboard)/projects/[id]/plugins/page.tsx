"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import PluginService, { type PluginMeta, type InstalledPlugin } from "@/services/PluginService";
import MarketplaceGrid from "@/components/Plugins/MarketplaceGrid";
import ConfigPanel from "@/components/Plugins/ConfigPanel";
import IdeaSubmissionDialog from "@/components/Plugins/IdeaSubmissionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectPluginsPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;

    const [available, setAvailable] = useState<PluginMeta[]>([]);
    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

    const [configPlugin, setConfigPlugin] = useState<InstalledPlugin | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setLoadingInitial(true);
        try {
            const [avail, inst] = await Promise.all([
                PluginService.getAvailable(projectId),
                PluginService.getInstalled(projectId),
            ]);
            setAvailable(avail);
            setInstalled(inst);
        } catch {
            // ignore
        } finally {
            setLoadingInitial(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setItemLoading = (name: string, stat: boolean) => {
        setLoadingItems((prev) => ({ ...prev, [name]: stat }));
    };

    const handleInstall = async (name: string) => {
        if (!projectId) return;
        setItemLoading(name, true);
        try {
            await PluginService.install(projectId, name);
            fetchData();
        } catch {
            // ignore
        } finally {
            setItemLoading(name, false);
        }
    };

    const handleUninstall = async (name: string) => {
        if (!projectId) return;
        if (!confirm(`Are you sure you want to uninstall ${name}?`)) return;

        setItemLoading(name, true);
        try {
            await PluginService.uninstall(projectId, name);
            fetchData();
        } catch {
            // ignore
        } finally {
            setItemLoading(name, false);
        }
    };

    const handleConfigureOpen = (plugin: InstalledPlugin) => {
        setConfigPlugin(plugin);
        setIsConfigOpen(true);
    };

    const handleSaveConfig = async (name: string, config: any) => {
        if (!projectId) return;
        try {
            await PluginService.updateConfig(projectId, name, config);
            fetchData();
        } catch {
            throw new Error("Failed to save config");
        }
    };

    if (!projectId) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project first.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Project Plugins</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage plugins for this project — install, configure, or remove extensions.
                    </p>
                </div>
                <Button onClick={() => setIsIdeaDialogOpen(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Submit Idea
                </Button>
            </div>

            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                    <TabsTrigger value="installed">Installed ({installed.length})</TabsTrigger>
                </TabsList>

                {loadingInitial ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <TabsContent value="marketplace" className="mt-0">
                            <MarketplaceGrid
                                available={available}
                                installed={installed}
                                onInstall={handleInstall}
                                onUninstall={handleUninstall}
                                onConfigure={handleConfigureOpen}
                                loadingItems={loadingItems}
                            />
                        </TabsContent>
                        <TabsContent value="installed" className="mt-0">
                            {installed.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                                    No plugins installed for this project.
                                </div>
                            ) : (
                                <MarketplaceGrid
                                    available={available.filter(a => installed.some(i => i.name === a.name))}
                                    installed={installed}
                                    onInstall={handleInstall}
                                    onUninstall={handleUninstall}
                                    onConfigure={handleConfigureOpen}
                                    loadingItems={loadingItems}
                                />
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>

            <ConfigPanel
                plugin={configPlugin}
                open={isConfigOpen}
                onOpenChange={setIsConfigOpen}
                onSave={handleSaveConfig}
            />

            <IdeaSubmissionDialog open={isIdeaDialogOpen} onOpenChange={setIsIdeaDialogOpen} />
        </div>
    );
}
