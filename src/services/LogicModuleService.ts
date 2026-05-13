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
    title?: string;
    type:
        | 'start'
        | 'filter'
        | 'branch'
        | 'read_table'
        | 'write_table'
        | 'notify'
        | 'transform'
        | 'compute'
        | 'aggregate'
        | 'for_each'
        | 'http_request'
        | 'idempotency'
        | 'lock'
        | 'cache'
        | 'subflow'
        | 'queue_publish'
        | 'queue_consume'
        | 'stream_publish'
        | 'stream_consume'
        | 'approval_wait'
        | 'saga_step'
        | 'saga_compensate'
        | 'submit_compute_job'
        | 'run_transaction_unit'
        | 'media_pipeline'
        | 'fast_path_dispatch'
        | 'delay'
        | 'wait_until'
        | 'report_export'
        | 'end';
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

export interface LogicModuleReadinessCheck {
    key: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
}

export interface LogicModuleOpsSummary {
    projectId: string;
    moduleKey: string | null;
    windowHours: number;
    generatedAt: string;
    modules: {
        total: number;
        active: number;
        draft: number;
        archived: number;
        needingAttention: number;
    };
    runs: {
        total: number;
        running: number;
        succeeded: number;
        failed: number;
        deadLettered: number;
        retried: number;
        p95DurationMs: number | null;
    };
    deadLetters: {
        total: number;
        retryCount: number;
    };
    retention: {
        runRetentionDays: number;
        sweepIntervalMinutes: number;
    };
    recentFailures: Array<{
        id: string;
        moduleKey: string;
        status: string;
        errorSummary: string | null;
        startedAt: string;
    }>;
    brokerReadiness?: {
        summary?: {
            ready?: number;
            notConfigured?: number;
            failing?: number;
        };
    };
}

export interface LogicModuleReadiness {
    projectId: string;
    status: 'ready' | 'degraded' | 'blocked';
    generatedAt: string;
    checks: LogicModuleReadinessCheck[];
    ops: LogicModuleOpsSummary;
    triggerBackfill?: {
        mode: 'dry-run' | 'apply';
        scannedVersions: number;
        versionsMissingTriggers: number;
        insertedTriggers: number;
        skippedInvalidDefinitions: number;
    };
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
    status: 'succeeded' | 'failed' | 'running' | 'dead_lettered';
    triggeredBy: string | null;
    createdAt: string;
    completedAt: string | null;
} {
    assert(isRecord(value), 'Invalid run item');
    assert(
        value.status === 'succeeded' ||
        value.status === 'failed' ||
        value.status === 'running' ||
        value.status === 'dead_lettered',
        'Invalid run status',
    );
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
    status: 'succeeded' | 'failed' | 'dead_lettered';
    traces: Array<{ stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
} {
    assert(isRecord(value), 'Invalid module execution response');
    assert(
        value.status === 'succeeded' || value.status === 'failed' || value.status === 'dead_lettered',
        'Invalid module execution status',
    );
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

function asOpsSummary(value: unknown): LogicModuleOpsSummary {
    assert(isRecord(value), 'Invalid ops summary');
    const modules = isRecord(value.modules) ? value.modules : {};
    const runs = isRecord(value.runs) ? value.runs : {};
    const deadLetters = isRecord(value.deadLetters) ? value.deadLetters : {};
    const retention = isRecord(value.retention) ? value.retention : {};
    return {
        projectId: requiredString(value.projectId, 'ops.projectId'),
        moduleKey: value.moduleKey == null ? null : requiredString(value.moduleKey, 'ops.moduleKey'),
        windowHours: requiredNumber(value.windowHours, 'ops.windowHours'),
        generatedAt: requiredString(value.generatedAt, 'ops.generatedAt'),
        modules: {
            total: Number(modules.total ?? 0),
            active: Number(modules.active ?? 0),
            draft: Number(modules.draft ?? 0),
            archived: Number(modules.archived ?? 0),
            needingAttention: Number(modules.needingAttention ?? 0),
        },
        runs: {
            total: Number(runs.total ?? 0),
            running: Number(runs.running ?? 0),
            succeeded: Number(runs.succeeded ?? 0),
            failed: Number(runs.failed ?? 0),
            deadLettered: Number(runs.deadLettered ?? 0),
            retried: Number(runs.retried ?? 0),
            p95DurationMs: runs.p95DurationMs == null ? null : Number(runs.p95DurationMs),
        },
        deadLetters: {
            total: Number(deadLetters.total ?? 0),
            retryCount: Number(deadLetters.retryCount ?? 0),
        },
        retention: {
            runRetentionDays: Number(retention.runRetentionDays ?? 0),
            sweepIntervalMinutes: Number(retention.sweepIntervalMinutes ?? 0),
        },
        recentFailures: ensureArray(value.recentFailures, (item) => {
            assert(isRecord(item), 'Invalid recent failure');
            return {
                id: requiredString(item.id, 'failure.id'),
                moduleKey: requiredString(item.moduleKey, 'failure.moduleKey'),
                status: requiredString(item.status, 'failure.status'),
                errorSummary: optionalStringOrNull(item.errorSummary),
                startedAt: requiredString(item.startedAt, 'failure.startedAt'),
            };
        }),
        brokerReadiness: isRecord(value.brokerReadiness) ? value.brokerReadiness as LogicModuleOpsSummary['brokerReadiness'] : undefined,
    };
}

function asReadiness(value: unknown): LogicModuleReadiness {
    assert(isRecord(value), 'Invalid readiness response');
    assert(value.status === 'ready' || value.status === 'degraded' || value.status === 'blocked', 'Invalid readiness status');
    return {
        projectId: requiredString(value.projectId, 'readiness.projectId'),
        status: value.status,
        generatedAt: requiredString(value.generatedAt, 'readiness.generatedAt'),
        checks: ensureArray(value.checks, (check) => {
            assert(isRecord(check), 'Invalid readiness check');
            assert(check.status === 'pass' || check.status === 'warn' || check.status === 'fail', 'Invalid check status');
            return {
                key: requiredString(check.key, 'check.key'),
                label: requiredString(check.label, 'check.label'),
                status: check.status,
                message: requiredString(check.message, 'check.message'),
            };
        }),
        ops: asOpsSummary(value.ops),
        triggerBackfill: isRecord(value.triggerBackfill)
            ? {
                mode: value.triggerBackfill.mode === 'apply' ? 'apply' : 'dry-run',
                scannedVersions: Number(value.triggerBackfill.scannedVersions ?? 0),
                versionsMissingTriggers: Number(value.triggerBackfill.versionsMissingTriggers ?? 0),
                insertedTriggers: Number(value.triggerBackfill.insertedTriggers ?? 0),
                skippedInvalidDefinitions: Number(value.triggerBackfill.skippedInvalidDefinitions ?? 0),
            }
            : undefined,
    };
}

const LogicModuleService = {
    async list(projectId: string): Promise<LogicModuleDefinition[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/modules/${projectId}`);
        return ensureArray(unwrapDataEnvelope(data), asLogicModuleDefinition);
    },

    async getReadiness(projectId: string): Promise<LogicModuleReadiness> {
        assertProjectId(projectId);
        const { data } = await api.get(`/modules/${projectId}/readiness`);
        return asReadiness(unwrapDataEnvelope(data));
    },

    async getOpsSummary(projectId: string, moduleKey?: string, params?: { windowHours?: number }): Promise<LogicModuleOpsSummary> {
        assertProjectId(projectId);
        if (moduleKey) {
            assertModuleKey(moduleKey);
        }
        const url = moduleKey
            ? `/modules/${projectId}/${moduleKey}/ops/summary`
            : `/modules/${projectId}/ops/summary`;
        const { data } = await api.get(url, { params });
        return asOpsSummary(unwrapDataEnvelope(data));
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
        status: 'succeeded' | 'failed' | 'dead_lettered';
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
        status: 'succeeded' | 'failed' | 'running' | 'dead_lettered';
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
        steps: Array<{ nodeId: string; nodeType: string; status: string; input?: unknown; output?: unknown; error?: string }>;
    }> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertUuid(runId, 'runId');
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/runs/${runId}`);
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), 'Invalid run trace response');
        const run = isRecord(raw.run) ? raw.run : raw;
        const steps = ensureArray(raw.steps, (step): { nodeId: string; nodeType: string; status: string; input?: unknown; output?: unknown; error?: string } => {
            assert(isRecord(step), 'Invalid run step');
            const errorJson = isRecord(step.errorJson) ? step.errorJson : null;
            return {
                nodeId: requiredString(step.nodeId ?? step.stepKey, 'step.nodeId'),
                nodeType: requiredString(step.nodeType ?? step.stepType, 'step.nodeType'),
                status: requiredString(step.status, 'step.status'),
                input: step.input ?? step.inputJson,
                output: step.output ?? step.outputJson,
                error: step.error == null
                    ? (errorJson?.message == null ? undefined : String(errorJson.message))
                    : requiredString(step.error, 'step.error'),
            };
        });

        const traceId = requiredString(run.id, 'trace.id');
        const traceStatus = requiredString(run.status, 'trace.status');
        const createdAt = run.createdAt ?? run.startedAt;
        assert(typeof createdAt === 'string' && createdAt.length > 0, 'trace.createdAt is required');
        const completedAtRaw = run.completedAt ?? run.finishedAt ?? null;
        if (completedAtRaw != null) {
            assert(typeof completedAtRaw === 'string', 'trace.completedAt must be a string when present');
        }

        return {
            id: traceId,
            status: traceStatus,
            triggeredBy: optionalStringOrNull(run.triggeredBy),
            createdAt,
            completedAt: completedAtRaw,
            steps,
        };
    },

    async retryRun(projectId: string, moduleKey: string, runId: string, input?: Record<string, unknown>): Promise<void> {
        assertProjectId(projectId);
        assertModuleKey(moduleKey);
        assertUuid(runId, 'runId');
        if (input !== undefined) {
            assert(isRecord(input), 'input must be an object');
        }
        await api.post(`/modules/${projectId}/${moduleKey}/runs/${runId}/retry`, input ? { input } : {});
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
        status: 'succeeded' | 'failed' | 'dead_lettered';
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
