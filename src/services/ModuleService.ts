import api from "./api";
import { assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface ModuleInfo {
    moduleId: string;
    label: string;
    description: string;
    enabled: boolean;
    alwaysEnabled: boolean;
}

const ModuleService = {
    async list(projectId: string): Promise<ModuleInfo[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/projects/${projectId}/modules`);
        const payload = unwrapDataEnvelope(data);
        if (!isRecord(payload)) return [];
        return toArray(payload.modules, (item) => item as ModuleInfo);
    },

    async toggle(projectId: string, moduleId: string, enabled: boolean): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(moduleId, "moduleId");
        await api.patch(`/projects/${projectId}/modules/${moduleId}`, { enabled });
    },
};

export default ModuleService;
