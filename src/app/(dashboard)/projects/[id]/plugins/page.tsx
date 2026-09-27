"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import PluginService, { type PluginMeta, type InstalledPlugin } from "@/services/PluginService";
import MarketplaceGrid from "@/components/Plugins/MarketplaceGrid";
import ConfigPanel from "@/components/Plugins/ConfigPanel";
import IdeaSubmissionDialog from "@/components/Plugins/IdeaSubmissionDialog";
import PluginInstallDialog from "@/components/Plugins/PluginInstallDialog";
import { MfaStepUpCancelledError, useMfaStepUp } from "@/components/Auth/MfaStepUpProvider";
import { useToast } from "@/components/ui/toast-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectPluginsPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;
    const { runWithMfa } = useMfaStepUp();
    const { toast } = useToast();
    const [available, setAvailable] = useState<PluginMeta[]>([]);
    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

    const [configPlugin, setConfigPlugin] = useState<InstalledPlugin | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [installPlugin, setInstallPlugin] = useState<PluginMeta | null>(null);
    const [isInstallOpen, setIsInstallOpen] = useState(false);
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
        } finally {
            setLoadingInitial(false);
        }
    }, [projectId]);

    const refreshInstalled = useCallback(async () => {
        if (!projectId) return;
        setInstalled(await PluginService.getInstalled(projectId));
    }, [projectId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const setItemLoading = (name: string, stat: boolean) => {
        setLoadingItems((prev) => ({ ...prev, [name]: stat }));
    };

    const performInstall = async (plugin: PluginMeta, config: Record<string, unknown>) => {
        if (!projectId) return;
        setItemLoading(plugin.name, true);
        try {
            await runWithMfa((stepUpToken) =>
                PluginService.install(projectId, plugin.name, { stepUpToken, config }),
            );
            await refreshInstalled();
            toast((plugin.displayName || plugin.name) + " installed successfully.", "success");
        } finally {
            setItemLoading(plugin.name, false);
        }
    };

    const handleInstall = async (name: string) => {
        const plugin = available.find((item) => item.name === name);
        if (!plugin || !projectId) return;

        if (plugin.compatible === false) {
            toast(
                (plugin.displayName || plugin.name) + " requires a " +
                (plugin.requiredProjectCategory || "different") + " project.",
                "info",
            );
            return;
        }

        if ((plugin.configFields ?? []).length > 0) {
            setInstallPlugin(plugin);
            setIsInstallOpen(true);
            return;
        }

        try {
            await performInstall(plugin, {});
        } catch (err) {
            if (err instanceof MfaStepUpCancelledError) return;
            // The shared API interceptor displays non-MFA backend errors.
        }
    };

    const handleUninstall = async (name: string) => {
        if (!projectId) return;
        if (!confirm("Are you sure you want to uninstall " + name + "?")) return;

        setItemLoading(name, true);
        try {
            await runWithMfa((stepUpToken) =>
                PluginService.uninstall(projectId, name, { stepUpToken }),
            );
            await refreshInstalled();
            toast(name + " removed successfully.", "success");
        } catch (err) {
            if (err instanceof MfaStepUpCancelledError) return;
        } finally {
            setItemLoading(name, false);
        }
    };

    const handleConfigureOpen = (plugin: InstalledPlugin) => {
        setConfigPlugin(plugin);
        setIsConfigOpen(true);
    };

    const handleSaveConfig = async (name: string, config: Record<string, unknown>) => {
        if (!projectId) return;
        await runWithMfa((stepUpToken) =>
            PluginService.updateConfig(projectId, name, config, { stepUpToken }),
        );
        await refreshInstalled();
        toast(name + " configuration saved.", "success");
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
                                    available={available.filter((plugin) => installed.some((item) => item.name === plugin.name))}
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

            <PluginInstallDialog
                plugin={installPlugin}
                open={isInstallOpen}
                onOpenChange={(open) => {
                    setIsInstallOpen(open);
                    if (!open) setInstallPlugin(null);
                }}
                onInstall={async (config) => {
                    if (!installPlugin) return;
                    await performInstall(installPlugin, config);
                }}
            />

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
