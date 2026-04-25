import api from './api';

export interface LogicModuleDefinition {
    id: string;
    projectId: string;
    moduleKey: string;
    displayName: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    activeVersionId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface LogicModuleDefinitionDetail extends LogicModuleDefinition {
    versions: LogicModuleVersion[];
}

export interface LogicModuleVersion {
    id: string;
    versionNumber: number;
    checksum: string | null;
    createdBy: string | null;
    createdAt: string;
}

export interface WorkflowNodeInput {
    id: string;
    type: 'start' | 'filter' | 'branch' | 'read_table' | 'write_table' | 'notify' | 'end';
    config: Record<string, unknown>;
}

export interface WorkflowEdgeInput {
    from: string;
    to: string;
    condition?: string;
}

export interface WorkflowTriggerInput {
    type: 'manual' | 'row_created' | 'row_updated' | 'scheduled' | 'webhook';
    config: Record<string, unknown>;
}

export interface WorkflowDefinitionInput {
    nodes: WorkflowNodeInput[];
    edges: WorkflowEdgeInput[];
    triggers: WorkflowTriggerInput[];
    entryNodeId?: string;
}

export type LogicModuleCrudMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface LogicModuleDeadLetterSummary {
    id: string;
    moduleRunId?: string;
    reason?: string;
    retryCount?: number;
    createdAt: string;
    runStatus?: string;
    runErrorSummary?: string | null;
}

export interface LogicModuleDeadLetterDetail extends LogicModuleDeadLetterSummary {
    payloadJson?: unknown;
    triggerEventId?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODULE_KEY_PATTERN = /^[a-z][a-z0-9_-]{2,99}$/;
const SIGNATURE_PATTERN = /^sha256=[a-f0-9]{64}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function assertProjectId(projectId: string): void {
    assert(typeof projectId === 'string' && UUID_PATTERN.test(projectId), 'Invalid projectId');
}

function assertModuleKey(moduleKey: string): void {
    assert(typeof moduleKey === 'string' && MODULE_KEY_PATTERN.test(moduleKey), 'Invalid moduleKey');
}

function assertUuid(value: string, fieldName: string): void {
    assert(typeof value === 'string' && UUID_PATTERN.test(value), `Invalid ${fieldName}`);
}

function assertVersionNumber(versionNumber: number): void {
    assert(Number.isInteger(versionNumber) && versionNumber > 0, 'Invalid version number');
}

function assertSignature(signature?: string): void {
    if (signature === undefined) return;
    assert(SIGNATURE_PATTERN.test(signature), 'Invalid signature format');
}

function assertWorkflowDefinition(definitionJson: WorkflowDefinitionInput): void {
    assert(isRecord(definitionJson), 'Invalid workflow definition');
    assert(Array.isArray(definitionJson.nodes) && definitionJson.nodes.length >= 2, 'Workflow must contain at least 2 nodes');
    assert(Array.isArray(definitionJson.edges) && definitionJson.edges.length >= 1, 'Workflow must contain at least 1 edge');
    assert(Array.isArray(definitionJson.triggers) && definitionJson.triggers.length >= 1, 'Workflow must contain at least 1 trigger');
}

function unwrapDataEnvelope(payload: unknown): unknown {
    if (!isRecord(payload)) {
        throw new Error('Invalid API response envelope');
    }
    return payload.data;
}

function ensureArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
    if (!Array.isArray(value)) return [];
    return value.map(mapper);
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === 'string' && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function optionalStringOrNull(value: unknown): string | null {
    if (value == null) return null;
    assert(typeof value === 'string', 'Expected string or null');
    return value;
}

function requiredNumber(value: unknown, fieldName: string): number {
    assert(typeof value === 'number' && Number.isFinite(value), `${fieldName} must be a number`);
    return value;
}

function asLogicModuleDefinition(value: unknown): LogicModuleDefinition {
    assert(isRecord(value), 'Invalid module definition');
    const status = value.status;
    assert(status === 'draft' || status === 'active' || status === 'archived', 'Invalid module status');
    const id = requiredString(value.id, 'module.id');
    const projectId = requiredString(value.projectId, 'module.projectId');
    const moduleKey = requiredString(value.moduleKey, 'module.moduleKey');
    const displayName = requiredString(value.displayName, 'module.displayName');
    const createdAt = requiredString(value.createdAt, 'module.createdAt');
    const updatedAt = requiredString(value.updatedAt, 'module.updatedAt');

    if (value.activeVersionId != null) {
        assert(typeof value.activeVersionId === 'string', 'module.activeVersionId must be a string when present');
    }

    return {
        id,
        projectId,
        moduleKey,
        displayName,
        description: optionalStringOrNull(value.description),
        status,
        activeVersionId: value.activeVersionId == null ? null : value.activeVersionId,
        metadata: isRecord(value.metadata) ? value.metadata : {},
        createdAt,
        updatedAt,
    };
}

function asLogicModuleVersion(value: unknown): LogicModuleVersion {
    assert(isRecord(value), 'Invalid module version');
    const id = requiredString(value.id, 'version.id');
    const versionNumber = requiredNumber(value.versionNumber, 'version.versionNumber');
    assert(Number.isInteger(versionNumber) && versionNumber > 0, 'version.versionNumber must be a positive integer');
    const createdAt = requiredString(value.createdAt, 'version.createdAt');

    return {
        id,
        versionNumber,
        checksum: optionalStringOrNull(value.checksum),
        createdBy: optionalStringOrNull(value.createdBy),
        createdAt,
    };
}

function asRun(value: unknown): {
    id: string;
    status: 'succeeded' | 'failed' | 'running';
    triggeredBy: string | null;
    createdAt: string;
    completedAt: string | null;
} {
    assert(isRecord(value), 'Invalid run item');
    assert(value.status === 'succeeded' || value.status === 'failed' || value.status === 'running', 'Invalid run status');
    const createdAt = value.createdAt ?? value.startedAt;
    const completedAt = value.completedAt ?? value.finishedAt ?? null;
    const id = requiredString(value.id, 'run.id');
    const triggeredBy = optionalStringOrNull(value.triggeredBy);
    assert(createdAt != null && typeof createdAt === 'string', 'run.createdAt is required');
    if (completedAt != null) {
        assert(typeof completedAt === 'string', 'run.completedAt must be a string when present');
    }

    return {
        id,
        status: value.status,
        triggeredBy,
        createdAt,
        completedAt,
    };
}

function asDeadLetterSummary(value: unknown): LogicModuleDeadLetterSummary {
    assert(isRecord(value), 'Invalid dead letter summary');
    const id = requiredString(value.id, 'deadLetter.id');
    const createdAt = requiredString(value.createdAt, 'deadLetter.createdAt');
    const retryCount = value.retryCount == null ? undefined : requiredNumber(value.retryCount, 'deadLetter.retryCount');
    return {
        id,
        moduleRunId: value.moduleRunId == null ? undefined : requiredString(value.moduleRunId, 'deadLetter.moduleRunId'),
        reason: value.reason == null ? undefined : requiredString(value.reason, 'deadLetter.reason'),
        retryCount,
        createdAt,
        runStatus: value.runStatus == null ? undefined : requiredString(value.runStatus, 'deadLetter.runStatus'),
        runErrorSummary: optionalStringOrNull(value.runErrorSummary),
    };
}

function asRunResult(value: unknown): {
    runId: string;
    status: 'succeeded' | 'failed';
    traces: Array<{ stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
} {
    assert(isRecord(value), 'Invalid module execution response');
    assert(value.status === 'succeeded' || value.status === 'failed', 'Invalid module execution status');
    const runId = requiredString(value.runId, 'runId');
    const traces = ensureArray(value.traces, (trace): { stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string } => {
        assert(isRecord(trace), 'Invalid trace item');
        const stepIndex = requiredNumber(trace.stepIndex ?? 0, 'trace.stepIndex');
        assert(Number.isInteger(stepIndex) && stepIndex >= 0, 'trace.stepIndex must be a non-negative integer');
        return {
            stepIndex,
            nodeId: requiredString(trace.nodeId, 'trace.nodeId'),
            nodeType: requiredString(trace.nodeType, 'trace.nodeType'),
            status: requiredString(trace.status, 'trace.status'),
            output: trace.output,
            error: trace.error == null ? undefined : requiredString(trace.error, 'trace.error'),
        };
    });

    return {
        runId,
        status: value.status,
        traces,
    };
}

const LogicModuleService = {
    async list(projectId: string): Promise<LogicModuleDefinition[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/modules/${projectId}`);
        return ensureArray(unwrapDataEnvelope(data), asLogicModuleDefinition);
    },

    async createDefinition(projectId: string, payload: {
        moduleKey: string;
        displayName: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }): Promise<LogicModuleDefinition> {
        assertProjectId(projectId);
        assertModuleKey(payload.moduleKey);
        assert(typeof payload.displayName === 'string' && payload.displayName.trim().length > 0, 'displayName is required');
        const { data } = await api.post(`/modules/${projectId}`, payload);
        return asLogicModuleDefinition(unwrapDataEnvelope(data));
    },

    async updateDefinition(projectId: string, moduleKey: string, payload: {
        displayName?: string;
        description?: string | null;
        metadata?: Record<string, unknown>;
    }): Promise<LogicModuleDefinition> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        const { data } = await api.patch(`/modules/${projectId}/${moduleKey}`, payload);
        return asLogicModuleDefinition(unwrapDataEnvelope(data));
    },

    async getDefinition(projectId: string, moduleKey: string): Promise<LogicModuleDefinitionDetail> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}`);
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), 'Invalid module definition detail');
        return {
            ...asLogicModuleDefinition(raw),
            versions: ensureArray(raw.versions, asLogicModuleVersion),
        };
    },

    async listVersions(projectId: string, moduleKey: string): Promise<LogicModuleVersion[]> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/versions`);
        return ensureArray(unwrapDataEnvelope(data), asLogicModuleVersion);
    },

    async createVersion(projectId: string, moduleKey: string, definitionJson: WorkflowDefinitionInput): Promise<LogicModuleVersion> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertWorkflowDefinition(definitionJson);
        const { data } = await api.post(`/modules/${projectId}/${moduleKey}/versions`, { definitionJson });
        return asLogicModuleVersion(unwrapDataEnvelope(data));
    },

    async getVersionDefinition(projectId: string, moduleKey: string, versionNumber: number): Promise<{
        definitionJson: WorkflowDefinitionInput;
        versionNumber: number;
    }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertVersionNumber(versionNumber);
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/definition`);
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), 'Invalid version definition response');
        const definitionJson = raw.definitionJson as WorkflowDefinitionInput;
        assertWorkflowDefinition(definitionJson);
        return {
            definitionJson,
            versionNumber: Number(raw.versionNumber || versionNumber),
        };
    },

    async activateVersion(projectId: string, moduleKey: string, versionNumber: number): Promise<void> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertVersionNumber(versionNumber);
        await api.post(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/activate`, {});
    },

    async rollbackVersion(projectId: string, moduleKey: string, versionNumber: number): Promise<void> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertVersionNumber(versionNumber);
        await api.post(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/rollback`, {});
    },

    async archiveDefinition(projectId: string, moduleKey: string): Promise<void> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        await api.post(`/modules/${projectId}/${moduleKey}/archive`, {});
    },

    async executeModule(projectId: string, moduleKey: string, input?: Record<string, unknown>): Promise<{
        runId: string;
        status: 'succeeded' | 'failed';
        traces: Array<{ stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
    }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assert(input === undefined || isRecord(input), 'input must be an object');
        const { data } = await api.post(`/modules/${projectId}/${moduleKey}/execute`, { input: input ?? {} });
        return asRunResult(unwrapDataEnvelope(data));
    },

    async listRuns(projectId: string, moduleKey: string, params?: { status?: string; limit?: number; offset?: number }): Promise<Array<{
        id: string;
        status: 'succeeded' | 'failed' | 'running';
        triggeredBy: string | null;
        createdAt: string;
        completedAt: string | null;
    }>> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/runs`, { params });
        return ensureArray(unwrapDataEnvelope(data), asRun);
    },

    async getRunTrace(projectId: string, moduleKey: string, runId: string): Promise<{
        id: string;
        status: string;
        triggeredBy: string | null;
        createdAt: string;
        completedAt: string | null;
        steps: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
    }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertUuid(runId, 'runId');
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/runs/${runId}`);
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), 'Invalid run trace response');
        const steps = ensureArray(raw.steps, (step): { nodeId: string; nodeType: string; status: string; output?: unknown; error?: string } => {
            assert(isRecord(step), 'Invalid run step');
            return {
                nodeId: requiredString(step.nodeId, 'step.nodeId'),
                nodeType: requiredString(step.nodeType, 'step.nodeType'),
                status: requiredString(step.status, 'step.status'),
                output: step.output,
                error: step.error == null ? undefined : requiredString(step.error, 'step.error'),
            };
        });

        const traceId = requiredString(raw.id, 'trace.id');
        const traceStatus = requiredString(raw.status, 'trace.status');
        const createdAt = raw.createdAt ?? raw.startedAt;
        assert(typeof createdAt === 'string' && createdAt.length > 0, 'trace.createdAt is required');
        const completedAtRaw = raw.completedAt ?? null;
        if (completedAtRaw != null) {
            assert(typeof completedAtRaw === 'string', 'trace.completedAt must be a string when present');
        }

        return {
            id: traceId,
            status: traceStatus,
            triggeredBy: optionalStringOrNull(raw.triggeredBy),
            createdAt,
            completedAt: completedAtRaw,
            steps,
        };
    },

    async retryRun(projectId: string, moduleKey: string, runId: string): Promise<void> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertUuid(runId, 'runId');
        await api.post(`/modules/${projectId}/${moduleKey}/runs/${runId}/retry`, {});
    },

    async listDeadLetters(projectId: string, moduleKey: string, params?: { limit?: number; offset?: number }): Promise<Array<{
        id: string;
        moduleRunId?: string;
        reason?: string;
        retryCount?: number;
        createdAt: string;
        runStatus?: string;
        runErrorSummary?: string | null;
    }>> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/dead-letters`, { params });
        return ensureArray(unwrapDataEnvelope(data), asDeadLetterSummary);
    },

    async getDeadLetter(projectId: string, moduleKey: string, deadLetterId: string): Promise<LogicModuleDeadLetterDetail> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertUuid(deadLetterId, 'deadLetterId');
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/dead-letters/${deadLetterId}`);
        const raw = unwrapDataEnvelope(data);
        const summary = asDeadLetterSummary(raw);
        const record = isRecord(raw) ? raw : {};
        return {
            ...summary,
            payloadJson: record.payloadJson,
            triggerEventId: record.triggerEventId == null ? null : String(record.triggerEventId),
        };
    },

    async invokeWebhookPublic(
        projectId: string,
        moduleKey: string,
        payload: Record<string, unknown>,
        signature?: string,
    ): Promise<{ status: 'accepted'; runId: string }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assert(isRecord(payload), 'payload must be an object');
        assertSignature(signature);
        const headers: Record<string, string> = {};
        if (signature) headers['x-webhook-signature'] = signature;

        const { data } = await api.post(`/modules/${projectId}/${moduleKey}/webhook`, payload, { headers });
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), 'Invalid webhook invoke response');
        const runId = requiredString(raw.runId, 'runId');

        return {
            status: 'accepted',
            runId,
        };
    },

    async invokeCrudPublic(
        projectId: string,
        moduleKey: string,
        method: LogicModuleCrudMethod,
        options?: {
            resourceId?: string;
            query?: Record<string, unknown>;
            body?: Record<string, unknown>;
            signature?: string;
        },
    ): Promise<{
        runId: string;
        status: 'succeeded' | 'failed';
        traces: Array<{ stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
    }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assert(method === 'GET' || method === 'POST' || method === 'PATCH' || method === 'DELETE', 'Invalid CRUD method');
        if (options?.resourceId !== undefined) {
            assert(typeof options.resourceId === 'string' && options.resourceId.trim().length > 0, 'Invalid resourceId');
        }
        if (options?.query !== undefined) {
            assert(isRecord(options.query), 'query must be an object');
        }
        if (options?.body !== undefined) {
            assert(isRecord(options.body), 'body must be an object');
        }
        assertSignature(options?.signature);

        const headers: Record<string, string> = {};
        if (options?.signature) headers['x-webhook-signature'] = options.signature;

        const path = options?.resourceId
            ? `/modules/${projectId}/${moduleKey}/crud/${encodeURIComponent(options.resourceId)}`
            : `/modules/${projectId}/${moduleKey}/crud`;

        const { data } = await api.request({
            method,
            url: path,
            params: options?.query,
            data: options?.body ?? {},
            headers,
        });

        return asRunResult(unwrapDataEnvelope(data));
    },
};

export default LogicModuleService;
