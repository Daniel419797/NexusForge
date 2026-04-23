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

const LogicModuleService = {
    async list(projectId: string): Promise<LogicModuleDefinition[]> {
        const { data } = await api.get(`/modules/${projectId}`);
        return data.data || [];
    },

    async createDefinition(projectId: string, payload: {
        moduleKey: string;
        displayName: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }): Promise<LogicModuleDefinition> {
        const { data } = await api.post(`/modules/${projectId}`, payload);
        return data.data;
    },

    async updateDefinition(projectId: string, moduleKey: string, payload: {
        displayName?: string;
        description?: string | null;
        metadata?: Record<string, unknown>;
    }): Promise<LogicModuleDefinition> {
        const { data } = await api.patch(`/modules/${projectId}/${moduleKey}`, payload);
        return data.data;
    },

    async getDefinition(projectId: string, moduleKey: string): Promise<LogicModuleDefinitionDetail> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}`);
        return data.data;
    },

    async listVersions(projectId: string, moduleKey: string): Promise<LogicModuleVersion[]> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/versions`);
        return data.data || [];
    },

    async createVersion(projectId: string, moduleKey: string, definitionJson: WorkflowDefinitionInput): Promise<LogicModuleVersion> {
        const { data } = await api.post(`/modules/${projectId}/${moduleKey}/versions`, { definitionJson });
        return data.data;
    },

    async getVersionDefinition(projectId: string, moduleKey: string, versionNumber: number): Promise<{
        definitionJson: WorkflowDefinitionInput;
        versionNumber: number;
    }> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/definition`);
        return data.data;
    },

    async activateVersion(projectId: string, moduleKey: string, versionNumber: number): Promise<void> {
        await api.post(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/activate`, {});
    },

    async rollbackVersion(projectId: string, moduleKey: string, versionNumber: number): Promise<void> {
        await api.post(`/modules/${projectId}/${moduleKey}/versions/${versionNumber}/rollback`, {});
    },

    async archiveDefinition(projectId: string, moduleKey: string): Promise<void> {
        await api.post(`/modules/${projectId}/${moduleKey}/archive`, {});
    },

    async executeModule(projectId: string, moduleKey: string, input?: Record<string, unknown>): Promise<{
        runId: string;
        status: 'succeeded' | 'failed';
        traces: Array<{ stepIndex: number; nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
    }> {
        const { data } = await api.post(`/modules/${projectId}/${moduleKey}/execute`, { input: input ?? {} });
        return data.data;
    },

    async listRuns(projectId: string, moduleKey: string, params?: { status?: string; limit?: number; offset?: number }): Promise<Array<{
        id: string;
        status: 'succeeded' | 'failed' | 'running';
        triggeredBy: string | null;
        createdAt: string;
        completedAt: string | null;
    }>> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/runs`, { params });
        return data.data || [];
    },

    async getRunTrace(projectId: string, moduleKey: string, runId: string): Promise<{
        id: string;
        status: string;
        triggeredBy: string | null;
        createdAt: string;
        completedAt: string | null;
        steps: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string }>;
    }> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/runs/${runId}`);
        return data.data;
    },

    async retryRun(projectId: string, moduleKey: string, runId: string): Promise<void> {
        await api.post(`/modules/${projectId}/${moduleKey}/runs/${runId}/retry`, {});
    },

    async listDeadLetters(projectId: string, moduleKey: string, params?: { limit?: number; offset?: number }): Promise<Array<{
        id: string;
        error: string;
        payload: unknown;
        createdAt: string;
    }>> {
        const { data } = await api.get(`/modules/${projectId}/${moduleKey}/dead-letters`, { params });
        return data.data || [];
    },
};

export default LogicModuleService;
