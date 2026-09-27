import api from "./api";
import { assertNonEmptyString, assertProjectId, unwrapDataEnvelope } from "./serviceGuards";

export type PluginConfigFieldType = "text" | "url" | "number" | "number-array";

export interface PluginConfigField {
    key: string;
    label: string;
    type: PluginConfigFieldType;
    required?: boolean;
    description?: string;
    placeholder?: string;
    defaultValue?: string | number | number[];
}

export interface PluginMeta {
    name: string;
    version: string;
    description: string;
    author?: string;
    displayName?: string;
    requiredProjectCategory?: string | null;
    compatible?: boolean;
    configFields?: PluginConfigField[];
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

export interface SensitiveActionOptions {
    stepUpToken?: string;
    mfaCode?: string;
    config?: Record<string, unknown>;
}

function sensitiveHeaders(projectId: string, options?: SensitiveActionOptions): Record<string, string> {
    const headers: Record<string, string> = { "x-project-id": projectId };
    if (options?.stepUpToken) headers["x-mfa-step-up-token"] = options.stepUpToken;
    if (options?.mfaCode) headers["x-mfa-code"] = options.mfaCode;
    return headers;
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

function mapConfigFields(value: unknown): PluginConfigField[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((field): PluginConfigField[] => {
        if (!field || typeof field !== "object") return [];
        const raw = field as Record<string, unknown>;
        const type = raw.type;
        if (
            typeof raw.key !== "string" ||
            typeof raw.label !== "string" ||
            (type !== "text" && type !== "url" && type !== "number" && type !== "number-array")
        ) return [];
        const defaultValue = typeof raw.defaultValue === "string" || typeof raw.defaultValue === "number" ||
            (Array.isArray(raw.defaultValue) && raw.defaultValue.every((item) => typeof item === "number"))
            ? raw.defaultValue as string | number | number[]
            : undefined;
        return [{
            key: raw.key,
            label: raw.label,
            type,
            required: raw.required === true,
            description: typeof raw.description === "string" ? raw.description : undefined,
            placeholder: typeof raw.placeholder === "string" ? raw.placeholder : undefined,
            defaultValue,
        }];
    });
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
        compatible: typeof plugin.compatible === "boolean" ? plugin.compatible : undefined,
        configFields: mapConfigFields(plugin.configFields),
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
    async install(projectId: string, pluginName: string, options?: SensitiveActionOptions): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        await api.post(
            "/plugins/install",
            { name: pluginName, config: options?.config ?? {} },
            { headers: sensitiveHeaders(projectId, options) }
        );
    },

    // Uninstall a plugin
    async uninstall(projectId: string, pluginName: string, options?: SensitiveActionOptions): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        await api.delete(`/plugins/${pluginName}/uninstall`, {
            headers: sensitiveHeaders(projectId, options),
        });
    },

    // Update plugin config
    async updateConfig(projectId: string, pluginName: string, config: Record<string, unknown>, options?: SensitiveActionOptions): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(pluginName, "pluginName");
        await api.patch(
            `/plugins/${pluginName}/config`,
            { config },
            { headers: sensitiveHeaders(projectId, options) }
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
