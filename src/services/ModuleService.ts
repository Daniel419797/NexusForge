import api from "./api";

export interface ModuleInfo {
    moduleId: string;
    label: string;
    description: string;
    enabled: boolean;
    alwaysEnabled: boolean;
}

const ModuleService = {
    async list(projectId: string): Promise<ModuleInfo[]> {
        const { data } = await api.get(`/projects/${projectId}/modules`);
        return data.data?.modules || [];
    },

    async toggle(projectId: string, moduleId: string, enabled: boolean): Promise<void> {
        await api.patch(`/projects/${projectId}/modules/${moduleId}`, { enabled });
    },
};

export default ModuleService;
