import { create } from "zustand";
import type {
    Deployment,
    DeploymentDetail,
    DeploymentLog,
    ReadinessResult,
} from "@/types";
import DeployService from "@/services/DeployService";

/** Safely extract an error message from Axios-style errors or generic unknown errors */
function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object") {
        // Axios-style: err.response.data.message
        const response = (err as Record<string, unknown>).response;
        if (response && typeof response === "object") {
            const data = (response as Record<string, unknown>).data;
            if (data && typeof data === "object") {
                const msg = (data as Record<string, unknown>).message;
                if (typeof msg === "string" && msg.length > 0) return msg;
            }
        }
        // Generic Error
        if ("message" in err && typeof (err as Error).message === "string") {
            return (err as Error).message;
        }
    }
    return fallback;
}

interface DeployState {
    // Data
    readiness: ReadinessResult | null;
    deployments: Deployment[];
    total: number;
    currentDeployment: DeploymentDetail | null;
    activeDeployment: DeploymentDetail | null;
    
    // UI state
    isDeploying: boolean;
    isLoadingReadiness: boolean;
    isLoadingList: boolean;
    isLoadingDetail: boolean;
    isRollingBack: boolean;
    error: string | null;

    // Actions
    fetchReadiness: (projectId: string) => Promise<void>;
    triggerDeploy: (projectId: string, releaseNote?: string) => Promise<Deployment | null>;
    fetchDeployments: (projectId: string, limit?: number, offset?: number, status?: string) => Promise<void>;
    fetchCurrentDeployment: (projectId: string) => Promise<void>;
    fetchDeploymentDetail: (projectId: string, deployId: string) => Promise<void>;
    rollback: (projectId: string, deployId: string, reason?: string) => Promise<Deployment | null>;
    updateDeploymentStep: (deploymentId: string, log: DeploymentLog) => void;
    markDeploymentComplete: (deploymentId: string) => void;
    markDeploymentFailed: (deploymentId: string, error: string) => void;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    readiness: null,
    deployments: [],
    total: 0,
    currentDeployment: null,
    activeDeployment: null,
    isDeploying: false,
    isLoadingReadiness: false,
    isLoadingList: false,
    isLoadingDetail: false,
    isRollingBack: false,
    error: null,
};

export const useDeployStore = create<DeployState>((set, get) => ({
    ...initialState,

    fetchReadiness: async (projectId) => {
        set({ isLoadingReadiness: true, error: null });
        try {
            const readiness = await DeployService.getReadiness(projectId);
            set({ readiness, isLoadingReadiness: false });
        } catch (err: unknown) {
            const message = extractErrorMessage(err, "Failed to check readiness");
            set({ isLoadingReadiness: false, error: message });
        }
    },

    triggerDeploy: async (projectId, releaseNote) => {
        set({ isDeploying: true, error: null });
        try {
            const deployment = await DeployService.triggerDeploy(projectId, { releaseNote });
            // Add to top of list
            set((s) => ({
                deployments: [deployment, ...s.deployments],
                total: s.total + 1,
                isDeploying: false,
            }));
            // Start watching this deployment
            const detail = await DeployService.getDeployment(projectId, deployment.id);
            set({ activeDeployment: detail });
            return deployment;
        } catch (err: unknown) {
            const message = extractErrorMessage(err, "Deploy failed");
            set({ isDeploying: false, error: message });
            return null;
        }
    },

    fetchDeployments: async (projectId, limit = 20, offset = 0, status) => {
        set({ isLoadingList: true, error: null });
        try {
            const result = await DeployService.listDeployments(projectId, { limit, offset, status });
            set({
                deployments: result.deployments,
                total: result.total,
                isLoadingList: false,
            });
        } catch (err: unknown) {
            const message = extractErrorMessage(err, "Failed to fetch deployments");
            set({ isLoadingList: false, error: message });
        }
    },

    fetchCurrentDeployment: async (projectId) => {
        try {
            const current = await DeployService.getCurrentDeployment(projectId);
            set({ currentDeployment: current });
        } catch (err: unknown) {
            // Swallow 404 (no live deployment yet) but surface other errors
            const isNotFound = err && typeof err === "object" && "response" in err &&
                (err as Record<string, Record<string, unknown>>).response?.status === 404;
            if (!isNotFound) {
                const message = extractErrorMessage(err, "Failed to fetch current deployment");
                set({ error: message });
            }
        }
    },

    fetchDeploymentDetail: async (projectId, deployId) => {
        set({ isLoadingDetail: true, error: null });
        try {
            const detail = await DeployService.getDeployment(projectId, deployId);
            set({ activeDeployment: detail, isLoadingDetail: false });
        } catch (err: unknown) {
            const message = extractErrorMessage(err, "Failed to fetch deployment");
            set({ isLoadingDetail: false, error: message });
        }
    },

    rollback: async (projectId, deployId, reason) => {
        set({ isRollingBack: true, error: null });
        try {
            const deployment = await DeployService.rollback(projectId, deployId, { reason });
            set((s) => ({
                deployments: [deployment, ...s.deployments],
                total: s.total + 1,
                isRollingBack: false,
            }));
            const detail = await DeployService.getDeployment(projectId, deployment.id);
            set({ activeDeployment: detail });
            return deployment;
        } catch (err: unknown) {
            const message = extractErrorMessage(err, "Rollback failed");
            set({ isRollingBack: false, error: message });
            return null;
        }
    },

    /** Called by WebSocket handler when a step update arrives */
    updateDeploymentStep: (deploymentId, log) => {
        const { activeDeployment } = get();
        if (!activeDeployment || activeDeployment.deployment.id !== deploymentId) return;

        const existingIdx = activeDeployment.logs.findIndex((l) => l.step === log.step);
        let updatedLogs: DeploymentLog[];
        if (existingIdx >= 0) {
            // Update existing step
            updatedLogs = activeDeployment.logs.map((l) =>
                l.step === log.step ? { ...l, ...log } : l
            );
        } else {
            // Append new step (can happen if logs were pre-created after initial fetch)
            updatedLogs = [...activeDeployment.logs, log];
        }
        set({
            activeDeployment: { ...activeDeployment, logs: updatedLogs },
        });
    },

    /** Called by WebSocket handler when deploy completes */
    markDeploymentComplete: (deploymentId) => {
        set((s) => {
            const updated = s.deployments.map((d) =>
                d.id === deploymentId ? { ...d, status: "live" as const } : d
            );
            const active = s.activeDeployment;
            return {
                deployments: updated,
                activeDeployment: active && active.deployment.id === deploymentId
                    ? { ...active, deployment: { ...active.deployment, status: "live" as const } }
                    : active,
                isDeploying: false,
            };
        });
    },

    /** Called by WebSocket handler when deploy fails */
    markDeploymentFailed: (deploymentId, error) => {
        set((s) => {
            const updated = s.deployments.map((d) =>
                d.id === deploymentId ? { ...d, status: "failed" as const, errorMessage: error } : d
            );
            const active = s.activeDeployment;
            return {
                deployments: updated,
                activeDeployment: active && active.deployment.id === deploymentId
                    ? { ...active, deployment: { ...active.deployment, status: "failed" as const, errorMessage: error } }
                    : active,
                isDeploying: false,
                error,
            };
        });
    },

    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}));
