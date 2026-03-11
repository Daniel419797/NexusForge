"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InstalledPlugin } from "@/services/PluginService";

interface ConfigPanelProps {
    plugin: InstalledPlugin | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (pluginName: string, config: any) => Promise<void>;
}

export default function ConfigPanel({ plugin, open, onOpenChange, onSave }: ConfigPanelProps) {
    const [configStr, setConfigStr] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (plugin && open) {
            setConfigStr(JSON.stringify(plugin.config || {}, null, 2));
            setError("");
        }
    }, [plugin, open]);

    const handleSave = async () => {
        if (!plugin) return;
        try {
            const parsed = JSON.parse(configStr);
            setSaving(true);
            setError("");
            await onSave(plugin.name, parsed);
            onOpenChange(false);
        } catch (e: any) {
            setError("Invalid JSON format");
        } finally {
            setSaving(false);
        }
    };

    if (!plugin) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Configure {plugin.name}</DialogTitle>
                    <DialogDescription>
                        Update the JSON configuration for this plugin.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Configuration (JSON)</Label>
                        <Textarea
                            className="font-mono text-sm min-h-[300px]"
                            value={configStr}
                            onChange={(e) => {
                                setConfigStr(e.target.value);
                                setError("");
                            }}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !!error}>
                        {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
