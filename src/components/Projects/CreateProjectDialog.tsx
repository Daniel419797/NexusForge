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
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { copyText } from "@/lib/clipboard";
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
  const [created, setCreated] = useState(false);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setCategory("");
      setError(null);
      setProjectToken(null);
      setSdkConfig(null);
      setCreated(false);
    }
    onOpenChange(nextOpen);
  };

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
      const { default: ProjectService } =
        await import("@/services/ProjectService");
      const result = await ProjectService.create({
        name: name.trim(),
        category,
      });
      if (result?.projectToken) setProjectToken(result.projectToken);
      if (result?.integration?.sdkConfig)
        setSdkConfig(result.integration.sdkConfig);
      setName("");
      setCategory("");
      setCreated(true);
      onCreated();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {created ? "Project ready" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {created
              ? "Save the generated credential, then continue with the guided setup."
              : "Choose a name and category to get started."}
          </DialogDescription>
        </DialogHeader>

        {!created && (
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
                    <button
                      type="button"
                      key={tpl.category}
                      onClick={() => setCategory(tpl.category)}
                      aria-pressed={category === tpl.category}
                      className={`
                                            relative w-full p-4 rounded-xl border cursor-pointer transition-all text-left
                                            hover:border-primary/50 hover:bg-primary/5
                                            ${category === tpl.category ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border bg-card"}
                                        `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {tpl.name}
                        </h4>
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
                          <span
                            key={p}
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground"
                          >
                            +{p}
                          </span>
                        ))}
                        {tpl.suggestedPlugins?.length > 2 && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground">
                            +{tpl.suggestedPlugins.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {created && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Project created
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Your setup map is ready. Save the token before continuing.
                </p>
              </div>
            </div>

            {projectToken && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <KeyRound className="size-4" aria-hidden="true" />
                    Project token — shown once
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded-lg border border-border bg-card p-2.5 font-mono text-sm">
                      {projectToken}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyText(projectToken)}
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {sdkConfig && (
              <Card className="border-border bg-card">
                <CardContent className="pt-4">
                  <p className="mb-2 text-sm font-medium">SDK Quickstart</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-2.5 font-mono text-xs">
                    {`import { NexusForgeAuth } from '@nexus-forge-sdk/auth';

const auth = new NexusForgeAuth({
  baseUrl: '${sdkConfig.baseUrl}',
  projectId: '${sdkConfig.projectId}',
});`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() =>
                      void copyText(
                        `import { NexusForgeAuth } from '@nexus-forge-sdk/auth';\n\nconst auth = new NexusForgeAuth({\n  baseUrl: '${sdkConfig.baseUrl}',\n  projectId: '${sdkConfig.projectId}',\n});`,
                      )
                    }
                  >
                    Copy Snippet
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={() => handleDialogOpenChange(false)}
            >
              Continue to Mission Control
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
