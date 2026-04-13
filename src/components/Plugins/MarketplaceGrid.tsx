"use client";

import { useState, useMemo } from "react";
import PluginCard from "./PluginCard";
import type { PluginMeta, InstalledPlugin } from "@/services/PluginService";
import { Button } from "@/components/ui/button";

interface MarketplaceGridProps {
    available: PluginMeta[];
    installed: InstalledPlugin[];
    onInstall: (name: string) => Promise<void>;
    onUninstall: (name: string) => Promise<void>;
    onConfigure?: (plugin: InstalledPlugin) => void;
    loadingItems: Record<string, boolean>;
}

export default function MarketplaceGrid({
    available,
    installed,
    onInstall,
    onUninstall,
    onConfigure,
    loadingItems,
}: MarketplaceGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const safeAvailable = Array.isArray(available) ? available : [];
    const safeInstalled = Array.isArray(installed) ? installed : [];

    // Extract unique categories from available plugins
    const categories = useMemo(() => {
        const cats = new Set<string>();
        safeAvailable.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).sort();
    }, [safeAvailable]);

    const filteredPlugins = useMemo(() => {
        if (selectedCategory === "all") return safeAvailable;
        return safeAvailable.filter(p => p.category === selectedCategory);
    }, [safeAvailable, selectedCategory]);

    if (safeAvailable.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                No plugins available in the marketplace currently.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground mr-2">Categories:</span>
                    <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className="rounded-full h-8"
                    >
                        All
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className="rounded-full h-8 capitalize"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            )}

            {filteredPlugins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                    No plugins found in this category.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlugins.map((meta) => {
                        const installedInstance = safeInstalled.find((p) => p.name === meta.name);
                        return (
                            <PluginCard
                                key={meta.name}
                                meta={meta}
                                installed={installedInstance}
                                onInstall={onInstall}
                                onUninstall={onUninstall}
                                onConfigure={onConfigure}
                                loading={loadingItems[meta.name] || false}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
