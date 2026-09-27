import { beforeEach, describe, expect, it, vi } from "vitest";
import PluginService from "@/services/PluginService";

vi.mock("@/services/api", () => {
    const mockPost = vi.fn();
    const mockDelete = vi.fn();
    const mockPatch = vi.fn();
    return {
        default: {
            post: mockPost,
            delete: mockDelete,
            patch: mockPatch,
        },
    };
});

import api from "@/services/api";

const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);
const mockPatch = vi.mocked(api.patch);
const projectId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { data: null } });
    mockDelete.mockResolvedValue({ data: { data: null } });
    mockPatch.mockResolvedValue({ data: { data: null } });
});

describe("PluginService sensitive actions", () => {
    it("sends a step-up token when installing a plugin", async () => {
        await PluginService.install(projectId, "wallet-connect", {
            stepUpToken: "step-token",
            config: { walletConnectProjectId: "wc-project" },
        });
        expect(mockPost).toHaveBeenCalledWith(
            "/plugins/install",
            { name: "wallet-connect", config: { walletConnectProjectId: "wc-project" } },
            { headers: { "x-project-id": projectId, "x-mfa-step-up-token": "step-token" } },
        );
    });

    it("sends a step-up token when uninstalling a plugin", async () => {
        await PluginService.uninstall(projectId, "wallet-connect", { stepUpToken: "step-token" });
        expect(mockDelete).toHaveBeenCalledWith(
            "/plugins/wallet-connect/uninstall",
            { headers: { "x-project-id": projectId, "x-mfa-step-up-token": "step-token" } },
        );
    });

    it("sends a step-up token when updating plugin configuration", async () => {
        await PluginService.updateConfig(projectId, "wallet-connect", { enabled: true }, { stepUpToken: "step-token" });
        expect(mockPatch).toHaveBeenCalledWith(
            "/plugins/wallet-connect/config",
            { config: { enabled: true } },
            { headers: { "x-project-id": projectId, "x-mfa-step-up-token": "step-token" } },
        );
    });
});
