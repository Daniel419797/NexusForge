"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";

export default function ProjectDatabaseSettingsPage() {
    const router = useRouter();
    const activeProject = useProjectStore((s) => s.activeProject);
    const [dbType, setDbType] = useState<string>("postgresql");
    const [dbUrl, setDbUrl] = useState<string>("");
    const [sslMode, setSslMode] = useState<string>("disable");
    const [poolSize, setPoolSize] = useState<number>(10);
    const [schemaName, setSchemaName] = useState<string>("public");
    const [tenantOwnedAuth, setTenantOwnedAuth] = useState<boolean>(false);
    const [jwtSecret, setJwtSecret] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Migration state
    const [migrationRunning, setMigrationRunning] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
    const migrationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // DB URL rotation state
    const [rotating, setRotating] = useState(false);
    const [rotateMessage, setRotateMessage] = useState<string | null>(null);

    // User migration state
    const [migratingUsers, setMigratingUsers] = useState(false);
    const [userMigrationStatus, setUserMigrationStatus] = useState<string | null>(null);
    const userMigrationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup polling intervals on unmount
    useEffect(() => {
        return () => {
            if (migrationPollRef.current) clearInterval(migrationPollRef.current);
            if (userMigrationPollRef.current) clearInterval(userMigrationPollRef.current);
        };
    }, []);

    const dbPlaceholders: Record<string, string> = {
        postgresql: "postgres://user:pass@host:5432/db",
        mysql: "mysql://user:pass@host:3306/db",
        sqlite: "/path/to/database.sqlite",
        mongodb: "mongodb://user:pass@host:27017/db",
    };

    const currentPlaceholder = dbUrl || dbPlaceholders[dbType] || "";

    useEffect(() => {
        if (!activeProject) return;
        let mounted = true;
        ProjectService.getById(activeProject.id)
            .then((res) => {
                if (!mounted) return;
                const cfg = res.config;
                if (cfg) {
                    setDbType(cfg.dbType || "postgresql");
                    // Fetch DB URL via secure backend API (may be redacted or require permissions)
                    ProjectService.getDbUrl(activeProject.id).then((r) => {
                        if (!mounted) return;
                        setDbUrl(r.dbUrl || "");
                    }).catch(() => {
                        // ignore if not permitted to view DB URL
                        setDbUrl("");
                    });
                    setSettingsFromConfig(cfg.settings || {});
                }
            })
            .catch(() => { })
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, [activeProject]);

    if (!activeProject) return null;

    function setSettingsFromConfig(settings: Record<string, any>) {
        setSslMode(settings.sslMode || "disable");
        setPoolSize(settings.poolSize ?? 10);
        setSchemaName(settings.schemaName || "public");
        setTenantOwnedAuth(settings.tenantOwnedAuth === true);
        setJwtSecret(settings.jwtSecret || "");
    }

    function buildSettings(): Record<string, any> {
        const s: Record<string, any> = {
            sslMode,
            poolSize,
            schemaName,
            tenantOwnedAuth,
        };
        if (tenantOwnedAuth && jwtSecret.trim()) {
            s.jwtSecret = jwtSecret.trim();
        }
        return s;
    }

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updated = await ProjectService.updateConfig(activeProject.id, {
                dbType,
                dbUrl,
                settings: buildSettings(),
            });
            // update store
            const setActive = useProjectStore.getState().setActiveProject;
            const current = useProjectStore.getState().activeProject;
            if (current && current.id === activeProject.id) {
                setActive({ ...current, config: updated });
            }
            setMessage("Saved successfully.");
        } catch (e) {
            setMessage("Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>Database</CardTitle>
                    <CardDescription>Connect and configure your project&apos;s database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && <div className="p-2 rounded bg-primary/10 text-primary">{message}</div>}
                    <div>
                        <Label>DB Type</Label>
                        <Select value={dbType} onValueChange={(v) => setDbType(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                                <SelectItem value="mongodb">MongoDB</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Database URL</Label>
                        <Input value={dbUrl} onChange={(e: any) => setDbUrl(e.target.value)} placeholder={currentPlaceholder} />
                    </div>

                    <div>
                        <Label>SSL Mode</Label>
                        <Select value={sslMode} onValueChange={(v) => setSslMode(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="disable">Disable</SelectItem>
                                <SelectItem value="prefer">Prefer</SelectItem>
                                <SelectItem value="require">Require</SelectItem>
                                <SelectItem value="verify-ca">Verify CA</SelectItem>
                                <SelectItem value="verify-full">Verify Full</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Connection Pool Size</Label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={poolSize}
                            onChange={(e: any) => setPoolSize(parseInt(e.target.value) || 10)}
                        />
                    </div>

                    <div>
                        <Label>Schema Name</Label>
                        <Input
                            value={schemaName}
                            onChange={(e: any) => setSchemaName(e.target.value)}
                            placeholder="public"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label>Tenant-Owned Auth</Label>
                                {tenantOwnedAuth && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Active</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Store auth tables (users, refresh tokens, audit logs) in this project&apos;s database instead of the platform DB.
                                End-user credentials never leave your database.
                            </p>
                        </div>
                        <Switch checked={tenantOwnedAuth} onCheckedChange={setTenantOwnedAuth} />
                    </div>

                    {tenantOwnedAuth && (
                        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <div>
                                <Label>JWT Signing Secret</Label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Optional. Provide a custom secret (min 16 chars) to sign tenant JWTs independently of the platform.
                                    If left blank, the platform secret is used.
                                </p>
                                <Input
                                    type="password"
                                    value={jwtSecret}
                                    onChange={(e: any) => setJwtSecret(e.target.value)}
                                    placeholder="your-secret-key-min-16-chars"
                                    minLength={16}
                                />
                                {jwtSecret.length > 0 && jwtSecret.length < 16 && (
                                    <p className="text-xs text-destructive mt-1">Secret must be at least 16 characters.</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-xs font-medium">What gets stored in your database</Label>
                                <div className="mt-1.5 grid grid-cols-3 gap-2">
                                    {["users", "refresh_tokens", "audit_logs"].map((table) => (
                                        <div key={table} className="rounded-md bg-background/60 border px-2.5 py-1.5 text-center">
                                            <code className="text-[11px] font-mono text-muted-foreground">{table}</code>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                    These tables are auto-created on first auth request. Lockout keys are project-scoped in Redis.
                                </p>
                            </div>

                            <div>
                                <Label className="text-xs font-medium">Security features</Label>
                                <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                                    <li>Per-project JWT signing (access + refresh tokens scoped to this project)</li>
                                    <li>Project-scoped account lockout (cross-tenant poisoning prevented)</li>
                                    <li>Tenant-aware email verification (verification tokens route to your DB)</li>
                                    <li>Audit logs written directly to your database</li>
                                    <li>Refresh token rotation with reuse detection</li>
                                </ul>
                            </div>

                            <div>
                                <Label className="text-xs font-medium">Gateway auth endpoints</Label>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Your end-users authenticate via the project gateway:
                                </p>
                                <div className="mt-1.5 space-y-1">
                                    {[
                                        { method: "POST", path: "auth/register" },
                                        { method: "POST", path: "auth/login" },
                                        { method: "POST", path: "auth/refresh" },
                                        { method: "POST", path: "auth/logout" },
                                        { method: "GET",  path: "auth/me" },
                                        { method: "POST", path: "auth/verify-email" },
                                    ].map(({ method, path }) => (
                                        <code key={path} className="block text-[10px] font-mono text-muted-foreground">
                                            <span className={method === "GET" ? "text-emerald-400" : "text-amber-400"}>{method}</span>{" "}
                                            /api/v1/p/{activeProject.id}/{path}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                        <Button variant="ghost" onClick={() => router.push(`/projects/${activeProject.id}/settings`)}>Back</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Run Migrations */}
            <Card>
                <CardHeader>
                    <CardTitle>Run Migrations</CardTitle>
                    <CardDescription>Apply pending schema migrations to the project database. Migrations are managed server-side and run in order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {migrationStatus && (
                        <div className={`p-2 rounded text-sm ${migrationStatus.startsWith("failed") ? "bg-destructive/10 text-destructive" : migrationStatus === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"}`}>
                            {migrationStatus}
                        </div>
                    )}
                    <Button
                        onClick={async () => {
                            setMigrationRunning(true);
                            setMigrationStatus("starting...");
                            try {
                                const { jobId } = await ProjectService.runMigrations(activeProject.id);
                                setMigrationStatus(`running (job ${jobId})`);
                                migrationPollRef.current = setInterval(async () => {
                                    try {
                                        const status = await ProjectService.getJobStatus(activeProject.id, jobId);
                                        if (status.state === "completed") {
                                            setMigrationStatus("completed");
                                            setMigrationRunning(false);
                                            if (migrationPollRef.current) clearInterval(migrationPollRef.current);
                                        } else if (status.state === "failed") {
                                            setMigrationStatus(`failed: ${status.failedReason || "unknown error"}`);
                                            setMigrationRunning(false);
                                            if (migrationPollRef.current) clearInterval(migrationPollRef.current);
                                        } else {
                                            setMigrationStatus(`${status.state}${status.progress != null ? ` (${status.progress}%)` : ""}`);
                                        }
                                    } catch {
                                        // keep polling
                                    }
                                }, 3000);
                            } catch {
                                setMigrationStatus("failed to start migration");
                                setMigrationRunning(false);
                            }
                        }}
                        disabled={migrationRunning}
                    >
                        {migrationRunning ? "Running..." : "Run Migrations"}
                    </Button>
                </CardContent>
            </Card>

            {/* DB URL Rotation */}
            <Card>
                <CardHeader>
                    <CardTitle>Rotate Database URL</CardTitle>
                    <CardDescription>Generate a new encrypted database connection URL. The old URL will be invalidated.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rotateMessage && (
                        <div className={`p-2 rounded text-sm ${rotateMessage.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}>
                            {rotateMessage}
                        </div>
                    )}
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            if (!confirm("Are you sure? The current database URL will be invalidated.")) return;
                            setRotating(true);
                            setRotateMessage(null);
                            try {
                                const { dbUrl: newUrl } = await ProjectService.rotateDbUrl(activeProject.id);
                                setDbUrl(newUrl);
                                setRotateMessage("Database URL rotated successfully.");
                            } catch {
                                setRotateMessage("Error: failed to rotate database URL.");
                            } finally {
                                setRotating(false);
                            }
                        }}
                        disabled={rotating}
                    >
                        {rotating ? "Rotating..." : "Rotate DB URL"}
                    </Button>
                </CardContent>
            </Card>

            {/* Migrate Users to Tenant DB */}
            <Card>
                <CardHeader>
                    <CardTitle>Migrate Users to Tenant Database</CardTitle>
                    <CardDescription>Migrate all project users into the tenant-specific database. Runs as a background job.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {userMigrationStatus && (
                        <div className={`p-2 rounded text-sm ${userMigrationStatus.startsWith("failed") ? "bg-destructive/10 text-destructive" : userMigrationStatus === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"}`}>
                            {userMigrationStatus}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (!confirm("This will migrate all users to the tenant database. Continue?")) return;
                            setMigratingUsers(true);
                            setUserMigrationStatus("starting...");
                            try {
                                const { jobId } = await ProjectService.migrateUsers(activeProject.id);
                                setUserMigrationStatus(`running (job ${jobId})`);
                                userMigrationPollRef.current = setInterval(async () => {
                                    try {
                                        const status = await ProjectService.getJobStatus(activeProject.id, jobId);
                                        if (status.state === "completed") {
                                            setUserMigrationStatus("completed");
                                            setMigratingUsers(false);
                                            if (userMigrationPollRef.current) clearInterval(userMigrationPollRef.current);
                                        } else if (status.state === "failed") {
                                            setUserMigrationStatus(`failed: ${status.failedReason || "unknown error"}`);
                                            setMigratingUsers(false);
                                            if (userMigrationPollRef.current) clearInterval(userMigrationPollRef.current);
                                        } else {
                                            setUserMigrationStatus(`${status.state}${status.progress != null ? ` (${status.progress}%)` : ""}`);
                                        }
                                    } catch {
                                        // keep polling
                                    }
                                }, 3000);
                            } catch {
                                setUserMigrationStatus("failed to start user migration");
                                setMigratingUsers(false);
                            }
                        }}
                        disabled={migratingUsers}
                    >
                        {migratingUsers ? "Migrating..." : "Migrate Users"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
