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
import { Check, CheckCircle2, Copy, KeyRound, Loader2, ShieldAlert } from "lucide-react";
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
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setCategory("");
      setError(null);
      setProjectToken(null);
      setSdkConfig(null);
      setCreated(false);
      setCopiedToken(false);
      setCopiedSnippet(false);
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

  const copyProjectToken = async () => {
    if (!projectToken) return;
    await copyText(projectToken);
    setCopiedToken(true);
    window.setTimeout(() => setCopiedToken(false), 1800);
  };

  const sdkSnippet = sdkConfig
    ? `import { NexusForgeAuth } from '@nexus-forge-sdk/auth';\n\nconst auth = new NexusForgeAuth({\n  baseUrl: '${sdkConfig.baseUrl}',\n  projectId: '${sdkConfig.projectId}',\n});`
    : "";

  const copySdkSnippet = async () => {
    if (!sdkSnippet) return;
    await copyText(sdkSnippet);
    setCopiedSnippet(true);
    window.setTimeout(() => setCopiedSnippet(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={created ? "max-h-[88vh] overflow-y-auto sm:max-w-2xl" : "sm:max-w-md"}>
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
          <div className="mt-3 space-y-4">
            <div className="flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Project created successfully
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Your project workspace is ready. Save the project token before moving on to Mission Control.
                </p>
              </div>
            </div>

            {projectToken && (
              <Card className="overflow-hidden border-cyan-400/25 bg-cyan-400/[0.04]">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                        <KeyRound className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">Project token</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          This credential is shown only once. Store it securely before leaving this screen.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() => void copyProjectToken()}
                    >
                      {copiedToken ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiedToken ? "Copied" : "Copy token"}
                    </Button>
                  </div>

                  <div className="rounded-lg border border-white/[0.08] bg-black/25 p-3">
                    <code className="block overflow-x-auto whitespace-nowrap pb-1 font-mono text-xs leading-6 text-foreground/90">
                      {projectToken}
                    </code>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                    <p className="text-xs leading-relaxed text-amber-100/75">
                      Treat this token like a password. Do not commit it to Git, place it in screenshots, or expose it in client-side code.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {sdkConfig && (
              <Card className="overflow-hidden border-border bg-card">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">SDK quickstart</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Use this starter configuration when wiring the Nexus Forge Auth SDK into your application.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() => void copySdkSnippet()}
                    >
                      {copiedSnippet ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiedSnippet ? "Copied" : "Copy snippet"}
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-black/25">
                    <div className="border-b border-white/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      TypeScript
                    </div>
                    <pre className="overflow-x-auto p-3 font-mono text-xs leading-6 text-foreground/90">
                      <code>{sdkSnippet}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                className="sm:min-w-52"
                onClick={() => handleDialogOpenChange(false)}
              >
                Continue to Mission Control
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
