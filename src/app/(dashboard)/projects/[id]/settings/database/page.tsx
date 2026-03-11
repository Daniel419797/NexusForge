"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
    }

    function buildSettings(): Record<string, any> {
        return {
            sslMode,
            poolSize,
            schemaName,
            tenantOwnedAuth,
        };
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
                            <Label>Tenant-Owned Auth</Label>
                            <p className="text-xs text-muted-foreground">
                                Store auth tables (users, refresh tokens) in this project&apos;s database instead of the platform DB.
                            </p>
                        </div>
                        <Switch checked={tenantOwnedAuth} onCheckedChange={setTenantOwnedAuth} />
                    </div>

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
