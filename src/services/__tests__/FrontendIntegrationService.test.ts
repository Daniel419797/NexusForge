import { beforeEach, describe, expect, it, vi } from "vitest";
import FrontendIntegrationService from "@/services/FrontendIntegrationService";

vi.mock("@/services/api", () => {
    const mockGet = vi.fn();
    const mockPost = vi.fn();
    return {
        default: {
            get: mockGet,
            post: mockPost,
        },
    };
});

import api from "@/services/api";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const projectId = "11111111-1111-4111-8111-111111111111";
const integrationId = "22222222-2222-4222-8222-222222222222";
const runId = "33333333-3333-4333-8333-333333333333";

describe("FrontendIntegrationService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("completes GitHub installs and maps repository choices", async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                data: {
                    installationId: "12345",
                    setupAction: "install",
                    repositories: [{
                        id: "repo-1",
                        name: "web",
                        fullName: "acme/web",
                        owner: "acme",
                        defaultBranch: "main",
                        private: true,
                        htmlUrl: "https://github.com/acme/web",
                        updatedAt: null,
                    }],
                },
            },
        });

        const result = await FrontendIntegrationService.completeGitHubInstall(projectId, {
            installationId: "12345",
            state: "signed-state",
            setupAction: "install",
        });

        expect(mockPost).toHaveBeenCalledWith(
            `/frontend-integrations/projects/${projectId}/github/callback`,
            { installationId: "12345", state: "signed-state", setupAction: "install" },
        );
        expect(result.repositories[0].fullName).toBe("acme/web");
    });

    it("lists run history for an integration", async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    runs: [{
                        id: runId,
                        integrationId,
                        projectId,
                        targetBranch: "platform/wire-backend",
                        baseSha: null,
                        status: "awaiting_approval",
                        plan: {},
                        summary: "ready",
                        prNumber: null,
                        prUrl: null,
                        errorMessage: null,
                        createdBy: "44444444-4444-4444-8444-444444444444",
                        createdAt: "2026-05-16T00:00:00.000Z",
                        updatedAt: "2026-05-16T00:00:00.000Z",
                    }],
                },
            },
        });

        const runs = await FrontendIntegrationService.listRuns(projectId, integrationId);

        expect(mockGet).toHaveBeenCalledWith(
            `/frontend-integrations/projects/${projectId}/integrations/${integrationId}/runs`,
        );
        expect(runs[0].status).toBe("awaiting_approval");
    });

    it("loads frontend integration observability", async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    flags: {
                        enabled: true,
                        aiPlannerEnabled: true,
                        autoOpenPrEnabled: false,
                        requireMicroVmSandbox: true,
                        allowNetworkInstall: false,
                        observabilityEnabled: true,
                    },
                    summary: {
                        totalRunsWindow: 4,
                        byStatus: { failed: 1, pr_created: 2 },
                        failedRunsWindow: 1,
                        prCreatedRunsWindow: 2,
                        awaitingApprovalRunsWindow: 1,
                    },
                    alerts: [{
                        severity: "warning",
                        type: "recent_failures",
                        message: "1 frontend integration run failed.",
                    }],
                    recentFailures: [],
                    recentRuns: [],
                },
            },
        });

        const result = await FrontendIntegrationService.getObservability(projectId);

        expect(mockGet).toHaveBeenCalledWith(
            `/frontend-integrations/projects/${projectId}/observability`,
        );
        expect(result.flags.requireMicroVmSandbox).toBe(true);
        expect(result.summary.prCreatedRunsWindow).toBe(2);
        expect(result.alerts[0].type).toBe("recent_failures");
    });
});
