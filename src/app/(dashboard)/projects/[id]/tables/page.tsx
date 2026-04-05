"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TableService, { type CustomTable, type FieldDefinition, type FieldType } from "@/services/TableService";
import { useProjectStore } from "@/store/projectStore";

// ── Types ─────────────────────────────────────────────────────────────────────

type DraftField = Omit<FieldDefinition, "defaultValue"> & { id: string };

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
    { value: "string", label: "Text" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date / Timestamp" },
    { value: "array", label: "Array (JSON)" },
    { value: "object", label: "Object (JSON)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSnakeCase(s: string) {
    return s
        .toLowerCase()
        .replaceAll(/\s+/g, "_")
        .replaceAll(/[^a-z0-9_]/g, "")
        .replace(/^(\d)/, "_$1");
}

function newField(): DraftField {
    return { id: crypto.randomUUID(), name: "", type: "string", required: false, unique: false };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MigrateButton({
    table,
    onMigrated,
}: Readonly<{ table: CustomTable; onMigrated: (ddl: string) => void }>) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const params = useParams<{ id: string }>();

    async function handleMigrate() {
        setLoading(true);
        setError(null);
        try {
            const result = await TableService.migrateTable(params.id, table.id);
            onMigrated(result.ddl);
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? ((err as Record<string, Record<string, Record<string, string>>>).response?.data?.message ?? "Migration failed")
                    : "Migration failed";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    let migrateLabel = "Run Migration";
    if (loading) migrateLabel = "Migrating\u2026";
    else if (table.migratedAt) migrateLabel = "Migrated \u2713";

    return (
        <div className="flex flex-col gap-1">
            <Button size="sm" onClick={handleMigrate} disabled={loading || !!table.migratedAt}>
                {migrateLabel}
            </Button>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

function DdlDialog({
    ddl,
    onClose,
}: Readonly<{ ddl: string | null; onClose: () => void }>) {
    return (
        <Dialog open={!!ddl} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Applied DDL</DialogTitle>
                </DialogHeader>
                <pre className="text-xs bg-zinc-900 rounded p-4 overflow-x-auto text-emerald-300">
                    {ddl}
                </pre>
            </DialogContent>
        </Dialog>
    );
}

function FieldRow({
    field,
    onChange,
    onRemove,
}: Readonly<{
    field: DraftField;
    onChange: (updated: DraftField) => void;
    onRemove: () => void;
}>) {
    return (
        <div className="grid grid-cols-[1fr_140px_auto_auto_auto] gap-2 items-center">
            <Input
                placeholder="field_name"
                value={field.name}
                onChange={(e) => onChange({ ...field, name: toSnakeCase(e.target.value) })}
            />
            <Select
                value={field.type}
                onValueChange={(v) => onChange({ ...field, type: v as FieldType })}
            >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
                <Switch
                    id={`req-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(v) => onChange({ ...field, required: v })}
                />
                <Label htmlFor={`req-${field.id}`} className="text-xs text-muted-foreground">Required</Label>
            </div>
            <div className="flex items-center gap-1.5">
                <Switch
                    id={`uniq-${field.id}`}
                    checked={field.unique}
                    onCheckedChange={(v) => onChange({ ...field, unique: v })}
                />
                <Label htmlFor={`uniq-${field.id}`} className="text-xs text-muted-foreground">Unique</Label>
            </div>
            <Button size="sm" variant="outline" onClick={onRemove} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                ✕
            </Button>
        </div>
    );
}

// ── Create Table Form ─────────────────────────────────────────────────────────

function CreateTableForm({ projectId, onCreated }: Readonly<{ projectId: string; onCreated: (t: CustomTable) => void }>) {
    const [displayName, setDisplayName] = useState("");
    const [fields, setFields] = useState<DraftField[]>([newField()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tableName = toSnakeCase(displayName);

    function updateField(id: string, updated: DraftField) {
        setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
    }

    function removeField(id: string) {
        setFields((prev) => prev.filter((f) => f.id !== id));
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setError(null);
        if (!tableName) { setError("Table name is required"); return; }
        const validFields = fields.filter((f) => f.name);
        if (validFields.length === 0) { setError("At least one field is required"); return; }

        setSaving(true);
        try {
            const created = await TableService.createTable(projectId, {
                name: tableName,
                displayName,
                fields: validFields.map(({ id: _id, ...rest }) => rest),
            });
            onCreated(created);
            setDisplayName("");
            setFields([newField()]);
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? ((err as Record<string, Record<string, Record<string, string>>>).response?.data?.message ?? "Failed to create table")
                    : "Failed to create table";
            setError(msg);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Define New Table</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                placeholder="Products"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-muted-foreground text-xs">Table name (auto)</Label>
                            <Input value={tableName} readOnly className="text-muted-foreground bg-muted" />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-[1fr_140px_auto_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-0.5">
                            <span>Column name</span><span>Type</span><span>Required</span><span>Unique</span><span />
                        </div>
                        {fields.map((f) => (
                            <FieldRow
                                key={f.id}
                                field={f}
                                onChange={(u) => updateField(f.id, u)}
                                onRemove={() => removeField(f.id)}
                            />
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setFields((p) => [...p, newField()])}>
                            + Add Column
                        </Button>
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Save Definition"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ── Table Card ────────────────────────────────────────────────────────────────

function TableCard({
    table,
    projectId,
    onDeleted,
    onMigrated,
}: Readonly<{ table: CustomTable; projectId: string; onDeleted: (id: string) => void; onMigrated: (id: string, ddl: string) => void }>) {
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Remove definition for "${table.displayName}"? This does NOT drop the tenant table.`)) return;
        setDeleting(true);
        try {
            await TableService.deleteTable(projectId, table.id);
            onDeleted(table.id);
        } finally {
            setDeleting(false);
        }
    }

    const fields = table.fields as FieldDefinition[];

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{table.displayName}</CardTitle>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{table.name}</code>
                        {table.migratedAt
                            ? <Badge className="bg-emerald-600/20 text-emerald-400 text-xs">Migrated</Badge>
                            : <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">Pending Migration</Badge>
                        }
                    </div>
                    <div className="flex items-center gap-2">
                        <MigrateButton table={table} onMigrated={(ddl) => onMigrated(table.id, ddl)} />
                        <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10" disabled={deleting} onClick={handleDelete}>
                            {deleting ? "…" : "Delete"}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {/* System columns */}
                    {["id (uuid)", "created_at", "updated_at"].map((c) => (
                        <Badge key={c} variant="outline" className="text-xs text-zinc-500 border-zinc-700">{c}</Badge>
                    ))}
                    {fields.map((f) => (
                        <Badge key={f.name} variant="outline" className="text-xs">
                            {f.name}
                            <span className="ml-1 text-muted-foreground">{f.type}</span>
                            {f.required && <span className="ml-1 text-amber-400">*</span>}
                            {f.unique && <span className="ml-1 text-sky-400">u</span>}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectTablesPage() {
    const params = useParams<{ id: string }>();
    const projectId = params.id;
    const project = useProjectStore((s) => s.activeProject);
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "nexus.app";
    const subdomainBase = project?.slug
        ? `https://${project.slug}.${baseDomain}`
        : null;

    const [tables, setTables] = useState<CustomTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [ddl, setDdl] = useState<string | null>(null);

    const loadTables = useCallback(async () => {
        setLoading(true);
        try {
            const result = await TableService.listTables(projectId);
            setTables(result);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadTables();
    }, [loadTables]);

    function handleCreated(t: CustomTable) {
        setTables((prev) => [t, ...prev]);
    }

    function handleDeleted(id: string) {
        setTables((prev) => prev.filter((t) => t.id !== id));
    }

    function handleMigrated(id: string, newDdl: string) {
        setTables((prev) =>
            prev.map((t) => (t.id === id ? { ...t, migratedAt: new Date().toISOString() } : t))
        );
        setDdl(newDdl);
    }

    return (
        <div className="p-6 flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold">Custom Tables</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Define tables in your project database, run migrations, then use the auto-generated REST endpoints.
                </p>
            </div>

            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-4 pb-3 text-xs text-muted-foreground space-y-2">
                    <p><strong className="text-foreground">Endpoint URLs</strong> (requires project token or API key):</p>
                    {subdomainBase ? (
                        <code className="block bg-zinc-900 rounded px-3 py-2 text-sky-300 leading-relaxed">
                            GET &nbsp; {subdomainBase}/table/[tableName]<br />
                            POST &nbsp;{subdomainBase}/table/[tableName]<br />
                            PATCH {subdomainBase}/table/[tableName]/[rowId]<br />
                            DELETE {subdomainBase}/table/[tableName]/[rowId]
                        </code>
                    ) : (
                        <code className="block bg-zinc-900 rounded px-3 py-2 text-sky-300 leading-relaxed">
                            GET &nbsp; /api/v1/p/{projectId}/table/[tableName]<br />
                            POST &nbsp;/api/v1/p/{projectId}/table/[tableName]<br />
                            PATCH /api/v1/p/{projectId}/table/[tableName]/[rowId]<br />
                            DELETE /api/v1/p/{projectId}/table/[tableName]/[rowId]
                        </code>
                    )}
                    <p className="text-zinc-500">Replace <span className="text-zinc-300">[tableName]</span> with e.g. <span className="text-zinc-300">users</span>, <span className="text-zinc-300">products</span>, etc.</p>
                </CardContent>
            </Card>

            <CreateTableForm projectId={projectId} onCreated={handleCreated} />

            <div className="flex flex-col gap-4">
                <h2 className="text-base font-medium">Your Tables</h2>
                {loading && (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}
                {!loading && tables.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tables defined yet.</p>
                )}
                {!loading && tables.length > 0 && tables.map((t) => (
                    <TableCard
                        key={t.id}
                        table={t}
                        projectId={projectId}
                        onDeleted={handleDeleted}
                        onMigrated={handleMigrated}
                    />
                ))}
            </div>

            <DdlDialog ddl={ddl} onClose={() => setDdl(null)} />
        </div>
    );
}
