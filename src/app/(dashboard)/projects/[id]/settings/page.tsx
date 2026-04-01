"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, ShieldCheck, ArrowRight, Users, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProjectService from "@/services/ProjectService";
import X402Service, { type X402Config } from "@/services/X402Service";
import { useProjectStore } from "@/store/projectStore";

export default function ProjectSettingsPage() {
    const router = useRouter();
    const activeProject = useProjectStore((s) => s.activeProject);
    const setActiveProject = useProjectStore((s) => s.setActiveProject);
    const [name, setName] = useState(activeProject?.name || "");
    const [origins, setOrigins] = useState<string[]>([]);
    const [newOrigin, setNewOrigin] = useState("");

    // UI States
    const [saving, setSaving] = useState(false);
    const [savingCors, setSavingCors] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [corsMessage, setCorsMessage] = useState<string | null>(null);

    // x402 config state
    const [x402Config, setX402Config] = useState<X402Config | null>(null);
    const [x402Enabled, setX402Enabled] = useState(false);
    const [x402WalletAddress, setX402WalletAddress] = useState("");
    const [x402Amount, setX402Amount] = useState("");
    const [x402Chain, setX402Chain] = useState("ethereum");
    const [savingX402, setSavingX402] = useState(false);
    const [x402Message, setX402Message] = useState<string | null>(null);

    // Fetch existing CORS settings on load
    useEffect(() => {
        if (!activeProject) return;
        ProjectService.getById(activeProject.id).then((res) => {
            if (res.config?.settings?.allowedOrigins) {
                setOrigins(res.config.settings.allowedOrigins);
            }
        });
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
            <Card className="card-hover animate-in-up">
                <CardHeader>
                    <CardTitle className="font-display tracking-tight">General</CardTitle>
                    <CardDescription>Update your project name and details.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            <Separator />

            {/* CORS settings */}
            <Card className="card-hover animate-in-up stagger-2">
                <CardHeader>
                    <CardTitle className="font-display tracking-tight">API Access (CORS)</CardTitle>
                    <CardDescription>
                        Specify which external domains can call the API using this project's keys.
                        Use <code>*</code> to allow all domains (not recommended for production).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>

            <Separator />

            {/* x402 Payment Config */}
            <Card className="card-hover animate-in-up stagger-4">
                <CardHeader>
                    <CardTitle className="font-display tracking-tight">Payment Enforcement (x402)</CardTitle>
                    <CardDescription>
                        Configure HTTP 402 on-chain payment requirements for your API endpoints.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>

            <Separator />

            {/* Advanced Configuration */}
            <Card className="card-hover animate-in-up stagger-5">
                <CardHeader>
                    <CardTitle className="font-display tracking-tight">Advanced Configuration</CardTitle>
                    <CardDescription>
                        Manage database connections, compliance settings, and other advanced configurations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
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
                </CardContent>
            </Card>

            <Separator />

            {/* Danger zone */}
            <Card className="border-destructive/30 animate-in-up stagger-6">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Archiving a project will disable all API access. You can restore it later.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? "Archiving..." : "Archive Project"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
