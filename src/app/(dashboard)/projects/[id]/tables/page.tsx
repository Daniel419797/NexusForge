"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import TableService, { type CustomTable, type FieldDefinition, type FieldType } from "@/services/TableService";
import { useProjectStore } from "@/store/projectStore";

// -- Types ---------------------------------------------------------------

type DraftField = Omit<FieldDefinition, "defaultValue"> & { id: string };

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
    { value: "string", label: "Text" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date / Timestamp" },
    { value: "array", label: "Array (JSON)" },
    { value: "object", label: "Object (JSON)" },
];

const TYPE_COLOR: Record<string, string> = {
    string:  "text-[#81ecff]",
    number:  "text-[#a68cff]",
    boolean: "text-amber-400",
    date:    "text-emerald-400",
    array:   "text-orange-400",
    object:  "text-pink-400",
};

// -- Helpers -------------------------------------------------------------

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

// -- FieldRow (mobile-responsive) ----------------------------------------

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
        <div className="flex flex-col gap-2 py-2.5 border-b border-white/[0.04] last:border-0">
            {/* Row 1: name + delete */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="field_name"
                    value={field.name}
                    onChange={(e) => onChange({ ...field, name: toSnakeCase(e.target.value) })}
                    className="flex-1 h-8 text-sm font-mono bg-white/[0.03] border-white/[0.06] focus:border-[#81ecff]/40"
                />
                <button
                    type="button"
                    onClick={onRemove}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm"
                >
                    
                </button>
            </div>
            {/* Row 2: type + required + unique */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={field.type}
                    onValueChange={(v) => onChange({ ...field, type: v as FieldType })}
                >
                    <SelectTrigger className="h-7 w-40 text-xs bg-white/[0.03] border-white/[0.06]">
                        <SelectValue />
                    </SelectTrigger>
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
                        className="scale-90"
                    />
                    <Label htmlFor={`req-${field.id}`} className="text-[11px] text-white/40 cursor-pointer select-none">Required</Label>
                </div>

                <div className="flex items-center gap-1.5">
                    <Switch
                        id={`uniq-${field.id}`}
                        checked={field.unique}
                        onCheckedChange={(v) => onChange({ ...field, unique: v })}
                        className="scale-90"
                    />
                    <Label htmlFor={`uniq-${field.id}`} className="text-[11px] text-white/40 cursor-pointer select-none">Unique</Label>
                </div>
            </div>
        </div>
    );
}

// -- FieldList (shared between create and edit) ---------------------------

function FieldList({
    fields,
    onUpdate,
    onRemove,
    onAdd,
}: Readonly<{
    fields: DraftField[];
    onUpdate: (id: string, f: DraftField) => void;
    onRemove: (id: string) => void;
    onAdd: () => void;
}>) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-white/30 font-mono">Columns</p>
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-[11px] text-[#81ecff]/70 hover:text-[#81ecff] transition-colors flex items-center gap-1"
                >
                    + Add column
                </button>
            </div>
            <div>
                {fields.map((f) => (
                    <FieldRow
                        key={f.id}
                        field={f}
                        onChange={(u) => onUpdate(f.id, u)}
                        onRemove={() => onRemove(f.id)}
                    />
                ))}
            </div>
        </div>
    );
}

// -- CreateTableForm -----------------------------------------------------

function CreateTableForm({ projectId, onCreated }: Readonly<{ projectId: string; onCreated: (t: CustomTable) => void }>) {
    const [displayName, setDisplayName] = useState("");
    const [fields, setFields] = useState<DraftField[]>([newField()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

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
        if (validFields.length === 0) { setError("At least one named field is required"); return; }

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
            setOpen(false);
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
        <div className="border-b border-white/[0.04] pb-6">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between group text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors">
                        Define new table
                    </span>
                </div>
                <span className="text-[11px] text-[#81ecff]/60 group-hover:text-[#81ecff] transition-colors shrink-0">
                    {open ? "Cancel" : "+ New table"}
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.form
                        key="create-form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-5 pt-5">
                            {/* Name row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="displayName" className="text-xs text-white/40 mb-1.5 block">Display name</Label>
                                    <Input
                                        id="displayName"
                                        placeholder="Products"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="bg-white/[0.03] border-white/[0.06] focus:border-[#81ecff]/40"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs text-white/25 mb-1.5 block">Table name (auto)</Label>
                                    <Input
                                        value={tableName || ""}
                                        readOnly
                                        className="font-mono text-sm text-white/30 bg-white/[0.02] border-white/[0.04] cursor-default"
                                    />
                                </div>
                            </div>

                            {/* Fields */}
                            <FieldList
                                fields={fields}
                                onUpdate={updateField}
                                onRemove={removeField}
                                onAdd={() => setFields((p) => [...p, newField()])}
                            />

                            {error && <p className="text-sm text-red-400/80">{error}</p>}

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#81ecff]/10 text-[#81ecff] border border-[#81ecff]/20 hover:bg-[#81ecff]/15 hover:text-white transition-colors"
                                >
                                    {saving ? "Saving..." : "Save table"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    className="text-white/30 hover:text-white/60"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}

// -- TableRow (replaces TableCard) ----------------------------------------

function TableRow({
    table,
    projectId,
    onDeleted,
    onUpdated,
}: Readonly<{ table: CustomTable; projectId: string; onDeleted: (id: string) => void; onUpdated: (t: CustomTable) => void }>) {
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [draftFields, setDraftFields] = useState<DraftField[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const fields = table.fields as FieldDefinition[];

    function openEdit() {
        setDraftFields((table.fields as FieldDefinition[]).map((f) => ({ ...f, id: crypto.randomUUID() })));
        setSaveError(null);
        setEditing(true);
        setExpanded(true);
    }

    function cancelEdit() {
        setEditing(false);
        setSaveError(null);
    }

    async function handleSave() {
        const validFields = draftFields.filter((f) => f.name);
        if (validFields.length === 0) { setSaveError("At least one field is required"); return; }
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await TableService.updateTable(projectId, table.id, {
                fields: validFields.map(({ id: _id, ...rest }) => rest),
            });
            onUpdated(updated);
            setEditing(false);
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? ((err as Record<string, Record<string, Record<string, string>>>).response?.data?.message ?? "Failed to save")
                    : "Failed to save";
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    }

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

    function updateDraftField(id: string, updated: DraftField) {
        setDraftFields((prev) => prev.map((x) => (x.id === id ? updated : x)));
    }
    function removeDraftField(id: string) {
        setDraftFields((prev) => prev.filter((x) => x.id !== id));
    }

    return (
        <div className="border-b border-white/[0.04] last:border-0">
            {/* Summary row */}
            <div className="flex items-center gap-3 py-3 group">
                <button
                    type="button"
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    onClick={() => !editing && setExpanded((v) => !v)}
                >
                    <span className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
                        {table.displayName}
                    </span>
                    <code className="shrink-0 text-[10px] text-white/25 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded hidden sm:inline">
                        {table.name}
                    </code>
                    <span className="shrink-0 text-[11px] text-white/20">
                        {fields.length} col{fields.length !== 1 ? "s" : ""}
                    </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                    {!editing && (
                        <button
                            type="button"
                            onClick={openEdit}
                            className="text-[11px] text-white/30 hover:text-[#81ecff] transition-colors hidden sm:inline"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-[11px] text-white/20 hover:text-red-400 transition-colors"
                    >
                        {deleting ? "..." : "Delete"}
                    </button>
                    <span className="text-white/15 text-sm select-none transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        &#8964;
                    </span>
                </div>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        {!editing ? (
                            <div className="pb-4 pl-0">
                                {/* Field table */}
                                <div className="mb-3">
                                    <div className="grid grid-cols-[1fr_80px_50px_50px] sm:grid-cols-[1fr_120px_60px_60px] gap-x-3 py-1.5 border-b border-white/[0.03]">
                                        <span className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Column</span>
                                        <span className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Type</span>
                                        <span className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Req</span>
                                        <span className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Uniq</span>
                                    </div>
                                    {["id (uuid)", "created_at", "updated_at"].map((c) => (
                                        <div key={c} className="grid grid-cols-[1fr_80px_50px_50px] sm:grid-cols-[1fr_120px_60px_60px] gap-x-3 py-1.5 border-b border-white/[0.02]">
                                            <span className="text-xs font-mono text-white/30 truncate">{c}</span>
                                            <span className="text-xs text-white/15 font-mono">system</span>
                                            <span className="text-[10px] text-white/15"></span>
                                            <span className="text-[10px] text-white/15"></span>
                                        </div>
                                    ))}
                                    {fields.map((f) => (
                                        <div key={f.name} className="grid grid-cols-[1fr_80px_50px_50px] sm:grid-cols-[1fr_120px_60px_60px] gap-x-3 py-1.5 border-b border-white/[0.02] last:border-0">
                                            <span className="text-xs font-mono text-white/70 truncate">{f.name}</span>
                                            <span className={`text-xs font-mono ${TYPE_COLOR[f.type] ?? "text-white/40"}`}>{f.type}</span>
                                            <span className="text-[10px]">{f.required ? <span className="text-amber-400">yes</span> : <span className="text-white/15"></span>}</span>
                                            <span className="text-[10px]">{f.unique ? <span className="text-sky-400">yes</span> : <span className="text-white/15"></span>}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={openEdit}
                                    className="text-[11px] text-[#81ecff]/60 hover:text-[#81ecff] transition-colors sm:hidden"
                                >
                                    Edit columns
                                </button>
                            </div>
                        ) : (
                            <div className="pb-4">
                                <FieldList
                                    fields={draftFields}
                                    onUpdate={updateDraftField}
                                    onRemove={removeDraftField}
                                    onAdd={() => setDraftFields((p) => [...p, newField()])}
                                />
                                {saveError && <p className="text-sm text-red-400/80 mt-2">{saveError}</p>}
                                <div className="flex gap-3 mt-4">
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-[#81ecff]/10 text-[#81ecff] border border-[#81ecff]/20 hover:bg-[#81ecff]/15 hover:text-white transition-colors"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving} className="text-white/30 hover:text-white/60">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// -- Page ----------------------------------------------------------------

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
    function handleUpdated(updated: CustomTable) {
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }

    const base = subdomainBase ?? `/api/v1/p/${projectId}`;
    const endpointLines = [
        `GET    ${base}/table/[tableName]`,
        `POST   ${base}/table/[tableName]`,
        `PATCH  ${base}/table/[tableName]/[rowId]`,
        `DELETE ${base}/table/[tableName]/[rowId]`,
    ];

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 py-6 sm:px-6">

            {/* Header */}
            <div className="flex items-start gap-4 border-b border-white/[0.04] pb-6">
                <div className="shrink-0 mt-1 w-[3px] self-stretch rounded-full" style={{ background: "rgba(129,236,255,0.5)" }} />
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/90">Custom Tables</h1>
                    <p className="text-sm text-white/35 mt-1">
                        Define tables in your project database and use the auto-generated REST endpoints.
                    </p>
                </div>
            </div>

            {/* Endpoint reference */}
            <div className="flex flex-col gap-3 border-b border-white/[0.04] pb-6">
                <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Endpoint reference</p>
                <div className="overflow-x-auto rounded-md bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                    {endpointLines.map((line) => (
                        <code key={line} className="block text-xs font-mono text-[#81ecff]/70 leading-6 whitespace-pre">
                            {line}
                        </code>
                    ))}
                </div>
                <p className="text-[11px] text-white/20">
                    Replace <span className="text-white/40 font-mono">[tableName]</span> with e.g.{" "}
                    <span className="text-white/40 font-mono">users</span>,{" "}
                    <span className="text-white/40 font-mono">products</span>, etc.
                    Requires project token or API key.
                </p>
            </div>

            {/* Create form */}
            <CreateTableForm projectId={projectId} onCreated={handleCreated} />

            {/* Table list */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] uppercase tracking-wider text-white/25 font-mono">
                        Your tables{!loading && tables.length > 0 && ` (${tables.length})`}
                    </p>
                </div>

                {loading && (
                    <div className="divide-y divide-white/[0.04]">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                                <div className="h-3 flex-1 max-w-[120px] rounded bg-white/[0.06]" />
                                <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
                                <div className="h-2 w-8 rounded bg-white/[0.03]" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && tables.length === 0 && (
                    <p className="text-sm text-white/25 py-3">No tables defined yet.</p>
                )}

                {!loading && tables.length > 0 && (
                    <div>
                        {tables.map((t) => (
                            <TableRow
                                key={t.id}
                                table={t}
                                projectId={projectId}
                                onDeleted={handleDeleted}
                                onUpdated={handleUpdated}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}