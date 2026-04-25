import api from "./api";
import { assertNonEmptyString, assertProjectId, unwrapDataEnvelope } from "./serviceGuards";

export interface PluginMeta {
    name: string;
    version: string;
    description: string;
    author?: string;
    displayName?: string;
    requiredProjectCategory?: string | null;
    category?: string;
    icon?: string;
    tags?: string[];
}

export interface InstalledPlugin {
    name: string;
    version: string;
    config: Record<string, unknown>;
    enabled: boolean;
    installedAt: string;
    updatedAt?: string;
}

function extractPluginsArray(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload)) {
        return payload as Record<string, unknown>[];
    }

    if (payload && typeof payload === "object") {
        const nested = (payload as { plugins?: unknown }).plugins;
        if (Array.isArray(nested)) {
            return nested as Record<string, unknown>[];
        }
    }

    return [];
}

function mapAvailablePlugin(plugin: Record<string, unknown>): PluginMeta {
    return {
        name: typeof plugin.name === "string" ? plugin.name : "",
        version: typeof plugin.version === "string" ? plugin.version : "1.0.0",
        description: typeof plugin.description === "string" ? plugin.description : "",
        author: typeof plugin.author === "string" ? plugin.author : undefined,
        displayName: typeof plugin.displayName === "string" ? plugin.displayName : undefined,
        requiredProjectCategory:
            typeof plugin.requiredProjectCategory === "string" || plugin.requiredProjectCategory === null
                ? plugin.requiredProjectCategory
                : undefined,
        category: typeof plugin.category === "string" ? plugin.category : undefined,
        icon: typeof plugin.icon === "string" ? plugin.icon : undefined,
        tags: Array.isArray(plugin.tags) ? plugin.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
    };
}

const PluginService = {
    // Get all available plugins from the "marketplace"
    async getAvailable(projectId: string): Promise<PluginMeta[]> {
        assertProjectId(projectId);
        const { data } = await api.get("/plugins/available", {
            headers: { "x-project-id": projectId },
        });
        return extractPluginsArray(unwrapDataEnvelope(data)).map(mapAvailablePlugin);
    },

    // Get plugins installed on this project
    async getInstalled(projectId: string): Promise<InstalledPlugin[]> {
        assertProjectId(projectId);
        const { data } = await api.get("/plugins/installed", {
            headers: { "x-project-id": projectId },
        });
        return extractPluginsArray(unwrapDataEnvelope(data)).map((plugin) => ({
            name: typeof plugin.pluginName === "string" ? plugin.pluginName : typeof plugin.name === "string" ? plugin.name : "",
            version: typeof plugin.version === "string" ? plugin.version : "1.0.0",
            config: plugin.config && typeof plugin.config === "object" ? plugin.config as Record<string, unknown> : {},
            enabled: typeof plugin.isActive === "boolean" ? plugin.isActive : Boolean(plugin.enabled),
            installedAt: typeof plugin.installedAt === "string" ? plugin.installedAt : "",
            updatedAt: typeof plugin.updatedAt === "string" ? plugin.updatedAt : undefined,
        }));
    },

    // Install a plugin
    async install(projectId: string, pluginName: string, options?: { mfaCode?: string }): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        const headers: Record<string, string> = { "x-project-id": projectId };
        if (options?.mfaCode) headers["x-mfa-code"] = options.mfaCode;
        await api.post(
            "/plugins/install",
            { name: pluginName },
            { headers }
        );
    },

    // Uninstall a plugin
    async uninstall(projectId: string, pluginName: string): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        await api.delete(`/plugins/${pluginName}/uninstall`, {
            headers: { "x-project-id": projectId },
        });
    },

    // Update plugin config
    async updateConfig(projectId: string, pluginName: string, config: any): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        await api.patch(
            `/plugins/${pluginName}/config`,
            { config },
            { headers: { "x-project-id": projectId } }
        );
    },

    // Submit an idea
    async submitIdea(projectId: string, idea: { title: string; description: string; category?: string }): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(idea.title, "title");
        assertNonEmptyString(idea.description, "description");
        await api.post("/plugins/ideas", idea, {
            headers: { "x-project-id": projectId },
        });
    },
};

export default PluginService;
