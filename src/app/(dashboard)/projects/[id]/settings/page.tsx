"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, ShieldCheck, ArrowRight, Users, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import ProjectService, { type IntegrationConfig } from "@/services/ProjectService";
import X402Service, { type X402Config } from "@/services/X402Service";
import { useProjectStore } from "@/store/projectStore";

const LOGIC_LIMIT_MIN = 5;
const LOGIC_LIMIT_MAX = 1000;

export default function ProjectSettingsPage() {
    const router = useRouter();
    const activeProject = useProjectStore((s) => s.activeProject);
    const setActiveProject = useProjectStore((s) => s.setActiveProject);
    const [name, setName] = useState(activeProject?.name || "");
    const [origins, setOrigins] = useState<string[]>([]);
    const [newOrigin, setNewOrigin] = useState("");
    const [projectSettings, setProjectSettings] = useState<Record<string, any>>({});

    // UI States
    const [saving, setSaving] = useState(false);
    const [savingCors, setSavingCors] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [corsMessage, setCorsMessage] = useState<string | null>(null);
    const [savingLogicLimits, setSavingLogicLimits] = useState(false);
    const [logicLimitsMessage, setLogicLimitsMessage] = useState<string | null>(null);

    const [logicWebhookLimit, setLogicWebhookLimit] = useState("120");
    const [logicGetLimit, setLogicGetLimit] = useState("180");
    const [logicPostLimit, setLogicPostLimit] = useState("60");
    const [logicPatchLimit, setLogicPatchLimit] = useState("30");
    const [logicDeleteLimit, setLogicDeleteLimit] = useState("20");

    // x402 config state
        // OAuth credentials state
        const [googleClientId, setGoogleClientId] = useState("");
        const [googleClientSecret, setGoogleClientSecret] = useState("");
        const [githubClientId, setGithubClientId] = useState("");
        const [githubClientSecret, setGithubClientSecret] = useState("");
        const [savingOAuth, setSavingOAuth] = useState(false);
        const [oauthMessage, setOAuthMessage] = useState<string | null>(null);

        // x402 config state
    const [x402Config, setX402Config] = useState<X402Config | null>(null);
    const [x402Enabled, setX402Enabled] = useState(false);
    const [x402WalletAddress, setX402WalletAddress] = useState("");
    const [x402Amount, setX402Amount] = useState("");
    const [x402Chain, setX402Chain] = useState("ethereum");
    const [savingX402, setSavingX402] = useState(false);
    const [x402Message, setX402Message] = useState<string | null>(null);

    // Integration config state
    const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig | null>(null);
    const [integrationLoading, setIntegrationLoading] = useState(false);

    // Fetch existing CORS settings on load
    useEffect(() => {
        if (!activeProject) return;
        ProjectService.getById(activeProject.id).then((res) => {
            setProjectSettings(res.config?.settings || {});
            if (res.config?.settings?.allowedOrigins) {
                setOrigins(res.config.settings.allowedOrigins);
            }

            const logicModules = res.config?.settings?.rateLimit?.logicModules;
            const crud = logicModules?.crud;
            if (typeof logicModules?.webhookPerMinute === "number") {
                setLogicWebhookLimit(String(logicModules.webhookPerMinute));
            }
            if (typeof crud?.getPerMinute === "number") {
                setLogicGetLimit(String(crud.getPerMinute));
            }
            if (typeof crud?.postPerMinute === "number") {
                setLogicPostLimit(String(crud.postPerMinute));
            }
            if (typeof crud?.patchPerMinute === "number") {
                setLogicPatchLimit(String(crud.patchPerMinute));
            }
            if (typeof crud?.deletePerMinute === "number") {
                setLogicDeleteLimit(String(crud.deletePerMinute));
            }
        });
        ProjectService.getOAuth(activeProject.id).then((cfg) => {
            setGoogleClientId(cfg.googleClientId ?? "");
            setGithubClientId(cfg.githubClientId ?? "");
            // secrets are redacted server-side; leave fields blank so user re-enters only when updating
        }).catch(() => { });
        // Fetch x402 config
        X402Service.getConfig(activeProject.id).then((cfg) => {
            if (cfg) {
                setX402Config(cfg);
                setX402Enabled(cfg.enabled);
                setX402WalletAddress(cfg.walletAddress || "");
                setX402Amount(cfg.amount || "");
                setX402Chain(cfg.chain || "ethereum");
            }
        }).catch(() => { });
        setIntegrationLoading(true);
        ProjectService.getIntegrationConfig(activeProject.id)
            .then(setIntegrationConfig)
            .catch(() => { })
            .finally(() => setIntegrationLoading(false));
    }, [activeProject]);

    if (!activeProject) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const updated = await ProjectService.update(activeProject.id, { name: name.trim() });
            setActiveProject({ ...activeProject, ...updated });
            setMessage("Project updated successfully.");
        } catch {
            setMessage("Failed to update project.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddOrigin = () => {
        if (!newOrigin) return;
        let formattedOrigin = newOrigin.trim();
        if (formattedOrigin !== "*" && !formattedOrigin.startsWith("http")) {
            formattedOrigin = `https://${formattedOrigin}`;
        }
        if (!origins.includes(formattedOrigin)) {
            setOrigins([...origins, formattedOrigin]);
        }
        setNewOrigin("");
    };

    const handleRemoveOrigin = (o: string) => {
        setOrigins(origins.filter((origin) => origin !== o));
    };

    const handleSaveCors = async () => {
        setSavingCors(true);
        setCorsMessage(null);
        try {
            await ProjectService.updateCors(activeProject.id, origins);
            setCorsMessage("CORS origins updated successfully.");
        } catch {
            setCorsMessage("Failed to update CORS origins.");
        } finally {
            setSavingCors(false);
        }
    };

    const handleSaveLogicLimits = async () => {
        const fields = [
            { name: "Webhook", value: logicWebhookLimit },
            { name: "CRUD GET", value: logicGetLimit },
            { name: "CRUD POST", value: logicPostLimit },
            { name: "CRUD PATCH", value: logicPatchLimit },
            { name: "CRUD DELETE", value: logicDeleteLimit },
        ];

        const parsed: Record<string, number> = {};
        for (const field of fields) {
            const value = Number(field.value);
            if (!Number.isInteger(value)) {
                setLogicLimitsMessage(`${field.name} must be an integer.`);
                return;
            }
            if (value < LOGIC_LIMIT_MIN || value > LOGIC_LIMIT_MAX) {
                setLogicLimitsMessage(`${field.name} must be between ${LOGIC_LIMIT_MIN} and ${LOGIC_LIMIT_MAX}.`);
                return;
            }
            parsed[field.name] = value;
        }

        setSavingLogicLimits(true);
        setLogicLimitsMessage(null);
        try {
            const nextSettings = {
                ...projectSettings,
                rateLimit: {
                    ...(projectSettings?.rateLimit || {}),
                    logicModules: {
                        ...((projectSettings?.rateLimit?.logicModules as Record<string, unknown>) || {}),
                        webhookPerMinute: parsed["Webhook"],
                        crud: {
                            ...((projectSettings?.rateLimit?.logicModules?.crud as Record<string, unknown>) || {}),
                            getPerMinute: parsed["CRUD GET"],
                            postPerMinute: parsed["CRUD POST"],
                            patchPerMinute: parsed["CRUD PATCH"],
                            deletePerMinute: parsed["CRUD DELETE"],
                        },
                    },
                },
            };

            await ProjectService.updateConfig(activeProject.id, { settings: nextSettings });
            setProjectSettings(nextSettings);
            setLogicLimitsMessage("Logic Modules rate limits saved.");
        } catch {
            setLogicLimitsMessage("Failed to save Logic Modules rate limits.");
        } finally {
            setSavingLogicLimits(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to archive this project? This action can be undone later.")) return;
        setDeleting(true);
        try {
            await ProjectService.delete(activeProject.id);
            router.push("/projects");
        } catch {
            setMessage("Failed to archive project.");
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* General settings */}
            <section className="animate-in-up">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-4">General</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    {message && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                            {message}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="settingsName">Project Name</Label>
                        <Input
                            id="settingsName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </section>

            <Separator />

            {/* CORS settings */}
            <section className="animate-in-up stagger-2">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-4">API Access (CORS)</h2>
                <div className="space-y-4">
                    {corsMessage && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                            {corsMessage}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://my-startup.com"
                            value={newOrigin}
                            onChange={(e) => setNewOrigin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
                        />
                        <Button variant="secondary" onClick={handleAddOrigin}>Add</Button>
                    </div>

                    {origins.length > 0 ? (
                        <div className="space-y-2 mt-4">
                            {origins.map((o) => (
                                <div key={o} className="flex justify-between items-center p-2 rounded-md bg-muted/50 border">
                                    <span className="text-sm font-mono">{o}</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveOrigin(o)} className="text-destructive h-8 px-2">
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-4">No custom origins added. Only your backend dashboard and server-to-server requests are allowed.</p>
                    )}

                    <Button className="mt-4" onClick={handleSaveCors} disabled={savingCors}>
                        {savingCors ? "Saving..." : "Save CORS Settings"}
                    </Button>
                </div>
            </section>

            <Separator />

            <section className="animate-in-up stagger-3">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-1">Logic Modules Rate Limits</h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Configure method-specific limits for public Logic Module invocation. Values are requests per minute.
                </p>
                <div className="space-y-4">
                    {logicLimitsMessage && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                            {logicLimitsMessage}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="logicWebhookLimit">Webhook</Label>
                            <Input id="logicWebhookLimit" type="number" min={LOGIC_LIMIT_MIN} max={LOGIC_LIMIT_MAX} value={logicWebhookLimit} onChange={(e) => setLogicWebhookLimit(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logicGetLimit">CRUD GET</Label>
                            <Input id="logicGetLimit" type="number" min={LOGIC_LIMIT_MIN} max={LOGIC_LIMIT_MAX} value={logicGetLimit} onChange={(e) => setLogicGetLimit(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logicPostLimit">CRUD POST</Label>
                            <Input id="logicPostLimit" type="number" min={LOGIC_LIMIT_MIN} max={LOGIC_LIMIT_MAX} value={logicPostLimit} onChange={(e) => setLogicPostLimit(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logicPatchLimit">CRUD PATCH</Label>
                            <Input id="logicPatchLimit" type="number" min={LOGIC_LIMIT_MIN} max={LOGIC_LIMIT_MAX} value={logicPatchLimit} onChange={(e) => setLogicPatchLimit(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logicDeleteLimit">CRUD DELETE</Label>
                            <Input id="logicDeleteLimit" type="number" min={LOGIC_LIMIT_MIN} max={LOGIC_LIMIT_MAX} value={logicDeleteLimit} onChange={(e) => setLogicDeleteLimit(e.target.value)} />
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Allowed range: {LOGIC_LIMIT_MIN} to {LOGIC_LIMIT_MAX}. Recommended: keep write/delete limits lower than reads.
                    </p>

                    <Button onClick={handleSaveLogicLimits} disabled={savingLogicLimits}>
                        {savingLogicLimits ? "Saving..." : "Save Logic Modules Limits"}
                    </Button>
                </div>
            </section>

            <Separator />

            {/* x402 Payment Config */}
            {/* OAuth Credentials */}
            <section className="animate-in-up stagger-4">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-1">OAuth Credentials</h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Provide your own Google / GitHub OAuth app credentials so the login consent screen shows your project&apos;s branding.
                    Leave a secret field blank to keep the existing secret.
                </p>
                <div className="space-y-4">
                    {oauthMessage && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                            {oauthMessage}
                        </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="googleClientId">Google Client ID</Label>
                            <Input
                                id="googleClientId"
                                placeholder="xxxxxx.apps.googleusercontent.com"
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                            <Input
                                id="googleClientSecret"
                                type="password"
                                placeholder={googleClientId ? "Leave blank to keep existing" : "GOCSPX-…"}
                                value={googleClientSecret}
                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="githubClientId">GitHub Client ID</Label>
                            <Input
                                id="githubClientId"
                                placeholder="Iv1.…"
                                value={githubClientId}
                                onChange={(e) => setGithubClientId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="githubClientSecret">GitHub Client Secret</Label>
                            <Input
                                id="githubClientSecret"
                                type="password"
                                placeholder={githubClientId ? "Leave blank to keep existing" : "ghp_…"}
                                value={githubClientSecret}
                                onChange={(e) => setGithubClientSecret(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={async () => {
                            setSavingOAuth(true);
                            setOAuthMessage(null);
                            try {
                                const payload: Record<string, string | null> = {};
                                if (googleClientId !== undefined) payload.googleClientId = googleClientId || null;
                                if (googleClientSecret) payload.googleClientSecret = googleClientSecret;
                                if (githubClientId !== undefined) payload.githubClientId = githubClientId || null;
                                if (githubClientSecret) payload.githubClientSecret = githubClientSecret;
                                await ProjectService.updateOAuth(activeProject.id, payload);
                                setGoogleClientSecret("");
                                setGithubClientSecret("");
                                setOAuthMessage("OAuth credentials saved.");
                            } catch {
                                setOAuthMessage("Failed to save OAuth credentials.");
                            } finally {
                                setSavingOAuth(false);
                            }
                        }}
                        disabled={savingOAuth}
                    >
                        {savingOAuth ? "Saving..." : "Save OAuth Credentials"}
                    </Button>
                </div>
            </section>

            <Separator />

            {/* x402 Payment Config */}
            <section className="animate-in-up stagger-4">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-4">Payment Enforcement (x402)</h2>
                <div className="space-y-4">
                    {x402Message && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                            {x402Message}
                        </div>
                    )}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div>
                            <Label>Enable x402 Payments</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                When enabled, API calls require on-chain payment verification.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={x402Enabled}
                            onClick={() => setX402Enabled(!x402Enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${x402Enabled ? "bg-primary" : "bg-muted"
                                }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${x402Enabled ? "translate-x-6" : "translate-x-1"
                                }`} />
                        </button>
                    </div>
                    {x402Enabled && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Wallet Address</Label>
                                <Input
                                    placeholder="0x..."
                                    value={x402WalletAddress}
                                    onChange={(e) => setX402WalletAddress(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        placeholder="0.01"
                                        value={x402Amount}
                                        onChange={(e) => setX402Amount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Chain</Label>
                                    <Input
                                        placeholder="ethereum"
                                        value={x402Chain}
                                        onChange={(e) => setX402Chain(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <Button
                        onClick={async () => {
                            setSavingX402(true);
                            setX402Message(null);
                            try {
                                await X402Service.updateConfig(activeProject.id, {
                                    enabled: x402Enabled,
                                    walletAddress: x402WalletAddress || undefined,
                                    amount: x402Amount || undefined,
                                    chain: x402Chain || undefined,
                                });
                                setX402Message("x402 configuration saved.");
                            } catch {
                                setX402Message("Failed to save x402 configuration.");
                            } finally {
                                setSavingX402(false);
                            }
                        }}
                        disabled={savingX402}
                    >
                        {savingX402 ? "Saving..." : "Save x402 Config"}
                    </Button>
                </div>
            </section>

            <Separator />

            {/* Integration & SDK */}
            <section className="animate-in-up stagger-5">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-1">Integration &amp; SDK</h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Use these details to initialise the <code className="text-xs bg-muted px-1 rounded">@nexus-forge-sdk/auth</code> SDK in your application.
                </p>
                {integrationLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : integrationConfig ? (
                    <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Base URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={integrationConfig.sdkConfig.baseUrl} className="font-mono text-xs" />
                                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(integrationConfig.sdkConfig.baseUrl)}>Copy</Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Project ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={integrationConfig.sdkConfig.projectId} className="font-mono text-xs" />
                                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(integrationConfig.sdkConfig.projectId)}>Copy</Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Initialisation Snippet</Label>
                            <div className="relative">
                                <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre">{`import { NexusForgeAuth } from '@nexus-forge-sdk/auth';

const auth = new NexusForgeAuth({
  baseUrl: '${integrationConfig.sdkConfig.baseUrl}',
  projectId: '${integrationConfig.sdkConfig.projectId}',
});`}</pre>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2 text-xs"
                                    onClick={() => navigator.clipboard.writeText(
                                        `import { NexusForgeAuth } from '@nexus-forge-sdk/auth';\n\nconst auth = new NexusForgeAuth({\n  baseUrl: '${integrationConfig.sdkConfig.baseUrl}',\n  projectId: '${integrationConfig.sdkConfig.projectId}',\n});`
                                    )}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Could not load integration config.</p>
                )}
            </section>

            <Separator />

            {/* Advanced Configuration */}
            <div>
                <h3 className="font-display tracking-tight font-semibold mb-4">Advanced Configuration</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link href={`/projects/${activeProject.id}/settings/database`} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="shrink-0 p-2 rounded-md bg-primary/10 text-primary">
                            <Database className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium flex items-center gap-2">Database <ArrowRight className="w-4 h-4 text-muted-foreground" /></p>
                            <p className="text-sm text-muted-foreground">Configure connection credentials and pools.</p>
                        </div>
                    </Link>
                    <Link href={`/projects/${activeProject.id}/settings/compliance`} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="shrink-0 p-2 rounded-md bg-emerald-500/10 text-emerald-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium flex items-center gap-2">Compliance <ArrowRight className="w-4 h-4 text-muted-foreground" /></p>
                            <p className="text-sm text-muted-foreground">Manage GDPR, HIPAA, and data residency.</p>
                        </div>
                    </Link>
                    <Link href={`/projects/${activeProject.id}/settings/members`} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="shrink-0 p-2 rounded-md bg-blue-500/10 text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium flex items-center gap-2">Members <ArrowRight className="w-4 h-4 text-muted-foreground" /></p>
                            <p className="text-sm text-muted-foreground">Manage team members and access roles.</p>
                        </div>
                    </Link>
                    <Link href={`/projects/${activeProject.id}/settings/modules`} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="shrink-0 p-2 rounded-md bg-amber-500/10 text-amber-500">
                            <Blocks className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium flex items-center gap-2">Modules <ArrowRight className="w-4 h-4 text-muted-foreground" /></p>
                            <p className="text-sm text-muted-foreground">Enable or disable core API modules.</p>
                        </div>
                    </Link>
                </div>
            </div>

            <Separator />

            {/* Danger zone */}
            <section className="animate-in-up stagger-6">
                <p className="text-sm font-medium text-destructive mb-3">Danger Zone</p>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? "Archiving..." : "Archive Project"}
                </Button>
            </section>
        </div>
    );
}
