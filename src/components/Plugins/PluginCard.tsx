"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PluginMeta, InstalledPlugin } from "@/services/PluginService";

interface PluginCardProps {
    meta: PluginMeta;
    installed?: InstalledPlugin;
    onInstall: (name: string) => Promise<void>;
    onUninstall: (name: string) => Promise<void>;
    onConfigure?: (plugin: InstalledPlugin) => void;
    loading?: boolean;
}

export default function PluginCard({
    meta,
    installed,
    onInstall,
    onUninstall,
    onConfigure,
    loading,
}: PluginCardProps) {
    const isInstalled = !!installed;

    return (
        <Card className={`flex flex-col h-full ${isInstalled ? "border-primary/50 bg-primary/5" : ""}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                            {meta.icon || "🧩"}
                        </div>
                        <div>
                            <CardTitle className="text-base">{meta.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">by {meta.author} · v{meta.version}</CardDescription>
                        </div>
                    </div>
                    {isInstalled && (
                        <Badge variant="default" className="text-[10px]">Installed</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{meta.description}</p>
                {meta.tags && meta.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {meta.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] font-normal">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border pt-4">
                {isInstalled ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConfigure?.(installed)}
                        >
                            Configure
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onUninstall(meta.name)}
                            disabled={loading}
                        >
                            Remove
                        </Button>
                    </>
                ) : (
                    <Button
                        className="w-full"
                        onClick={() => onInstall(meta.name)}
                        disabled={loading}
                    >
                        {loading ? "Installing..." : "Install Plugin"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
