import api from "./api";
import { assert, assertProjectId, assertUuid, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";
import type {
    Deployment,
    DeploymentDetail,
    DeploymentListResult,
    ReadinessResult,
} from "@/types";

export interface TriggerDeployPayload {
    releaseNote?: string;
}

export interface RollbackPayload {
    reason?: string;
}

export interface ListDeploymentsQuery {
    limit?: number;
    offset?: number;
    status?: string;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function optionalStringOrNull(value: unknown): string | null {
    if (value == null) return null;
    assert(typeof value === "string", "Expected string or null");
    return value;
}

function requiredNumber(value: unknown, fieldName: string): number {
    assert(typeof value === "number" && Number.isFinite(value), `${fieldName} must be a number`);
    return value;
}

function asDeployment(value: unknown): Deployment {
    assert(isRecord(value), "Invalid deployment response");
    const version = requiredNumber(value.version, "deployment.version");
    assert(Number.isInteger(version) && version >= 0, "deployment.version must be a non-negative integer");

    return {
        id: requiredString(value.id, "deployment.id"),
        projectId: value.projectId == null ? undefined : requiredString(value.projectId, "deployment.projectId"),
        version,
        status: requiredString(value.status, "deployment.status") as Deployment["status"],
        configSnapshot: value.configSnapshot,
        apiUrl: optionalStringOrNull(value.apiUrl),
        enabledModules: toArray(value.enabledModules, (item) => String(item)),
        deployedBy: requiredString(value.deployedBy, "deployment.deployedBy"),
        errorMessage: optionalStringOrNull(value.errorMessage),
        releaseNote: optionalStringOrNull(value.releaseNote),
        createdAt: requiredString(value.createdAt, "deployment.createdAt"),
        liveAt: optionalStringOrNull(value.liveAt),
        rolledBackAt: optionalStringOrNull(value.rolledBackAt),
    };
}

function asDeploymentLog(value: unknown): DeploymentDetail["logs"][number] {
    assert(isRecord(value), "Invalid deployment log item");
    return {
        id: requiredString(value.id, "log.id"),
        deploymentId: requiredString(value.deploymentId, "log.deploymentId"),
        step: requiredString(value.step, "log.step") as DeploymentDetail["logs"][number]["step"],
        status: requiredString(value.status, "log.status") as DeploymentDetail["logs"][number]["status"],
        message: optionalStringOrNull(value.message),
        startedAt: optionalStringOrNull(value.startedAt),
        completedAt: optionalStringOrNull(value.completedAt),
    };
}

function asReadinessResult(value: unknown): ReadinessResult {
    assert(isRecord(value), "Invalid readiness response");
    return {
        ready: Boolean(value.ready),
        checks: toArray(value.checks, (item): ReadinessResult["checks"][number] => {
            assert(isRecord(item), "Invalid readiness check item");
            return {
                name: requiredString(item.name, "check.name"),
                status: requiredString(item.status, "check.status") as ReadinessResult["checks"][number]["status"],
                message: requiredString(item.message, "check.message"),
            };
        }),
    };
}

function asDeploymentListResult(value: unknown): DeploymentListResult {
    assert(isRecord(value), "Invalid deployment list response");
    return {
        deployments: toArray(value.deployments, asDeployment),
        total: requiredNumber(value.total, "total"),
        limit: requiredNumber(value.limit, "limit"),
        offset: requiredNumber(value.offset, "offset"),
    };
}

function asDeploymentDetail(value: unknown): DeploymentDetail {
    assert(isRecord(value), "Invalid deployment detail response");
    return {
        deployment: asDeployment(value.deployment),
        logs: toArray(value.logs, asDeploymentLog),
    };
}

const DeployService = {
    /** Pre-deploy readiness check */
    async getReadiness(projectId: string): Promise<ReadinessResult> {
        assertProjectId(projectId);
        const { data } = await api.get(`/deploy/projects/${projectId}/readiness`);
        return asReadinessResult(unwrapDataEnvelope(data));
    },

    /** Trigger a new deployment */
    async triggerDeploy(projectId: string, payload: TriggerDeployPayload = {}): Promise<Deployment> {
        assertProjectId(projectId);
        const { data } = await api.post(`/deploy/projects/${projectId}/deployments`, payload);
        return asDeployment(unwrapDataEnvelope(data));
    },

    /** List deployment history (paginated) */
    async listDeployments(projectId: string, query: ListDeploymentsQuery = {}): Promise<DeploymentListResult> {
        assertProjectId(projectId);
        const params = new URLSearchParams();
        if (query.limit != null) params.set("limit", String(query.limit));
        if (query.offset != null) params.set("offset", String(query.offset));
        if (query.status) params.set("status", query.status);

        const qs = params.toString();
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments${qs ? `?${qs}` : ""}`);
        return asDeploymentListResult(unwrapDataEnvelope(data));
    },

    /** Get the current live deployment */
    async getCurrentDeployment(projectId: string): Promise<DeploymentDetail | null> {
        assertProjectId(projectId);
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments/current`);
        const raw = unwrapDataEnvelope(data);
        return raw == null ? null : asDeploymentDetail(raw);
    },

    /** Get a single deployment with logs */
    async getDeployment(projectId: string, deployId: string): Promise<DeploymentDetail> {
        assertProjectId(projectId);
        assertUuid(deployId, "deployId");
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments/${deployId}`);
        return asDeploymentDetail(unwrapDataEnvelope(data));
    },

    /** Rollback to a specific deployment version */
    async rollback(projectId: string, deployId: string, payload: RollbackPayload = {}): Promise<Deployment> {
        assertProjectId(projectId);
        assertUuid(deployId, "deployId");
        const { data } = await api.post(`/deploy/projects/${projectId}/deployments/${deployId}/rollback`, payload);
        return asDeployment(unwrapDataEnvelope(data));
    },
};

export default DeployService;
