import api from "./api";
import {
    assert,
    assertNonEmptyString,
    assertObject,
    assertProjectId,
    assertUuid,
    toArray,
    unwrapDataEnvelope,
} from "./serviceGuards";
import type {
    FrontendIntegration,
    FrontendIntegrationArtifact,
    FrontendIntegrationObservability,
    FrontendIntegrationRun,
    FrontendIntegrationRunDetail,
} from "@/types";

export interface GitHubInstallUrlResult {
    configured: boolean;
    installUrl: string | null;
    state: string | null;
}

export interface GitHubRepositorySummary {
    id: string;
    name: string;
    fullName: string;
    owner: string;
    defaultBranch: string;
    private: boolean;
    htmlUrl: string;
    updatedAt: string | null;
}

export interface GitHubInstallCallbackResult {
    installationId: string;
    setupAction: string | null;
    repositories: GitHubRepositorySummary[];
}

export interface ConnectFrontendRepoPayload {
    provider?: "github";
    repoOwner: string;
    repoName: string;
    repoId: string;
    installationId: string;
    defaultBranch?: string;
}

export interface CreateFrontendIntegrationRunPayload {
    targetBranch?: string;
    baseSha?: string;
    instructions?: string;
    autoOpenDraftPr?: boolean;
}

export interface OpenFrontendIntegrationPrPayload {
    title?: string;
    body?: string;
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

function optionalNumberOrNull(value: unknown): number | null {
    if (value == null) return null;
    assert(typeof value === "number" && Number.isFinite(value), "Expected number or null");
    return value;
}

function asRecord(value: unknown): Record<string, unknown> {
    assertObject(value, "object");
    return value;
}

function asGitHubInstallUrlResult(value: unknown): GitHubInstallUrlResult {
    assertObject(value, "github install url");
    return {
        configured: Boolean(value.configured),
        installUrl: optionalStringOrNull(value.installUrl),
        state: optionalStringOrNull(value.state),
    };
}

function asGitHubRepositorySummary(value: unknown): GitHubRepositorySummary {
    assertObject(value, "github repository");
    return {
        id: requiredString(value.id, "repo.id"),
        name: requiredString(value.name, "repo.name"),
        fullName: requiredString(value.fullName, "repo.fullName"),
        owner: requiredString(value.owner, "repo.owner"),
        defaultBranch: requiredString(value.defaultBranch, "repo.defaultBranch"),
        private: Boolean(value.private),
        htmlUrl: requiredString(value.htmlUrl, "repo.htmlUrl"),
        updatedAt: optionalStringOrNull(value.updatedAt),
    };
}

function asGitHubInstallCallbackResult(value: unknown): GitHubInstallCallbackResult {
    assertObject(value, "github install callback");
    return {
        installationId: requiredString(value.installationId, "github.installationId"),
        setupAction: optionalStringOrNull(value.setupAction),
        repositories: toArray(value.repositories, asGitHubRepositorySummary),
    };
}

function asFrontendIntegration(value: unknown): FrontendIntegration {
    assertObject(value, "frontend integration");
    assert(value.provider === "github", "Unsupported frontend integration provider");
    return {
        id: requiredString(value.id, "integration.id"),
        projectId: requiredString(value.projectId, "integration.projectId"),
        provider: "github",
        repoOwner: requiredString(value.repoOwner, "integration.repoOwner"),
        repoName: requiredString(value.repoName, "integration.repoName"),
        repoId: requiredString(value.repoId, "integration.repoId"),
        installationId: requiredString(value.installationId, "integration.installationId"),
        defaultBranch: requiredString(value.defaultBranch, "integration.defaultBranch"),
        status: requiredString(value.status, "integration.status") as FrontendIntegration["status"],
        createdBy: requiredString(value.createdBy, "integration.createdBy"),
        createdAt: requiredString(value.createdAt, "integration.createdAt"),
        updatedAt: requiredString(value.updatedAt, "integration.updatedAt"),
    };
}

function asFrontendIntegrationRun(value: unknown): FrontendIntegrationRun {
    assertObject(value, "frontend integration run");
    return {
        id: requiredString(value.id, "run.id"),
        integrationId: requiredString(value.integrationId, "run.integrationId"),
        projectId: requiredString(value.projectId, "run.projectId"),
        targetBranch: optionalStringOrNull(value.targetBranch),
        baseSha: optionalStringOrNull(value.baseSha),
        status: requiredString(value.status, "run.status") as FrontendIntegrationRun["status"],
        plan: value.plan,
        summary: optionalStringOrNull(value.summary),
        prNumber: optionalNumberOrNull(value.prNumber),
        prUrl: optionalStringOrNull(value.prUrl),
        errorMessage: optionalStringOrNull(value.errorMessage),
        createdBy: requiredString(value.createdBy, "run.createdBy"),
        createdAt: requiredString(value.createdAt, "run.createdAt"),
        updatedAt: requiredString(value.updatedAt, "run.updatedAt"),
    };
}

function asFrontendIntegrationArtifact(value: unknown): FrontendIntegrationArtifact {
    assertObject(value, "frontend integration artifact");
    return {
        id: requiredString(value.id, "artifact.id"),
        runId: requiredString(value.runId, "artifact.runId"),
        kind: requiredString(value.kind, "artifact.kind") as FrontendIntegrationArtifact["kind"],
        content: value.content,
        contentHash: requiredString(value.contentHash, "artifact.contentHash"),
        createdAt: requiredString(value.createdAt, "artifact.createdAt"),
    };
}

function asFrontendIntegrationRunDetail(value: unknown): FrontendIntegrationRunDetail {
    assertObject(value, "frontend integration run detail");
    return {
        run: asFrontendIntegrationRun(value.run),
        artifacts: toArray(value.artifacts, asFrontendIntegrationArtifact),
    };
}

function asFrontendIntegrationObservability(value: unknown): FrontendIntegrationObservability {
    assertObject(value, "frontend integration observability");
    const summary = asRecord(value.summary);
    const flags = asRecord(value.flags);
    return {
        flags: {
            enabled: Boolean(flags.enabled),
            aiPlannerEnabled: Boolean(flags.aiPlannerEnabled),
            autoOpenPrEnabled: Boolean(flags.autoOpenPrEnabled),
            requireMicroVmSandbox: Boolean(flags.requireMicroVmSandbox),
            allowNetworkInstall: Boolean(flags.allowNetworkInstall),
            observabilityEnabled: Boolean(flags.observabilityEnabled),
        },
        summary: {
            totalRunsWindow: Number(summary.totalRunsWindow ?? 0),
            byStatus: asRecord(summary.byStatus) as Record<string, number>,
            failedRunsWindow: Number(summary.failedRunsWindow ?? 0),
            prCreatedRunsWindow: Number(summary.prCreatedRunsWindow ?? 0),
            awaitingApprovalRunsWindow: Number(summary.awaitingApprovalRunsWindow ?? 0),
        },
        alerts: toArray(value.alerts, (item) => {
            const alert = asRecord(item);
            return {
                severity: requiredString(alert.severity, "alert.severity"),
                type: requiredString(alert.type, "alert.type"),
                message: requiredString(alert.message, "alert.message"),
            };
        }),
        recentFailures: toArray(value.recentFailures, (item) => {
            const failure = asRecord(item);
            return {
                runId: requiredString(failure.runId, "failure.runId"),
                integrationId: requiredString(failure.integrationId, "failure.integrationId"),
                errorMessage: optionalStringOrNull(failure.errorMessage),
                updatedAt: requiredString(failure.updatedAt, "failure.updatedAt"),
            };
        }),
        recentRuns: toArray(value.recentRuns, asFrontendIntegrationRun),
    };
}

const FrontendIntegrationService = {
    async getGitHubInstallUrl(
        projectId: string,
        payload: { redirectUrl?: string } = {},
    ): Promise<GitHubInstallUrlResult> {
        assertProjectId(projectId);
        const { data } = await api.post(`/frontend-integrations/projects/${projectId}/github/install-url`, payload);
        return asGitHubInstallUrlResult(unwrapDataEnvelope(data));
    },

    async completeGitHubInstall(
        projectId: string,
        payload: { installationId: string; state: string; setupAction?: string },
    ): Promise<GitHubInstallCallbackResult> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.installationId, "installationId");
        assertNonEmptyString(payload.state, "state");
        const { data } = await api.post(`/frontend-integrations/projects/${projectId}/github/callback`, payload);
        return asGitHubInstallCallbackResult(unwrapDataEnvelope(data));
    },

    async listIntegrations(projectId: string): Promise<FrontendIntegration[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/frontend-integrations/projects/${projectId}/integrations`);
        const raw = unwrapDataEnvelope(data);
        assertObject(raw, "frontend integrations response");
        return toArray(raw.integrations, asFrontendIntegration);
    },

    async getObservability(projectId: string): Promise<FrontendIntegrationObservability> {
        assertProjectId(projectId);
        const { data } = await api.get(`/frontend-integrations/projects/${projectId}/observability`);
        return asFrontendIntegrationObservability(unwrapDataEnvelope(data));
    },

    async connectRepo(projectId: string, payload: ConnectFrontendRepoPayload): Promise<FrontendIntegration> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.repoOwner, "repoOwner");
        assertNonEmptyString(payload.repoName, "repoName");
        assertNonEmptyString(payload.repoId, "repoId");
        assertNonEmptyString(payload.installationId, "installationId");
        const { data } = await api.post(`/frontend-integrations/projects/${projectId}/integrations`, payload);
        return asFrontendIntegration(unwrapDataEnvelope(data));
    },

    async getIntegration(projectId: string, integrationId: string): Promise<FrontendIntegration> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        const { data } = await api.get(`/frontend-integrations/projects/${projectId}/integrations/${integrationId}`);
        return asFrontendIntegration(unwrapDataEnvelope(data));
    },

    async createRun(
        projectId: string,
        integrationId: string,
        payload: CreateFrontendIntegrationRunPayload = {},
    ): Promise<FrontendIntegrationRun> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        const { data } = await api.post(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs`,
            payload,
        );
        return asFrontendIntegrationRun(unwrapDataEnvelope(data));
    },

    async getRunDetail(
        projectId: string,
        integrationId: string,
        runId: string,
    ): Promise<FrontendIntegrationRunDetail> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        assertUuid(runId, "runId");
        const { data } = await api.get(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs/${runId}`,
        );
        return asFrontendIntegrationRunDetail(unwrapDataEnvelope(data));
    },

    async listRuns(projectId: string, integrationId: string): Promise<FrontendIntegrationRun[]> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        const { data } = await api.get(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs`,
        );
        const raw = unwrapDataEnvelope(data);
        assertObject(raw, "frontend integration runs response");
        return toArray(raw.runs, asFrontendIntegrationRun);
    },

    async cancelRun(projectId: string, integrationId: string, runId: string): Promise<FrontendIntegrationRun> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        assertUuid(runId, "runId");
        const { data } = await api.post(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs/${runId}/cancel`,
        );
        return asFrontendIntegrationRun(unwrapDataEnvelope(data));
    },

    async openPullRequest(
        projectId: string,
        integrationId: string,
        runId: string,
        payload: OpenFrontendIntegrationPrPayload = {},
    ): Promise<FrontendIntegrationRun> {
        assertProjectId(projectId);
        assertUuid(integrationId, "integrationId");
        assertUuid(runId, "runId");
        if (payload.title != null) assertNonEmptyString(payload.title, "title");
        const { data } = await api.post(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs/${runId}/open-pr`,
            payload,
        );
        return asFrontendIntegrationRun(unwrapDataEnvelope(data));
    },
};

export default FrontendIntegrationService;
