import api from "./api";
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

const DeployService = {
    /** Pre-deploy readiness check */
    async getReadiness(projectId: string): Promise<ReadinessResult> {
        const { data } = await api.get(`/deploy/projects/${projectId}/readiness`);
        return data.data;
    },

    /** Trigger a new deployment */
    async triggerDeploy(projectId: string, payload: TriggerDeployPayload = {}): Promise<Deployment> {
        const { data } = await api.post(`/deploy/projects/${projectId}/deployments`, payload);
        return data.data;
    },

    /** List deployment history (paginated) */
    async listDeployments(projectId: string, query: ListDeploymentsQuery = {}): Promise<DeploymentListResult> {
        const params = new URLSearchParams();
        if (query.limit != null) params.set("limit", String(query.limit));
        if (query.offset != null) params.set("offset", String(query.offset));
        if (query.status) params.set("status", query.status);

        const qs = params.toString();
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments${qs ? `?${qs}` : ""}`);
        return data.data;
    },

    /** Get the current live deployment */
    async getCurrentDeployment(projectId: string): Promise<DeploymentDetail | null> {
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments/current`);
        return data.data;
    },

    /** Get a single deployment with logs */
    async getDeployment(projectId: string, deployId: string): Promise<DeploymentDetail> {
        const { data } = await api.get(`/deploy/projects/${projectId}/deployments/${deployId}`);
        return data.data;
    },

    /** Rollback to a specific deployment version */
    async rollback(projectId: string, deployId: string, payload: RollbackPayload = {}): Promise<Deployment> {
        const { data } = await api.post(`/deploy/projects/${projectId}/deployments/${deployId}/rollback`, payload);
        return data.data;
    },
};

export default DeployService;
