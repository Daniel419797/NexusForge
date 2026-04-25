"use client";

import "@xyflow/react/dist/style.css";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    addEdge,
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    type Connection,
    type Edge,
    type Node,
    useEdgesState,
    useNodesState,
} from "@xyflow/react";
import { ArrowLeft } from "lucide-react";

import LogicModuleService, {
    type LogicModuleDefinition,
    type LogicModuleDeadLetterDetail,
    type LogicModuleDeadLetterSummary,
    type WorkflowDefinitionInput,
    type WorkflowNodeInput,
} from "@/services/LogicModuleService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TriggerType = "manual" | "row_created" | "row_updated" | "scheduled" | "webhook";
type WorkflowNodeType = WorkflowNodeInput["type"];

type FlowData = {
    workflowType: WorkflowNodeType;
    configText: string;
};

function defaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
    if (type === "filter") return { expression: "input.score >= 5" };
    if (type === "branch") return { cases: [{ label: "yes", expression: "true" }], defaultLabel: "no" };
    if (type === "read_table") return { tableName: "events", limit: 20 };
    if (type === "write_table") return { tableName: "events", operation: "insert", payload: {} };
    if (type === "notify") return { channel: "in_app", recipientField: "input.userId", messageTemplate: "Workflow notification" };
    if (type === "end") return { result: "done" };
    return {};
}

function flowFromDefinition(definition: WorkflowDefinitionInput): { nodes: Node<FlowData>[]; edges: Edge[] } {
    const nodes = definition.nodes.map((n, i) => ({
        id: n.id,
        type: "default",
        position: { x: 140 + (i % 4) * 260, y: 60 + Math.floor(i / 4) * 160 },
        data: {
            workflowType: n.type,
            configText: JSON.stringify(n.config || {}, null, 2),
        },
    }));

    const edges = definition.edges.map((e, i) => ({
        id: `e-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        label: e.condition || "",
        animated: Boolean(e.condition),
    }));

    return { nodes, edges };
}

function definitionFromFlow(
    nodes: Node<FlowData>[],
    edges: Edge[],
    triggerType: TriggerType,
    triggerTableName: string,
    triggerWatchFields: string,
    triggerCron: string,
    triggerSecret: string,
): WorkflowDefinitionInput {
    const definitionNodes: WorkflowNodeInput[] = nodes.map((n) => {
        let config: Record<string, unknown> = {};
        try {
            config = JSON.parse(n.data.configText || "{}");
        } catch {
            config = defaultNodeConfig(n.data.workflowType);
        }
        return {
            id: n.id,
            type: n.data.workflowType,
            config,
        };
    });

    const definitionEdges = edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition: e.label ? String(e.label) : undefined,
    }));

    const triggerConfig: Record<string, unknown> =
        triggerType === "row_created"
            ? { tableName: triggerTableName }
            : triggerType === "row_updated"
            ? {
                  tableName: triggerTableName,
                  watchFields: triggerWatchFields
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean),
              }
            : triggerType === "scheduled"
            ? { cron: triggerCron || "* * * * *" }
            : triggerType === "webhook"
            ? { secret: triggerSecret || undefined }
            : {};

    const entryNodeId = definitionNodes.find((n) => n.type === "start")?.id || definitionNodes[0]?.id;

    return {
        nodes: definitionNodes,
        edges: definitionEdges,
        triggers: [{ type: triggerType, config: triggerConfig }],
        ...(entryNodeId ? { entryNodeId } : {}),
    };
}

const emptySeed: WorkflowDefinitionInput = {
    nodes: [
        { id: "start", type: "start", config: {} },
        { id: "end", type: "end", config: { result: "done" } },
    ],
    edges: [{ from: "start", to: "end" }],
    triggers: [{ type: "manual", config: {} }],
    entryNodeId: "start",
};

export default function LogicBuilderPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params.id as string | undefined;
    const urlModuleKey = searchParams.get("moduleKey") ?? "";

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [rf, setRf] = useState<any>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [modules, setModules] = useState<LogicModuleDefinition[]>([]);
    const [selectedModuleKey, setSelectedModuleKey] = useState("");
    const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

    const [moduleKey, setModuleKey] = useState("risk_gate");
    const [displayName, setDisplayName] = useState("Risk Gate");
    const [description, setDescription] = useState("Approves or rejects based on expression rule");

    const [triggerType, setTriggerType] = useState<TriggerType>("manual");
    const [triggerTableName, setTriggerTableName] = useState("events");
    const [triggerWatchFields, setTriggerWatchFields] = useState("status");
    const [triggerCron, setTriggerCron] = useState("* * * * *");
    const [triggerSecret, setTriggerSecret] = useState("");

    const [paletteNodeType, setPaletteNodeType] = useState<WorkflowNodeType>("filter");
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [isExecuting, setIsExecuting] = useState(false);
    const [executeInput, setExecuteInput] = useState("{}");
    const [executeResult, setExecuteResult] = useState<{ status: string; traces: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }> } | null>(null);

    const [runs, setRuns] = useState<Array<{ id: string; status: string; triggeredBy: string | null; createdAt: string; completedAt: string | null }>>([]);
    const [runsLoading, setRunsLoading] = useState(false);
    const [selectedRunTrace, setSelectedRunTrace] = useState<{ id: string; status: string; steps: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>; createdAt: string } | null>(null);
    const [isRetrying, setIsRetrying] = useState<string | null>(null);
    const [deadLetters, setDeadLetters] = useState<LogicModuleDeadLetterSummary[]>([]);
    const [deadLettersLoading, setDeadLettersLoading] = useState(false);
    const [deadLetterDetail, setDeadLetterDetail] = useState<LogicModuleDeadLetterDetail | null>(null);
    const [deadLetterDetailOpen, setDeadLetterDetailOpen] = useState(false);

    const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

    const loadModuleByKey = async (projId: string, key: string) => {
        setIsLoading(true);
        setMessage(null);
        try {
            const detail = await LogicModuleService.getDefinition(projId, key);
            setModuleKey(detail.moduleKey);
            setDisplayName(detail.displayName);
            setDescription(detail.description || "");
            setSelectedModuleKey(key);

            const latestVersion = detail.versions[0]?.versionNumber;
            if (!latestVersion) return;
            setSelectedVersionNumber(latestVersion);

            const version = await LogicModuleService.getVersionDefinition(projId, key, latestVersion);
            const def = version.definitionJson;
            const flow = flowFromDefinition(def);
            setNodes(flow.nodes);
            setEdges(flow.edges);

            const trigger = def.triggers?.[0];
            if (trigger) {
                setTriggerType(trigger.type as TriggerType);
                if (trigger.type === "row_created" || trigger.type === "row_updated") {
                    setTriggerTableName(String(trigger.config?.tableName || "events"));
                }
                if (trigger.type === "row_updated") {
                    const fields = Array.isArray(trigger.config?.watchFields) ? trigger.config.watchFields : [];
                    setTriggerWatchFields(fields.join(","));
                }
                if (trigger.type === "scheduled") setTriggerCron(String(trigger.config?.cron || "* * * * *"));
                if (trigger.type === "webhook") setTriggerSecret(String(trigger.config?.secret || ""));
            }
        } catch {
            setMessage("Failed to load module.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadRunHistory = async (projId: string, key: string) => {
        setRunsLoading(true);
        try {
            const data = await LogicModuleService.listRuns(projId, key, { limit: 20 });
            setRuns(data);
        } catch {
            // silently ignore
        } finally {
            setRunsLoading(false);
        }
    };

    const loadDeadLetters = async (projId: string, key: string) => {
        setDeadLettersLoading(true);
        try {
            const data = await LogicModuleService.listDeadLetters(projId, key, { limit: 20 });
            setDeadLetters(data);
        } catch {
            // silently ignore
        } finally {
            setDeadLettersLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!projectId || !moduleKey) return;
        setIsExecuting(true);
        setExecuteResult(null);
        try {
            let parsedInput: Record<string, unknown> = {};
            try { parsedInput = JSON.parse(executeInput); } catch { /* use empty */ }
            const result = await LogicModuleService.executeModule(projectId, moduleKey, parsedInput);
            setExecuteResult(result);
            await loadRunHistory(projectId, moduleKey);
            await loadDeadLetters(projectId, moduleKey);
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Execution failed");
        } finally {
            setIsExecuting(false);
        }
    };

    const handleRollback = async () => {
        if (!projectId || !selectedModuleKey || !selectedVersionNumber) return;
        if (!confirm(`Roll back to version ${selectedVersionNumber}?`)) return;
        try {
            await LogicModuleService.rollbackVersion(projectId, selectedModuleKey, selectedVersionNumber);
            setMessage(`Rolled back to v${selectedVersionNumber}`);
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Rollback failed");
        }
    };

    const handleRetry = async (runId: string) => {
        if (!projectId || !moduleKey) return;
        setIsRetrying(runId);
        try {
            await LogicModuleService.retryRun(projectId, moduleKey, runId);
            await loadRunHistory(projectId, moduleKey);
            await loadDeadLetters(projectId, moduleKey);
        } catch {
            setMessage("Retry failed.");
        } finally {
            setIsRetrying(null);
        }
    };

    const handleViewTrace = async (runId: string) => {
        if (!projectId || !moduleKey) return;
        try {
            const trace = await LogicModuleService.getRunTrace(projectId, moduleKey, runId);
            setSelectedRunTrace(trace);
        } catch {
            setMessage("Failed to load trace.");
        }
    };

    const handleViewDeadLetter = async (deadLetterId: string) => {
        if (!projectId || !moduleKey) return;
        try {
            const detail = await LogicModuleService.getDeadLetter(projectId, moduleKey, deadLetterId);
            setDeadLetterDetail(detail);
            setDeadLetterDetailOpen(true);
        } catch {
            setMessage("Failed to load dead-letter details.");
        }
    };

    useEffect(() => {
        if (!projectId) return;
        setIsLoading(true);
        LogicModuleService.list(projectId)
            .then(async (data) => {
                setModules(data);
                if (urlModuleKey) {
                    await loadModuleByKey(projectId, urlModuleKey);
                    await loadRunHistory(projectId, urlModuleKey);
                    await loadDeadLetters(projectId, urlModuleKey);
                } else {
                    const seed = flowFromDefinition(emptySeed);
                    setNodes(seed.nodes);
                    setEdges(seed.edges);
                }
            })
            .catch(() => setMessage("Failed to load modules."))
            .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, urlModuleKey]);

    const onConnect = (connection: Connection) => {
        setEdges((eds) => addEdge({ ...connection, id: `e-${connection.source}-${connection.target}-${Date.now()}` }, eds));
    };

    const onPaletteDragStart = (event: React.DragEvent<HTMLDivElement>, type: WorkflowNodeType) => {
        event.dataTransfer.setData("application/workflow-node", type);
        event.dataTransfer.effectAllowed = "move";
    };

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!rf || !wrapperRef.current) return;

        const type = event.dataTransfer.getData("application/workflow-node") as WorkflowNodeType;
        if (!type) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const position = rf.screenToFlowPosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });

        const nodeId = `${type}_${Date.now().toString(36)}`;
        const nextNode: Node<FlowData> = {
            id: nodeId,
            type: "default",
            position,
            data: {
                workflowType: type,
                configText: JSON.stringify(defaultNodeConfig(type), null, 2),
            },
        };
        setNodes((prev) => [...prev, nextNode]);
    };

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    const addNode = () => {
        const nodeId = `${paletteNodeType}_${Date.now().toString(36)}`;
        setNodes((prev) => [
            ...prev,
            {
                id: nodeId,
                type: "default",
                position: { x: 150 + prev.length * 30, y: 120 + prev.length * 20 },
                data: {
                    workflowType: paletteNodeType,
                    configText: JSON.stringify(defaultNodeConfig(paletteNodeType), null, 2),
                },
            },
        ]);
    };

    const removeSelectedNode = () => {
        if (!selectedNodeId) return;
        setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
        setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
    };

    const updateSelectedNodeConfig = (text: string) => {
        if (!selectedNodeId) return;
        setNodes((prev) =>
            prev.map((n) =>
                n.id === selectedNodeId
                    ? { ...n, data: { ...n.data, configText: text } }
                    : n,
            ),
        );
    };

    const loadSelectedModule = () => {
        if (!projectId || !selectedModuleKey) return;
        loadModuleByKey(projectId, selectedModuleKey);
    };

    const handleSave = async () => {
        if (!projectId) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const definition = definitionFromFlow(
                nodes,
                edges,
                triggerType,
                triggerTableName,
                triggerWatchFields,
                triggerCron,
                triggerSecret,
            );

            const editingExisting = selectedModuleKey.length > 0 && selectedModuleKey === moduleKey;

            if (editingExisting) {
                await LogicModuleService.updateDefinition(projectId, moduleKey, {
                    displayName,
                    description,
                });
            } else {
                await LogicModuleService.createDefinition(projectId, {
                    moduleKey,
                    displayName,
                    description,
                });
            }

            const version = await LogicModuleService.createVersion(projectId, moduleKey, definition);
            await LogicModuleService.activateVersion(projectId, moduleKey, version.versionNumber);

            const refreshed = await LogicModuleService.list(projectId);
            setModules(refreshed);
            setSelectedModuleKey(moduleKey);
            setSelectedVersionNumber(version.versionNumber);
            setMessage(`Saved and activated ${moduleKey}@${version.versionNumber}`);
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Failed to save module");
        } finally {
            setIsSaving(false);
        }
    };

    if (!projectId) return null;

    return (
        <div className="space-y-6 max-w-[1200px]">
            <div className="flex items-center gap-3">
                <Link
                    href={`/projects/${projectId}/settings/modules`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight">Logic Module Builder</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Drag node types into the canvas, connect edges, and publish versions.
                    </p>
                </div>
            </div>

            {message && (
                <div className="p-3 rounded-lg border text-sm bg-muted/40">{message}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card className="p-4 space-y-3 lg:col-span-3">
                    <div className="space-y-2">
                        <Label>Load Existing Module</Label>
                        <select
                            value={selectedModuleKey}
                            onChange={(e) => setSelectedModuleKey(e.target.value)}
                            className="w-full h-9 px-3 border rounded-md bg-background"
                        >
                            <option value="">New Module</option>
                            {modules.map((m) => (
                                <option key={m.moduleKey} value={m.moduleKey}>
                                    {m.moduleKey} ({m.status})
                                </option>
                            ))}
                        </select>
                        <Button type="button" variant="secondary" onClick={loadSelectedModule} disabled={!selectedModuleKey || isLoading}>
                            {isLoading ? "Loading..." : "Load Module"}
                        </Button>
                        {selectedVersionNumber ? (
                            <p className="text-xs text-muted-foreground">Loaded version: {selectedVersionNumber}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="moduleKey">Module Key</Label>
                        <Input id="moduleKey" value={moduleKey} onChange={(e) => setModuleKey(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="pt-2 border-t space-y-2">
                        <Label>Trigger Type</Label>
                        <select
                            value={triggerType}
                            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                            className="w-full h-9 px-3 border rounded-md bg-background"
                        >
                            <option value="manual">manual</option>
                            <option value="row_created">row_created</option>
                            <option value="row_updated">row_updated</option>
                            <option value="scheduled">scheduled</option>
                            <option value="webhook">webhook</option>
                        </select>
                        {(triggerType === "row_created" || triggerType === "row_updated") && (
                            <Input
                                value={triggerTableName}
                                onChange={(e) => setTriggerTableName(e.target.value)}
                                placeholder="table name"
                            />
                        )}
                        {triggerType === "row_updated" && (
                            <Input
                                value={triggerWatchFields}
                                onChange={(e) => setTriggerWatchFields(e.target.value)}
                                placeholder="watch fields (comma-separated)"
                            />
                        )}
                        {triggerType === "scheduled" && (
                            <Input value={triggerCron} onChange={(e) => setTriggerCron(e.target.value)} placeholder="* * * * *" />
                        )}
                        {triggerType === "webhook" && (
                            <Input value={triggerSecret} onChange={(e) => setTriggerSecret(e.target.value)} placeholder="webhook secret (optional)" />
                        )}
                    </div>
                </Card>

                <Card className="p-4 space-y-3 lg:col-span-6">
                    <div className="flex items-center gap-2">
                        <Label>Node Palette</Label>
                        <select
                            value={paletteNodeType}
                            onChange={(e) => setPaletteNodeType(e.target.value as WorkflowNodeType)}
                            className="h-8 px-2 border rounded-md bg-background"
                        >
                            <option value="start">start</option>
                            <option value="filter">filter</option>
                            <option value="branch">branch</option>
                            <option value="read_table">read_table</option>
                            <option value="write_table">write_table</option>
                            <option value="notify">notify</option>
                            <option value="end">end</option>
                        </select>
                        <Button type="button" variant="secondary" onClick={addNode}>Add Node</Button>
                        <div
                            draggable
                            onDragStart={(e) => onPaletteDragStart(e, paletteNodeType)}
                            className="text-xs px-2 py-1 border rounded cursor-grab"
                        >
                            Drag {paletteNodeType}
                        </div>
                    </div>

                    <div
                        ref={wrapperRef}
                        className="h-[560px] border rounded-md"
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                    >
                        <ReactFlow<Node<FlowData>, Edge>
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={(instance) => setRf(instance)}
                            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                            fitView
                        >
                            <Background gap={20} />
                            <MiniMap />
                            <Controls />
                        </ReactFlow>
                    </div>
                </Card>

                <Card className="p-4 space-y-3 lg:col-span-3">
                    <Label>Selected Node</Label>
                    {selectedNode ? (
                        <>
                            <p className="text-xs text-muted-foreground">{selectedNode.id} ({selectedNode.data.workflowType})</p>
                            <Textarea
                                value={selectedNode.data.configText}
                                onChange={(e) => updateSelectedNodeConfig(e.target.value)}
                                className="min-h-[220px] font-mono text-xs"
                            />
                            <Button type="button" variant="destructive" onClick={removeSelectedNode}>Remove Node</Button>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground">Click a node to edit its config JSON.</p>
                    )}

                    <div className="pt-2 border-t space-y-2">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || moduleKey.trim().length < 3 || displayName.trim().length < 1 || nodes.length < 2}
                        >
                            {isSaving ? "Publishing..." : "Save, Version, Activate"}
                        </Button>
                        {selectedModuleKey && selectedVersionNumber && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRollback}
                                className="w-full"
                            >
                                Rollback v{selectedVersionNumber}
                            </Button>
                        )}
                    </div>

                    <div className="pt-2 border-t space-y-2">
                        <Label>Manual Execute</Label>
                        <Textarea
                            value={executeInput}
                            onChange={(e) => setExecuteInput(e.target.value)}
                            className="min-h-[80px] font-mono text-xs"
                            placeholder='{"key": "value"}'
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleExecute}
                            disabled={isExecuting || !moduleKey}
                            className="w-full"
                        >
                            {isExecuting ? "Running..." : "Run Module"}
                        </Button>
                        {executeResult && (
                            <div className={`text-xs p-2 rounded border font-mono ${
                                executeResult.status === "succeeded"
                                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                            }`}>
                                <p className="font-semibold mb-1">{executeResult.status.toUpperCase()}</p>
                                {executeResult.traces.slice(0, 3).map((t, i) => (
                                    <p key={i}>{t.nodeId}: {t.status}{t.error ? ` — ${t.error}` : ""}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {selectedModuleKey && (
                <div className="space-y-4">
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Run History</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => loadRunHistory(projectId!, selectedModuleKey)}
                            disabled={runsLoading}
                        >
                            {runsLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    {runs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No runs yet. Use &quot;Run Module&quot; or wait for a trigger.</p>
                    ) : (
                        <div className="divide-y border rounded-md text-sm">
                            {runs.map((run) => (
                                <div key={run.id} className="flex items-center gap-3 px-3 py-2">
                                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                                        run.status === "succeeded"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                            : run.status === "failed"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    }`}>{run.status}</span>
                                    <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{run.id.slice(0, 8)}…</span>
                                    <span className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleViewTrace(run.id)}
                                    >
                                        Trace
                                    </Button>
                                    {run.status === "failed" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                            disabled={isRetrying === run.id}
                                            onClick={() => handleRetry(run.id)}
                                        >
                                            {isRetrying === run.id ? "Retrying…" : "Retry"}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedRunTrace && (
                        <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold">Trace — {selectedRunTrace.id.slice(0, 8)}…</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setSelectedRunTrace(null)}
                                >
                                    Close
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {selectedRunTrace.steps.map((step, i) => (
                                    <div key={i} className="text-xs font-mono flex gap-2">
                                        <span className={step.status === "succeeded" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {step.status === "succeeded" ? "✓" : "✗"}
                                        </span>
                                        <span className="text-muted-foreground">{step.nodeId}</span>
                                        <span>({step.nodeType})</span>
                                        {step.error && <span className="text-red-500 truncate max-w-[200px]">{step.error}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Dead Letters</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => loadDeadLetters(projectId!, selectedModuleKey)}
                            disabled={deadLettersLoading}
                        >
                            {deadLettersLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    {deadLetters.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No dead letters.</p>
                    ) : (
                        <div className="divide-y border rounded-md text-sm">
                            {deadLetters.map((deadLetter) => (
                                <div key={deadLetter.id} className="flex items-center gap-3 px-3 py-2">
                                    <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{deadLetter.id.slice(0, 8)}…</span>
                                    <span className="text-xs truncate max-w-[320px] text-muted-foreground">
                                        {deadLetter.reason || deadLetter.runErrorSummary || "Execution failed"}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleViewDeadLetter(deadLetter.id)}
                                    >
                                        View
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                </div>
            )}

            <Dialog open={deadLetterDetailOpen} onOpenChange={setDeadLetterDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dead-letter Detail</DialogTitle>
                        <DialogDescription>
                            Inspect payload and error metadata for failed runs.
                        </DialogDescription>
                    </DialogHeader>
                    {deadLetterDetail ? (
                        <div className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3 text-xs">
                                <div className="rounded border p-2">
                                    <p className="text-muted-foreground">Dead-letter ID</p>
                                    <p className="font-mono break-all">{deadLetterDetail.id}</p>
                                </div>
                                <div className="rounded border p-2">
                                    <p className="text-muted-foreground">Run ID</p>
                                    <p className="font-mono break-all">{deadLetterDetail.moduleRunId || "-"}</p>
                                </div>
                                <div className="rounded border p-2">
                                    <p className="text-muted-foreground">Retry Count</p>
                                    <p>{deadLetterDetail.retryCount ?? 0}</p>
                                </div>
                                <div className="rounded border p-2">
                                    <p className="text-muted-foreground">Created</p>
                                    <p>{new Date(deadLetterDetail.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="rounded border p-2">
                                <p className="text-xs text-muted-foreground">Reason</p>
                                <p className="text-sm mt-1">{deadLetterDetail.reason || deadLetterDetail.runErrorSummary || "Unknown error"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Payload</p>
                                <Textarea
                                    readOnly
                                    className="min-h-[220px] font-mono text-xs"
                                    value={JSON.stringify(deadLetterDetail.payloadJson ?? {}, null, 2)}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No details loaded.</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
