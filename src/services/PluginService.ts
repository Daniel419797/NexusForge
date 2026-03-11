import api from "./api";

export interface PluginMeta {
    name: string;
    version: string;
    description: string;
    author: string;
    category?: string;
    icon?: string;
    tags?: string[];
}

export interface InstalledPlugin {
    name: string;
    version: string;
    config: any;
    enabled: boolean;
    installedAt: string;
}

const PluginService = {
    // Get all available plugins from the "marketplace"
    async getAvailable(projectId: string): Promise<PluginMeta[]> {
        const { data } = await api.get("/plugins/available", {
            headers: { "x-project-id": projectId },
        });
        return data.data || [];
    },

    // Get plugins installed on this project
    async getInstalled(projectId: string): Promise<InstalledPlugin[]> {
        const { data } = await api.get("/plugins/installed", {
            headers: { "x-project-id": projectId },
        });
        return data.data || [];
    },

    // Install a plugin
    async install(projectId: string, pluginName: string): Promise<void> {
        await api.post(
            "/plugins/install",
            { name: pluginName },
            { headers: { "x-project-id": projectId } }
        );
    },

    // Uninstall a plugin
    async uninstall(projectId: string, pluginName: string): Promise<void> {
        await api.delete(`/plugins/${pluginName}/uninstall`, {
            headers: { "x-project-id": projectId },
        });
    },

    // Update plugin config
    async updateConfig(projectId: string, pluginName: string, config: any): Promise<void> {
        await api.patch(
            `/plugins/${pluginName}/config`,
            { config },
            { headers: { "x-project-id": projectId } }
        );
    },

    // Submit an idea
    async submitIdea(projectId: string, idea: { title: string; description: string; category?: string }): Promise<void> {
        await api.post("/plugins/ideas", idea, {
            headers: { "x-project-id": projectId },
        });
    },
};

export default PluginService;
