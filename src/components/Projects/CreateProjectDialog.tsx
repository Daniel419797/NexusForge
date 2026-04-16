"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectStore } from "@/store/projectStore";
import { useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { SdkConfig } from "@/services/ProjectService";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

export default function CreateProjectDialog({
    open,
    onOpenChange,
    onCreated,
}: CreateProjectDialogProps) {
    const { templates, fetchTemplates } = useProjectStore();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectToken, setProjectToken] = useState<string | null>(null);
    const [sdkConfig, setSdkConfig] = useState<SdkConfig | null>(null);

    // Fetch templates when dialog opens
    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open, fetchTemplates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { default: ProjectService } = await import(
                "@/services/ProjectService"
            );
            const result = await ProjectService.create({ name: name.trim(), category });
            if (result?.projectToken) setProjectToken(result.projectToken);
            if (result?.integration?.sdkConfig) setSdkConfig(result.integration.sdkConfig);
            setName("");
            setCategory("");
            onOpenChange(false);
            onCreated();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(
                axiosErr.response?.data?.message || "Failed to create project."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Choose a name and category to get started.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input
                            id="projectName"
                            placeholder="My Awesome App"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Select Template</Label>

                        {templates.length === 0 ? (
                            <div className="flex justify-center items-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Loading templates...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                                {templates.map((tpl) => (
                                    <div
                                        key={tpl.category}
                                        onClick={() => setCategory(tpl.category)}
                                        className={`
                                            relative p-4 rounded-xl border cursor-pointer transition-all text-left
                                            hover:border-primary/50 hover:bg-primary/5
                                            ${category === tpl.category ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-sm text-foreground">{tpl.name}</h4>
                                            {category === tpl.category && (
                                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {tpl.description}
                                        </p>

                                        {/* Pluralize plugins vs empty */}
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {tpl.suggestedPlugins?.slice(0, 2).map((p) => (
                                                <span key={p} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground">
                                                    +{p}
                                                </span>
                                            ))}
                                            {tpl.suggestedPlugins?.length > 2 && (
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground">
                                                    +{tpl.suggestedPlugins.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>

                {/* Project token reveal banner (shown after creation) */}
                {projectToken && (
                    <div className="mt-4">
                        <Card className="border-primary/30 bg-primary/5">
                            <CardContent>
                                <p className="text-sm font-medium text-primary mb-2">🔐 Project Token Generated — store it securely.</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-2.5 rounded-lg bg-card border border-border text-sm font-mono break-all">
                                        {projectToken}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigator.clipboard.writeText(projectToken)}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setProjectToken(null)}>
                                    Dismiss
                                </Button>
                            </CardContent>
                        </Card>

                        {sdkConfig && (
                            <Card className="border-border bg-card mt-3">
                                <CardContent className="pt-4">
                                    <p className="text-sm font-medium mb-2">SDK Quickstart</p>
                                    <pre className="p-2.5 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`import { NexusForgeAuth } from '@nexusforge/auth';

const auth = new NexusForgeAuth({
  baseUrl: '${sdkConfig.baseUrl}',
  projectId: '${sdkConfig.projectId}',
});`}
                                    </pre>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 text-xs"
                                        onClick={() => navigator.clipboard.writeText(
                                            `import { NexusForgeAuth } from '@nexusforge/auth';\n\nconst auth = new NexusForgeAuth({\n  baseUrl: '${sdkConfig.baseUrl}',\n  projectId: '${sdkConfig.projectId}',\n});`
                                        )}
                                    >
                                        Copy Snippet
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
