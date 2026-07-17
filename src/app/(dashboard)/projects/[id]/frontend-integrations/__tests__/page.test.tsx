import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import FrontendIntegrationsPage from "../page";

vi.mock("next/navigation", () => ({
    useParams: () => ({ id: "11111111-1111-4111-8111-111111111111" }),
    usePathname: () => "/projects/11111111-1111-4111-8111-111111111111/frontend-integrations",
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/FrontendIntegrationService", () => ({
    default: {
        listIntegrations: vi.fn(),
        listRuns: vi.fn(),
        getRunDetail: vi.fn(),
        getGitHubInstallUrl: vi.fn(),
        completeGitHubInstall: vi.fn(),
        connectRepo: vi.fn(),
        createRun: vi.fn(),
        cancelRun: vi.fn(),
        openPullRequest: vi.fn(),
        getObservability: vi.fn(),
    },
}));

import FrontendIntegrationService from "@/services/FrontendIntegrationService";

const service = vi.mocked(FrontendIntegrationService);

describe("FrontendIntegrationsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        service.listIntegrations.mockResolvedValue([{
            id: "22222222-2222-4222-8222-222222222222",
            projectId: "11111111-1111-4111-8111-111111111111",
            provider: "github",
            repoOwner: "acme",
            repoName: "web",
            repoId: "repo-1",
            installationId: "install-1",
            defaultBranch: "main",
            status: "connected",
            createdBy: "44444444-4444-4444-8444-444444444444",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
        }]);
        service.listRuns.mockResolvedValue([{
            id: "33333333-3333-4333-8333-333333333333",
            integrationId: "22222222-2222-4222-8222-222222222222",
            projectId: "11111111-1111-4111-8111-111111111111",
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
        }]);
        service.getObservability.mockResolvedValue({
            flags: {
                enabled: true,
                aiPlannerEnabled: true,
                autoOpenPrEnabled: false,
                requireMicroVmSandbox: true,
                allowNetworkInstall: false,
                observabilityEnabled: true,
            },
            summary: {
                totalRunsWindow: 1,
                byStatus: { awaiting_approval: 1 },
                failedRunsWindow: 0,
                prCreatedRunsWindow: 0,
                awaitingApprovalRunsWindow: 1,
            },
            alerts: [],
            recentFailures: [],
            recentRuns: [],
        });
    });

    it("renders connected repositories and run history", async () => {
        render(<FrontendIntegrationsPage />);

        expect(await screen.findByText("Frontend Wiring")).toBeInTheDocument();
        expect(await screen.findByText("acme/web")).toBeInTheDocument();

        await waitFor(() => {
            expect(service.listRuns).toHaveBeenCalledWith(
                "11111111-1111-4111-8111-111111111111",
                "22222222-2222-4222-8222-222222222222",
            );
        });
        expect(await screen.findByText("Run History")).toBeInTheDocument();
        expect(await screen.findByText("33333333")).toBeInTheDocument();
        expect(await screen.findByText("Observability")).toBeInTheDocument();
    });
});
