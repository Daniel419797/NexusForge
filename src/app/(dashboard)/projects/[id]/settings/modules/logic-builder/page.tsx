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
    title: string;
    label: string;
    configText: string;
};

type DraftSimulationStep = {
    nodeId: string;
    nodeType: WorkflowNodeType;
    title: string;
    routeLabel: string | null;
    note?: string;
};

type DraftSimulationResult = {
    status: "succeeded" | "failed";
    steps: DraftSimulationStep[];
    error?: string;
};

const NODE_TYPE_OPTIONS: Array<{ value: WorkflowNodeType; label: string }> = [
    { value: "start", label: "start" },
    { value: "filter", label: "filter" },
    { value: "branch", label: "branch" },
    { value: "read_table", label: "read_table" },
    { value: "write_table", label: "write_table" },
    { value: "notify", label: "notify" },
    { value: "transform", label: "transform" },
    { value: "compute", label: "compute" },
    { value: "aggregate", label: "aggregate" },
    { value: "for_each", label: "for_each" },
    { value: "http_request", label: "http_request" },
    { value: "idempotency", label: "idempotency" },
    { value: "lock", label: "lock" },
    { value: "cache", label: "cache" },
    { value: "subflow", label: "subflow" },
    { value: "queue_publish", label: "queue_publish" },
    { value: "queue_consume", label: "queue_consume" },
    { value: "stream_publish", label: "stream_publish" },
    { value: "stream_consume", label: "stream_consume" },
    { value: "approval_wait", label: "approval_wait" },
    { value: "saga_step", label: "saga_step" },
    { value: "saga_compensate", label: "saga_compensate" },
    { value: "delay", label: "delay" },
    { value: "wait_until", label: "wait_until" },
    { value: "report_export", label: "report_export" },
    { value: "end", label: "end" },
];

function literal(value: unknown): Record<string, unknown> {
    return { kind: "literal", value };
}

function pathRef(path: string): Record<string, unknown> {
    return { kind: "path", path };
}

function defaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
    if (type === "filter") return { expression: "input.score >= 5" };
    if (type === "branch") return { cases: [{ label: "yes", expression: "true" }], defaultLabel: "no" };
    if (type === "read_table") return { tableName: "events", limit: 20 };
    if (type === "write_table") return { tableName: "events", operation: "insert", payload: {} };
    if (type === "notify") return { channel: "in_app", recipientField: "input.userId", messageTemplate: "Workflow notification" };
    if (type === "transform") {
        return {
            fields: {
                userId: pathRef("input.userId"),
                amount: pathRef("input.amount"),
                requestId: pathRef("input.requestId"),
            },
            outputKey: "output",
        };
    }
    if (type === "compute") {
        return {
            operation: "sum",
            values: [pathRef("input.amount"), literal(0)],
            round: 2,
            outputKey: "value",
        };
    }
    if (type === "aggregate") {
        return {
            sourcePath: "input.items",
            reducer: "sum",
            valuePath: "amount",
            round: 2,
            outputKey: "value",
        };
    }
    if (type === "for_each") {
        return {
            sourcePath: "input.items",
            maxItems: 100,
            itemValuePath: "score",
            reducer: "mean",
            round: 2,
            outputKey: "value",
        };
    }
    if (type === "http_request") {
        return {
            url: literal("https://api.example.com/v1/process"),
            method: "POST",
            headers: {
                accept: literal("application/json"),
            },
            body: pathRef("input"),
            allowedHosts: ["api.example.com"],
            maxRequestBytes: 32768,
            timeoutMs: 3000,
            maxResponseBytes: 32768,
            responseSchema: {
                type: "json",
                requireFields: ["status", "data"],
                maxDepth: 8,
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                windowSeconds: 120,
                cooldownSeconds: 120,
            },
            retry: {
                maxAttempts: 2,
                backoffMs: 200,
                retryOnStatuses: [429, 500, 503],
            },
            outputKey: "response",
        };
    }
    if (type === "idempotency") {
        return {
            key: pathRef("input.requestId"),
            ttlSeconds: 3600,
            onDuplicate: "route_duplicate",
            outputKey: "idempotency",
        };
    }
    if (type === "lock") {
        return {
            operation: "acquire",
            key: pathRef("input.resourceId"),
            ttlSeconds: 30,
            waitTimeoutMs: 500,
            retryIntervalMs: 100,
            outputKey: "lock",
        };
    }
    if (type === "cache") {
        return {
            operation: "get",
            key: pathRef("input.cacheKey"),
            ttlSeconds: 300,
            outputKey: "cache",
        };
    }
    if (type === "subflow") {
        return {
            moduleKey: "risk_calculator",
            version: 1,
            input: {
                userId: pathRef("input.userId"),
                score: pathRef("steps.compute_1.value"),
            },
            passInput: false,
            propagateFailure: true,
            retry: {
                maxAttempts: 2,
                backoffMs: 200,
            },
            outputKey: "subflow",
        };
    }
    if (type === "queue_publish") {
        return {
            queueName: "orders",
            jobName: "process-order",
            payload: pathRef("input"),
            messageId: pathRef("input.requestId"),
            delayMs: 0,
            priority: 5,
            outputKey: "queue_publish",
        };
    }
    if (type === "queue_consume") {
        return {
            queueName: "orders",
            maxMessages: 10,
            outputKey: "queue_consume",
        };
    }
    if (type === "stream_publish") {
        return {
            streamName: "events",
            eventName: "order.created",
            payload: pathRef("input"),
            maxLen: 10000,
            outputKey: "stream_publish",
        };
    }
    if (type === "stream_consume") {
        return {
            streamName: "events",
            consumerGroup: "logic-modules",
            consumerName: "worker-a",
            lastId: "$",
            count: 10,
            blockMs: 0,
            ack: true,
            outputKey: "stream_consume",
        };
    }
    if (type === "approval_wait") {
        return {
            requestKey: pathRef("input.requestId"),
            timeoutMs: 300000,
            pollIntervalMs: 1000,
            onTimeout: "timeout",
            outputKey: "approval_wait",
        };
    }
    if (type === "saga_step") {
        return {
            execute: {
                moduleKey: "reserve_inventory",
                version: 1,
                passInput: true,
                input: {
                    orderId: pathRef("input.orderId"),
                },
            },
            compensate: {
                moduleKey: "release_inventory",
                version: 1,
                passInput: true,
                input: {
                    orderId: pathRef("input.orderId"),
                },
            },
            outputKey: "saga_step",
        };
    }
    if (type === "saga_compensate") {
        return {
            continueOnError: true,
            outputKey: "saga_compensate",
        };
    }
    if (type === "delay") {
        return {
            delayMs: 500,
            outputKey: "delay",
        };
    }
    if (type === "wait_until") {
        return {
            timestamp: literal(new Date(Date.now() + 1_000).toISOString()),
            maxWaitMs: 15_000,
            outputKey: "wait_until",
        };
    }
    if (type === "report_export") {
        return {
            sourcePath: "input.items",
            format: "json",
            columns: [
                { key: "id", path: "id" },
                { key: "amount", path: "amount" },
            ],
            batchSize: 250,
            maxRows: 1000,
            maxBytes: 131072,
            delivery: {
                type: "inline",
            },
            outputKey: "report_export",
        };
    }
    if (type === "end") return { result: "done" };
    return {};
}

function nodeConfigHint(type: WorkflowNodeType): string {
    if (type === "transform") return "Map fields from input/steps using { kind: 'path' | 'literal' }.";
    if (type === "compute") return "Use operation + values array for deterministic numeric math.";
    if (type === "aggregate") return "Reduce arrays from sourcePath with reducer/valuePath/weightPath.";
    if (type === "for_each") return "Bounded iteration with maxItems and reducer over selected item values.";
    if (type === "http_request") return "Outbound call must target allowlisted hosts and respects timeout/size/retry limits.";
    if (type === "idempotency") return "Suppress duplicate calls by key with TTL and branch on first/duplicate.";
    if (type === "lock") return "Acquire or release distributed locks for shared resources.";
    if (type === "cache") return "Read/write/delete cached values with TTL and hit/miss branching.";
    if (type === "subflow") return "Invoke another active logic module with bounded retries and recursion guard.";
    if (type === "queue_publish") return "Publish first-class queue jobs for backend worker processing with optional delay.";
    if (type === "queue_consume") return "Consume queue jobs directly in workflow runtime and route on empty/non-empty.";
    if (type === "stream_publish") return "Publish events into Redis streams for downstream consumers.";
    if (type === "stream_consume") return "Read stream events with optional consumer groups, blocking reads, and ACK.";
    if (type === "approval_wait") return "Pause for human approval with timeout routing (approved/rejected/timeout).";
    if (type === "saga_step") return "Execute a forward subflow step and register a compensation subflow for rollback.";
    if (type === "saga_compensate") return "Execute registered compensations in reverse order for long-running saga recovery.";
    if (type === "delay") return "Pause execution for bounded milliseconds in the current run.";
    if (type === "wait_until") return "Wait until target timestamp with bounded maxWaitMs safety guard.";
    if (type === "report_export") return "Export array snapshots as JSON/CSV with delivery limits (inline/cache/table).";
    return "Edit JSON config for this node. Use templates to keep schema-compliant shape.";
}

function defaultNodeTitle(type: WorkflowNodeType, index?: number): string {
    const option = NODE_TYPE_OPTIONS.find((item) => item.value === type);
    const base = option?.label ?? type;
    return typeof index === "number" ? `${base} ${index + 1}` : base;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatNodeAwareMessage(message: string, nodeTitleById: Map<string, string>): string {
    let formatted = message;

    nodeTitleById.forEach((title, nodeId) => {
        if (!title || title === nodeId) return;
        const safeNodeId = escapeRegex(nodeId);
        const withTitle = `${title} [${nodeId}]`;

        formatted = formatted
            .replace(new RegExp(`(\\bnode\\s+['"]?)${safeNodeId}(['"]?)`, "gi"), `$1${withTitle}$2`)
            .replace(new RegExp(`(\\bnodeId\\s*[:=]\\s*['"]?)${safeNodeId}(['"]?)`, "gi"), `$1${withTitle}$2`)
            .replace(new RegExp(`(\\bstep\\s+['"]?)${safeNodeId}(['"]?)`, "gi"), `$1${withTitle}$2`)
            .replace(new RegExp(`([\\[(])${safeNodeId}([\\])])`, "g"), `$1${withTitle}$2`)
            .replace(new RegExp(`(['"])${safeNodeId}\\1`, "g"), `"${withTitle}"`);
    });

    return formatted;
}

function evaluateExpression(expression: string, input: Record<string, unknown>, steps: Record<string, unknown>): boolean {
    try {
        const fn = new Function("input", "steps", `return (${expression});`);
        return Boolean(fn(input, steps));
    } catch {
        return false;
    }
}

function simulateDraftDefinition(definition: WorkflowDefinitionInput, input: Record<string, unknown>): DraftSimulationResult {
    const nodeById = new Map(definition.nodes.map((node) => [node.id, node]));
    const startNode = definition.entryNodeId
        ? nodeById.get(definition.entryNodeId)
        : definition.nodes.find((node) => node.type === "start") ?? definition.nodes[0];

    if (!startNode) {
        return { status: "failed", steps: [], error: "No start node found." };
    }

    const stepsContext: Record<string, unknown> = {};
    const steps: DraftSimulationStep[] = [];
    const maxSteps = 200;
    let currentNodeId: string | undefined = startNode.id;
    let stepCount = 0;

    while (currentNodeId && stepCount < maxSteps) {
        const node = nodeById.get(currentNodeId);
        if (!node) {
            return { status: "failed", steps, error: `Node '${currentNodeId}' not found.` };
        }

        const outgoing = definition.edges.filter((edge) => edge.from === node.id);
        let routeLabel: string | null = null;
        let nextNodeId: string | undefined = outgoing[0]?.to;
        let note: string | undefined;

        if (node.type === "filter") {
            const expression = String((node.config as Record<string, unknown>)?.expression ?? "false");
            const passed = evaluateExpression(expression, input, stepsContext);
            routeLabel = passed ? "true" : "false";
            nextNodeId = outgoing.find((edge) => edge.condition === routeLabel)?.to ?? outgoing[0]?.to;
            note = `expression: ${expression}`;
        } else if (node.type === "branch") {
            const config = node.config as Record<string, unknown>;
            const cases = Array.isArray(config?.cases) ? config.cases : [];
            const match = cases.find((value) => {
                if (!value || typeof value !== "object") return false;
                const expression = String((value as Record<string, unknown>).expression ?? "false");
                return evaluateExpression(expression, input, stepsContext);
            }) as Record<string, unknown> | undefined;

            const selectedLabel = match
                ? String(match.label ?? "")
                : String(config?.defaultLabel ?? "default");
            routeLabel = selectedLabel;
            nextNodeId = outgoing.find((edge) => edge.condition === selectedLabel)?.to ?? outgoing[0]?.to;
            note = match ? "matched case" : "default case";
        } else if (node.type === "end") {
            steps.push({
                nodeId: node.id,
                nodeType: node.type,
                title: node.id,
                routeLabel: null,
            });
            return { status: "succeeded", steps };
        }

        stepsContext[node.id] = { routeLabel };
        steps.push({
            nodeId: node.id,
            nodeType: node.type,
            title: node.id,
            routeLabel,
            ...(note ? { note } : {}),
        });

        currentNodeId = nextNodeId;
        stepCount += 1;
    }

    if (stepCount >= maxSteps) {
        return { status: "failed", steps, error: "Simulation exceeded max step count (possible cycle)." };
    }

    return {
        status: "failed",
        steps,
        error: "Simulation reached a node with no outgoing edge before an end node.",
    };
}

function flowFromDefinition(definition: WorkflowDefinitionInput): { nodes: Node<FlowData>[]; edges: Edge[] } {
    const nodes = definition.nodes.map((n, i) => ({
        id: n.id,
        type: "default",
        position: { x: 140 + (i % 4) * 260, y: 60 + Math.floor(i / 4) * 160 },
        data: {
            workflowType: n.type,
            title: n.title?.trim() || defaultNodeTitle(n.type, i),
            label: n.title?.trim() || defaultNodeTitle(n.type, i),
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
            ...(n.data.title?.trim() ? { title: n.data.title.trim() } : {}),
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
    const [simulationInput, setSimulationInput] = useState("{}");
    const [simulationResult, setSimulationResult] = useState<DraftSimulationResult | null>(null);

    const [runs, setRuns] = useState<Array<{ id: string; status: string; triggeredBy: string | null; createdAt: string; completedAt: string | null }>>([]);
    const [runsLoading, setRunsLoading] = useState(false);
    const [selectedRunTrace, setSelectedRunTrace] = useState<{ id: string; status: string; steps: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>; createdAt: string } | null>(null);
    const [isRetrying, setIsRetrying] = useState<string | null>(null);
    const [deadLetters, setDeadLetters] = useState<LogicModuleDeadLetterSummary[]>([]);
    const [deadLettersLoading, setDeadLettersLoading] = useState(false);
    const [deadLetterDetail, setDeadLetterDetail] = useState<LogicModuleDeadLetterDetail | null>(null);
    const [deadLetterDetailOpen, setDeadLetterDetailOpen] = useState(false);

    const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
    const nodeTitleById = useMemo(() => {
        const map = new Map<string, string>();
        nodes.forEach((node) => {
            map.set(node.id, node.data.title || node.data.label || node.id);
        });
        return map;
    }, [nodes]);
    const simulationNodeOrder = useMemo(() => {
        const result = new Map<string, number>();
        simulationResult?.steps.forEach((step, index) => {
            if (!result.has(step.nodeId)) {
                result.set(step.nodeId, index + 1);
            }
        });
        return result;
    }, [simulationResult]);

    const simulationEdgeSet = useMemo(() => {
        const edgesInPath = new Set<string>();
        const steps = simulationResult?.steps ?? [];
        for (let i = 0; i < steps.length - 1; i += 1) {
            edgesInPath.add(`${steps[i].nodeId}->${steps[i + 1].nodeId}`);
        }
        return edgesInPath;
    }, [simulationResult]);

    const displayNodes = useMemo(() => nodes.map((node) => {
        const order = simulationNodeOrder.get(node.id);
        const baseTitle = node.data.title || node.data.label || node.id;
        if (!order) {
            return {
                ...node,
                data: {
                    ...node.data,
                    label: baseTitle,
                },
                style: undefined,
            };
        }

        return {
            ...node,
            data: {
                ...node.data,
                label: `${order}. ${baseTitle}`,
            },
            style: {
                ...node.style,
                border: "2px solid rgb(34 197 94)",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
            },
        };
    }), [nodes, simulationNodeOrder]);

    const displayEdges = useMemo(() => edges.map((edge) => {
        const isHighlighted = simulationEdgeSet.has(`${edge.source}->${edge.target}`);
        if (!isHighlighted) {
            return {
                ...edge,
                animated: Boolean(edge.label),
                style: undefined,
            };
        }

        return {
            ...edge,
            animated: true,
            style: {
                ...edge.style,
                stroke: "rgb(34 197 94)",
                strokeWidth: 2.5,
            },
        };
    }), [edges, simulationEdgeSet]);

    const selectedNodeConfig = useMemo<Record<string, unknown> | null>(() => {
        if (!selectedNode) return null;
        try {
            const parsed = JSON.parse(selectedNode.data.configText || "{}");
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed as Record<string, unknown>
                : null;
        } catch {
            return null;
        }
    }, [selectedNode]);

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

        const position = rf.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const nodeId = `${type}_${Date.now().toString(36)}`;
        const title = defaultNodeTitle(type, nodes.length);
        const nextNode: Node<FlowData> = {
            id: nodeId,
            type: "default",
            position,
            data: {
                workflowType: type,
                title,
                label: title,
                configText: JSON.stringify(defaultNodeConfig(type), null, 2),
            },
        };
        setNodes((prev) => [...prev, nextNode]);
        setSelectedNodeId(nodeId);
    };

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    const addNode = () => {
        const nodeId = `${paletteNodeType}_${Date.now().toString(36)}`;
        const title = defaultNodeTitle(paletteNodeType, nodes.length);
        setNodes((prev) => [
            ...prev,
            {
                id: nodeId,
                type: "default",
                position: { x: 150 + prev.length * 30, y: 120 + prev.length * 20 },
                data: {
                    workflowType: paletteNodeType,
                    title,
                    label: title,
                    configText: JSON.stringify(defaultNodeConfig(paletteNodeType), null, 2),
                },
            },
        ]);
        setSelectedNodeId(nodeId);
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

    const updateSelectedNodeTitle = (title: string) => {
        if (!selectedNodeId) return;
        setNodes((prev) =>
            prev.map((n) =>
                n.id === selectedNodeId
                    ? { ...n, data: { ...n.data, title, label: title } }
                    : n,
            ),
        );
    };

    const patchSelectedNodeConfig = (patch: Record<string, unknown>) => {
        if (!selectedNodeConfig) return;
        updateSelectedNodeConfig(JSON.stringify({ ...selectedNodeConfig, ...patch }, null, 2));
    };

    const setValueSourcePath = (field: string, value: string) => {
        if (!selectedNodeConfig) return;
        const existing = selectedNodeConfig[field];
        const next = {
            ...(selectedNodeConfig as Record<string, unknown>),
            [field]: {
                ...(existing && typeof existing === "object" ? existing as Record<string, unknown> : {}),
                kind: "path",
                path: value,
            },
        };
        updateSelectedNodeConfig(JSON.stringify(next, null, 2));
    };

    const applySelectedNodeTemplate = () => {
        if (!selectedNode) return;
        const template = defaultNodeConfig(selectedNode.data.workflowType);
        updateSelectedNodeConfig(JSON.stringify(template, null, 2));
        setMessage(`Applied ${selectedNode.data.workflowType} template.`);
    };

    const formatSelectedNodeConfig = () => {
        if (!selectedNode) return;
        try {
            const parsed = JSON.parse(selectedNode.data.configText || "{}");
            updateSelectedNodeConfig(JSON.stringify(parsed, null, 2));
            setMessage("Formatted selected node config JSON.");
        } catch {
            setMessage("Selected node config is invalid JSON.");
        }
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

    const simulateDraft = () => {
        setSimulationResult(null);

        try {
            let parsedInput: Record<string, unknown> = {};
            try {
                const parsed = JSON.parse(simulationInput);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    parsedInput = parsed as Record<string, unknown>;
                }
            } catch {
                // Keep empty input when invalid JSON is entered.
            }

            const definition = definitionFromFlow(
                nodes,
                edges,
                triggerType,
                triggerTableName,
                triggerWatchFields,
                triggerCron,
                triggerSecret,
            );

            const simulated = simulateDraftDefinition(definition, parsedInput);
            const titleById = new Map(nodes.map((node) => [node.id, node.data.title || node.data.label || node.id]));

            setSimulationResult({
                ...simulated,
                steps: simulated.steps.map((step) => ({
                    ...step,
                    title: titleById.get(step.nodeId) ?? step.nodeId,
                })),
            });
        } catch {
            setSimulationResult({
                status: "failed",
                steps: [],
                error: "Simulation failed due to invalid graph or config.",
            });
        }
    };

    const clearSimulation = () => {
        setSimulationResult(null);
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
                            {NODE_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
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
                            nodes={displayNodes}
                            edges={displayEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={(instance) => setRf(instance)}
                            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                            onPaneClick={() => setSelectedNodeId(null)}
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
                            <div className="space-y-1">
                                <Label className="text-xs">Node Title</Label>
                                <Input
                                    value={selectedNode.data.title || ""}
                                    onChange={(e) => updateSelectedNodeTitle(e.target.value)}
                                    placeholder="Node title"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">{nodeConfigHint(selectedNode.data.workflowType)}</p>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={applySelectedNodeTemplate}>Apply Template</Button>
                                <Button type="button" variant="outline" size="sm" onClick={formatSelectedNodeConfig}>Format JSON</Button>
                            </div>
                            {selectedNodeConfig && selectedNode.data.workflowType === "delay" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Delay (ms)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={30000}
                                        value={Number(selectedNodeConfig.delayMs ?? 500)}
                                        onChange={(e) => patchSelectedNodeConfig({ delayMs: Number(e.target.value || 500) })}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Bounded to 1-30000ms in runtime.</p>
                                </div>
                            )}
                            {selectedNodeConfig && selectedNode.data.workflowType === "wait_until" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Timestamp Path</Label>
                                    <Input
                                        value={String((selectedNodeConfig.timestamp as any)?.path ?? "input.resumeAt")}
                                        onChange={(e) => setValueSourcePath("timestamp", e.target.value)}
                                        placeholder="input.resumeAt"
                                    />
                                    <Label className="text-xs">Max Wait (ms)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={30000}
                                        value={Number(selectedNodeConfig.maxWaitMs ?? 15000)}
                                        onChange={(e) => patchSelectedNodeConfig({ maxWaitMs: Number(e.target.value || 15000) })}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Use ISO timestamp in input for precise scheduling.</p>
                                </div>
                            )}
                            {selectedNodeConfig && selectedNode.data.workflowType === "report_export" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Source Path</Label>
                                    <Input
                                        value={String(selectedNodeConfig.sourcePath ?? "input.items")}
                                        onChange={(e) => patchSelectedNodeConfig({ sourcePath: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Format</Label>
                                            <select
                                                className="w-full h-8 px-2 border rounded-md bg-background text-xs"
                                                value={String(selectedNodeConfig.format ?? "json")}
                                                onChange={(e) => patchSelectedNodeConfig({ format: e.target.value })}
                                            >
                                                <option value="json">json</option>
                                                <option value="csv">csv</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Delivery</Label>
                                            <select
                                                className="w-full h-8 px-2 border rounded-md bg-background text-xs"
                                                value={String((selectedNodeConfig.delivery as any)?.type ?? "inline")}
                                                onChange={(e) => patchSelectedNodeConfig({ delivery: { ...(selectedNodeConfig.delivery as Record<string, unknown> ?? {}), type: e.target.value } })}
                                            >
                                                <option value="inline">inline</option>
                                                <option value="cache">cache</option>
                                                <option value="table">table</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5000}
                                            value={Number(selectedNodeConfig.maxRows ?? 1000)}
                                            onChange={(e) => patchSelectedNodeConfig({ maxRows: Number(e.target.value || 1000) })}
                                            placeholder="max rows"
                                        />
                                        <Input
                                            type="number"
                                            min={256}
                                            max={1048576}
                                            value={Number(selectedNodeConfig.maxBytes ?? 131072)}
                                            onChange={(e) => patchSelectedNodeConfig({ maxBytes: Number(e.target.value || 131072) })}
                                            placeholder="max bytes"
                                        />
                                    </div>
                                </div>
                            )}
                            {selectedNodeConfig && selectedNode.data.workflowType === "http_request" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Request URL Path</Label>
                                    <Input
                                        value={String((selectedNodeConfig.url as any)?.path ?? "input.targetUrl")}
                                        onChange={(e) => setValueSourcePath("url", e.target.value)}
                                        placeholder="input.targetUrl"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Method</Label>
                                            <select
                                                className="w-full h-8 px-2 border rounded-md bg-background text-xs"
                                                value={String(selectedNodeConfig.method ?? "GET")}
                                                onChange={(e) => patchSelectedNodeConfig({ method: e.target.value })}
                                            >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="PATCH">PATCH</option>
                                                <option value="DELETE">DELETE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Auth Secret Ref</Label>
                                            <Input
                                                value={String(selectedNodeConfig.authHeaderSecretRef ?? "")}
                                                onChange={(e) => patchSelectedNodeConfig({ authHeaderSecretRef: e.target.value || undefined })}
                                                placeholder="externalApiToken"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            min={100}
                                            max={15000}
                                            value={Number(selectedNodeConfig.timeoutMs ?? 3000)}
                                            onChange={(e) => patchSelectedNodeConfig({ timeoutMs: Number(e.target.value || 3000) })}
                                            placeholder="timeout ms"
                                        />
                                        <Input
                                            type="number"
                                            min={1}
                                            max={262144}
                                            value={Number(selectedNodeConfig.maxResponseBytes ?? 32768)}
                                            onChange={(e) => patchSelectedNodeConfig({ maxResponseBytes: Number(e.target.value || 32768) })}
                                            placeholder="max response bytes"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={262144}
                                            value={Number(selectedNodeConfig.maxRequestBytes ?? 32768)}
                                            onChange={(e) => patchSelectedNodeConfig({ maxRequestBytes: Number(e.target.value || 32768) })}
                                            placeholder="max request bytes"
                                        />
                                        <Input
                                            value={String((selectedNodeConfig.allowedHosts as string[] | undefined)?.join(",") ?? "")}
                                            onChange={(e) => patchSelectedNodeConfig({ allowedHosts: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                                            placeholder="api.example.com"
                                        />
                                    </div>
                                </div>
                            )}
                            {selectedNodeConfig && selectedNode.data.workflowType === "filter" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Expression Builder</Label>
                                    <Input
                                        value={String(selectedNodeConfig.expression ?? "")}
                                        onChange={(e) => patchSelectedNodeConfig({ expression: e.target.value })}
                                        placeholder="input.amount > 100 && input.status == 'open'"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Supports logical and comparison operators with bounded complexity.</p>
                                </div>
                            )}
                            {selectedNodeConfig && selectedNode.data.workflowType === "subflow" && (
                                <div className="space-y-2 rounded-md border p-2">
                                    <Label className="text-xs">Subflow Module Key</Label>
                                    <Input
                                        value={String(selectedNodeConfig.moduleKey ?? "")}
                                        onChange={(e) => patchSelectedNodeConfig({ moduleKey: e.target.value })}
                                    />
                                    <Label className="text-xs">Pinned Version (optional)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={selectedNodeConfig.version == null ? "" : Number(selectedNodeConfig.version)}
                                        onChange={(e) => patchSelectedNodeConfig({ version: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="leave empty for active version"
                                    />
                                </div>
                            )}
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
                                    <p key={i}>
                                        {nodeTitleById.get(t.nodeId) ?? t.nodeId}
                                        <span className="opacity-70"> [{t.nodeId}]</span>: {t.status}
                                        {t.error ? ` — ${t.error}` : ""}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t space-y-2">
                        <Label>Draft Simulation (Local)</Label>
                        <p className="text-[11px] text-muted-foreground">
                            Preview execution path locally before publishing. Filter and branch expressions are evaluated against the sample input.
                        </p>
                        <Textarea
                            value={simulationInput}
                            onChange={(e) => setSimulationInput(e.target.value)}
                            className="min-h-[80px] font-mono text-xs"
                            placeholder='{"score": 8, "amount": 120}'
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={simulateDraft}
                                className="w-full"
                            >
                                Simulate Draft
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearSimulation}
                                disabled={!simulationResult}
                            >
                                Clear
                            </Button>
                        </div>
                        {simulationResult && (
                            <div className={`text-xs p-2 rounded border font-mono ${
                                simulationResult.status === "succeeded"
                                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                            }`}>
                                <p className="font-semibold mb-1">{simulationResult.status === "succeeded" ? "SIMULATION SUCCEEDED" : "SIMULATION FAILED"}</p>
                                {simulationResult.steps.slice(0, 12).map((step, index) => (
                                    <p key={`${step.nodeId}-${index}`}>
                                        {step.title} ({step.nodeType})
                                        {step.routeLabel ? ` -> ${step.routeLabel}` : ""}
                                        {step.note ? ` [${step.note}]` : ""}
                                    </p>
                                ))}
                                {simulationResult.error ? <p className="mt-1">{simulationResult.error}</p> : null}
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
                                        <span className="text-muted-foreground">{nodeTitleById.get(step.nodeId) ?? step.nodeId}</span>
                                        <span className="opacity-70">[{step.nodeId}]</span>
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
                                        {formatNodeAwareMessage(deadLetter.reason || deadLetter.runErrorSummary || "Execution failed", nodeTitleById)}
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
                                <p className="text-sm mt-1">{formatNodeAwareMessage(deadLetterDetail.reason || deadLetterDetail.runErrorSummary || "Unknown error", nodeTitleById)}</p>
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
