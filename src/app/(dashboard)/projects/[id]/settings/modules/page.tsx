"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ModuleService, { type ModuleInfo } from "@/services/ModuleService";

export default function ModulesSettingsPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;

    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    const [message, setMessage] = useState<string | null>(null);

    const fetchModules = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await ModuleService.list(projectId);
            setModules(data);
        } catch {
            setMessage("Failed to load modules.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    const handleToggle = async (moduleId: string, currentEnabled: boolean) => {
        if (!projectId) return;
        setToggling((prev) => ({ ...prev, [moduleId]: true }));
        setMessage(null);
        try {
            await ModuleService.toggle(projectId, moduleId, !currentEnabled);
            setModules((prev) =>
                prev.map((m) =>
                    m.moduleId === moduleId ? { ...m, enabled: !currentEnabled } : m,
                ),
            );
        } catch {
            setMessage(`Failed to ${currentEnabled ? "disable" : "enable"} module.`);
        } finally {
            setToggling((prev) => ({ ...prev, [moduleId]: false }));
        }
    };

    if (!projectId) return null;

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Link
                    href={`/projects/${projectId}/settings`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight">Modules</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enable or disable core API modules for this project. Changes take effect on next deploy.
                    </p>
                </div>
            </div>

            {message && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {message}
                </div>
            )}

            <Card className="card-hover animate-in-up">
                <CardHeader>
                    <CardTitle className="font-display tracking-tight">Available Modules</CardTitle>
                    <CardDescription>
                        Modules provide core API capabilities exposed through the project gateway.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                              <div
                                  key={i}
                                  className="h-16 rounded-lg bg-muted/50 animate-pulse"
                              />
                          ))
                        : modules.map((mod) => (
                              <div
                                  key={mod.moduleId}
                                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                              >
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                          <p className="font-medium">{mod.label}</p>
                                          {mod.alwaysEnabled && (
                                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                  <Lock className="w-3 h-3" />
                                                  Required
                                              </span>
                                          )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                          {mod.description}
                                      </p>
                                  </div>
                                  <button
                                      type="button"
                                      role="switch"
                                      aria-checked={mod.enabled}
                                      disabled={mod.alwaysEnabled || toggling[mod.moduleId]}
                                      onClick={() => handleToggle(mod.moduleId, mod.enabled)}
                                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                                          mod.alwaysEnabled
                                              ? "bg-primary/50 cursor-not-allowed"
                                              : mod.enabled
                                              ? "bg-primary cursor-pointer"
                                              : "bg-muted cursor-pointer"
                                      }`}
                                  >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              mod.enabled ? "translate-x-6" : "translate-x-1"
                                          }`}
                                      />
                                  </button>
                              </div>
                          ))}
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
                Note: Required modules (Auth, API Keys, Compliance) cannot be disabled. Module changes
                will be reflected in your next deployment.
            </p>
        </div>
    );
}
