import api from "./api";
import type { Project } from "@/types";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface CategoryTemplate {
	name: string;
	category: string;
	description: string;
	defaultSettings: Record<string, any>;
	suggestedPlugins: string[];
	notificationEvents: string[];
}

export interface CreateProjectPayload {
	name: string;
	category: string;
	enabledModules?: string[];
	config?: Record<string, unknown>;
}

export interface UpdateProjectPayload {
	name?: string;
	description?: string;
	category?: string;
	status?: string;
	enabledModules?: string[];
}

export interface MigrateUsersPayload {
	selector: "members" | "all" | "specific";
	userIds?: string[];
}

export interface ProjectConfig {
	dbType: "postgresql" | "supabase" | "mssql" | "mongodb";
	dbUrl?: string | null;
	settings: Record<string, any>;
}

export interface ProjectDetail {
	project: Project;
	config: (ProjectConfig & { dbConnected?: boolean }) | null;
	membership: { role: string; joinedAt: string };
}

export interface SdkConfig {
	baseUrl: string;
	projectId: string;
}

export interface IntegrationConfig {
	project: Project;
	sdkConfig: SdkConfig;
	auth: { basePath: string; baseUrl: string };
	gatewayUrl: string;
}

export interface ApiDocsEndpoint {
	method: string;
	path: string;
	summary: string;
	description?: string;
	auth?: "none" | "api-key" | "bearer" | "bearer-or-api-key";
	requestBody?: Record<string, unknown>;
	query?: Record<string, unknown>;
	responseExample?: Record<string, unknown>;
}

export interface ApiDocsModule {
	moduleId: string;
	label: string;
	description: string;
	endpoints: ApiDocsEndpoint[];
}

export interface ProjectApiDocs {
	project: { id: string; name: string };
	gatewayBase: string;
	modules: ApiDocsModule[];
	quickStart?: {
		sdk?: string;
		curlExample?: string;
	};
}

export interface CreateProjectResult {
	project: Project;
	config: ProjectConfig;
	template: CategoryTemplate;
	projectToken: string;
	integration?: {
		sdkConfig: SdkConfig;
		authBasePath: string;
		authBaseUrl: string;
	};
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

function requiredBoolean(value: unknown, fieldName: string): boolean {
	assert(typeof value === "boolean", `${fieldName} must be a boolean`);
	return value;
}

function optionalNumber(value: unknown): number | undefined {
	if (value == null) return undefined;
	assert(typeof value === "number" && Number.isFinite(value), "Expected finite number");
	return value;
}

function asProject(value: unknown): Project {
	assert(isRecord(value), "Invalid project response");
	return value as unknown as Project;
}

function asCategoryTemplate(value: unknown): CategoryTemplate {
	assert(isRecord(value), "Invalid category template");
	return {
		name: requiredString(value.name, "template.name"),
		category: requiredString(value.category, "template.category"),
		description: requiredString(value.description, "template.description"),
		defaultSettings: isRecord(value.defaultSettings) ? value.defaultSettings : {},
		suggestedPlugins: toArray(value.suggestedPlugins, (item) => String(item)),
		notificationEvents: toArray(value.notificationEvents, (item) => String(item)),
	};
}

function asProjectConfig(value: unknown): ProjectConfig {
	assert(isRecord(value), "Invalid project config response");
	const dbType = value.dbType;
	assert(
		dbType === "postgresql" || dbType === "supabase" || dbType === "mssql" || dbType === "mongodb",
		"Invalid config.dbType",
	);
	return {
		dbType,
		dbUrl: optionalStringOrNull(value.dbUrl) ?? undefined,
		settings: isRecord(value.settings) ? value.settings : {},
	};
}

function asProjectDetail(value: unknown): ProjectDetail {
	assert(isRecord(value), "Invalid project detail response");
	assert(isRecord(value.membership), "Invalid project membership response");
	return {
		project: asProject(value.project),
		config: value.config == null ? null : asProjectConfig(value.config),
		membership: {
			role: requiredString(value.membership.role, "membership.role"),
			joinedAt: requiredString(value.membership.joinedAt, "membership.joinedAt"),
		},
	};
}

function asCreateProjectResult(value: unknown): CreateProjectResult {
	assert(isRecord(value), "Invalid create project response");
	const template = asCategoryTemplate(value.template);
	const config = asProjectConfig(value.config);
	const projectToken = requiredString(value.projectToken, "projectToken");
	let integration: CreateProjectResult["integration"] | undefined;
	if (value.integration != null) {
		assert(isRecord(value.integration), "Invalid integration response");
		assert(isRecord(value.integration.sdkConfig), "Invalid sdkConfig response");
		integration = {
			sdkConfig: {
				baseUrl: requiredString(value.integration.sdkConfig.baseUrl, "integration.sdkConfig.baseUrl"),
				projectId: requiredString(value.integration.sdkConfig.projectId, "integration.sdkConfig.projectId"),
			},
			authBasePath: requiredString(value.integration.authBasePath, "integration.authBasePath"),
			authBaseUrl: requiredString(value.integration.authBaseUrl, "integration.authBaseUrl"),
		};
	}

	return {
		project: asProject(value.project),
		config,
		template,
		projectToken,
		integration,
	};
}

function asIntegrationConfig(value: unknown): IntegrationConfig {
	assert(isRecord(value), "Invalid integration config response");
	assert(isRecord(value.sdkConfig), "Invalid integration sdk config response");
	assert(isRecord(value.auth), "Invalid integration auth response");
	return {
		project: asProject(value.project),
		sdkConfig: {
			baseUrl: requiredString(value.sdkConfig.baseUrl, "integration.sdkConfig.baseUrl"),
			projectId: requiredString(value.sdkConfig.projectId, "integration.sdkConfig.projectId"),
		},
		auth: {
			basePath: requiredString(value.auth.basePath, "integration.auth.basePath"),
			baseUrl: requiredString(value.auth.baseUrl, "integration.auth.baseUrl"),
		},
		gatewayUrl: requiredString(value.gatewayUrl, "integration.gatewayUrl"),
	};
}

function asProjectApiDocs(value: unknown): ProjectApiDocs {
	assert(isRecord(value), "Invalid API docs response");
	assert(isRecord(value.project), "Invalid API docs project response");
	return {
		project: {
			id: requiredString(value.project.id, "apiDocs.project.id"),
			name: requiredString(value.project.name, "apiDocs.project.name"),
		},
		gatewayBase: requiredString(value.gatewayBase, "apiDocs.gatewayBase"),
		modules: toArray(value.modules, (module): ApiDocsModule => {
			assert(isRecord(module), "Invalid API docs module item");
			return {
				moduleId: requiredString(module.moduleId, "apiDocs.module.moduleId"),
				label: requiredString(module.label, "apiDocs.module.label"),
				description: requiredString(module.description, "apiDocs.module.description"),
				endpoints: toArray(module.endpoints, (endpoint): ApiDocsEndpoint => {
					assert(isRecord(endpoint), "Invalid API docs endpoint item");
					return {
						method: requiredString(endpoint.method, "apiDocs.endpoint.method"),
						path: requiredString(endpoint.path, "apiDocs.endpoint.path"),
						summary: requiredString(endpoint.summary, "apiDocs.endpoint.summary"),
						description: endpoint.description == null ? undefined : requiredString(endpoint.description, "apiDocs.endpoint.description"),
						auth: endpoint.auth as ApiDocsEndpoint["auth"],
						requestBody: isRecord(endpoint.requestBody) ? endpoint.requestBody : undefined,
						query: isRecord(endpoint.query) ? endpoint.query : undefined,
						responseExample: isRecord(endpoint.responseExample) ? endpoint.responseExample : undefined,
					};
				}),
			};
		}),
		quickStart: isRecord(value.quickStart)
			? {
				sdk: value.quickStart.sdk == null ? undefined : requiredString(value.quickStart.sdk, "apiDocs.quickStart.sdk"),
				curlExample:
					value.quickStart.curlExample == null
						? undefined
						: requiredString(value.quickStart.curlExample, "apiDocs.quickStart.curlExample"),
			}
			: undefined,
	};
}

function asDbUrlResult(value: unknown): { dbUrl: string | null } {
	assert(isRecord(value), "Invalid DB URL response");
	return {
		dbUrl: optionalStringOrNull(value.dbUrl),
	};
}

function asUpdatedProjectResult(value: unknown): Partial<Project> & { updatedAt?: string } {
	assert(isRecord(value), "Invalid project update response");
	const updatedAt = value.updatedAt == null ? undefined : requiredString(value.updatedAt, "updatedAt");
	return {
		...(value as unknown as Partial<Project>),
		updatedAt,
	};
}

function asAllowedOriginsResult(value: unknown): { allowedOrigins: string[] } {
	assert(isRecord(value), "Invalid CORS response");
	return {
		allowedOrigins: toArray(value.allowedOrigins, (item) => String(item)),
	};
}

function asSuccessResult(value: unknown): { success: boolean } {
	assert(isRecord(value), "Invalid action response");
	return {
		success: requiredBoolean(value.success, "success"),
	};
}

function asProjectTokenResult(value: unknown): { token: string; projectId: string; role: string } {
	assert(isRecord(value), "Invalid project token response");
	return {
		token: requiredString(value.token, "token"),
		projectId: requiredString(value.projectId, "projectId"),
		role: requiredString(value.role, "role"),
	};
}

function asJobIdResult(value: unknown): { jobId: string } {
	assert(isRecord(value), "Invalid job response");
	return {
		jobId: requiredString(value.jobId, "jobId"),
	};
}

function asJobStatusResult(value: unknown): { state: string; progress?: number; result?: any; failedReason?: string } {
	assert(isRecord(value), "Invalid job status response");
	return {
		state: requiredString(value.state, "state"),
		progress: optionalNumber(value.progress),
		result: value.result,
		failedReason: value.failedReason == null ? undefined : requiredString(value.failedReason, "failedReason"),
	};
}

function asOAuthResult(value: unknown): {
	googleClientId: string | null;
	googleClientSecret: string | null;
	githubClientId: string | null;
	githubClientSecret: string | null;
} {
	assert(isRecord(value), "Invalid OAuth config response");
	return {
		googleClientId: optionalStringOrNull(value.googleClientId),
		googleClientSecret: optionalStringOrNull(value.googleClientSecret),
		githubClientId: optionalStringOrNull(value.githubClientId),
		githubClientSecret: optionalStringOrNull(value.githubClientSecret),
	};
}

function asUpdatedFlagResult(value: unknown): { updated: boolean } {
	assert(isRecord(value), "Invalid update response");
	return {
		updated: requiredBoolean(value.updated, "updated"),
	};
}

const ProjectService = {
	async list(): Promise<Project[]> {
		const { data } = await api.get("/projects");
		return toArray(unwrapDataEnvelope(data), asProject);
	},

	// Returns the detailed project payload: { project, config, membership }
	async getById(projectId: string): Promise<ProjectDetail> {
		assertProjectId(projectId);
		const { data } = await api.get(`/projects/${projectId}`);
		return asProjectDetail(unwrapDataEnvelope(data));
	},

	async getDbUrl(projectId: string): Promise<{ dbUrl: string | null }> {
		assertProjectId(projectId);
		const { data } = await api.get(`/projects/${projectId}/config/db-url`);
		return asDbUrlResult(unwrapDataEnvelope(data));
	},

	async create(payload: CreateProjectPayload): Promise<CreateProjectResult> {
		assertNonEmptyString(payload.name, "name");
		assertNonEmptyString(payload.category, "category");
		const { data } = await api.post("/projects", payload);
		return asCreateProjectResult(unwrapDataEnvelope(data));
	},

	async update(projectId: string, payload: UpdateProjectPayload): Promise<Partial<Project> & { updatedAt?: string } > {
		assertProjectId(projectId);
		const { data } = await api.patch(`/projects/${projectId}`, payload);
		return asUpdatedProjectResult(unwrapDataEnvelope(data));
	},

	async updateConfig(projectId: string, config: Record<string, any>): Promise<ProjectConfig> {
		assertProjectId(projectId);
		const { data } = await api.patch(`/projects/${projectId}/config`, config);
		return asProjectConfig(unwrapDataEnvelope(data));
	},

	async updateCors(projectId: string, allowedOrigins: string[]): Promise<{ allowedOrigins: string[] }> {
		assertProjectId(projectId);
		const { data } = await api.patch(`/projects/${projectId}/cors`, { allowedOrigins });
		return asAllowedOriginsResult(unwrapDataEnvelope(data));
	},

	async delete(projectId: string): Promise<{ success: boolean }> {
		assertProjectId(projectId);
		const { data } = await api.delete(`/projects/${projectId}`);
		return asSuccessResult(unwrapDataEnvelope(data));
	},

	async getTemplates(): Promise<CategoryTemplate[]> {
		const { data } = await api.get("/projects/templates");
		return toArray(unwrapDataEnvelope(data), asCategoryTemplate);
	},

	async getProjectToken(projectId: string): Promise<{ token: string; projectId: string; role: string }> {
		assertProjectId(projectId);
		const { data } = await api.post(`/projects/${projectId}/token`);
		return asProjectTokenResult(unwrapDataEnvelope(data));
	},

	// Database operations
	async runMigrations(projectId: string): Promise<{ jobId: string }> {
		assertProjectId(projectId);
		const { data } = await api.post(`/projects/${projectId}/migrate`);
		return asJobIdResult(unwrapDataEnvelope(data));
	},

	async getJobStatus(projectId: string, jobId: string): Promise<{ state: string; progress?: number; result?: any; failedReason?: string }> {
		assertProjectId(projectId);
		assertNonEmptyString(jobId, "jobId");
		const { data } = await api.get(`/projects/${projectId}/jobs/${jobId}`);
		return asJobStatusResult(unwrapDataEnvelope(data));
	},

	async rotateDbUrl(
		projectId: string,
		payload: { dbUrl: string; dbType?: "postgresql" | "supabase" | "mssql" | "mongodb" },
		options?: { mfaCode?: string }
	): Promise<{ dbUrl: string }> {
		assertProjectId(projectId);
		assertNonEmptyString(payload.dbUrl, "dbUrl");
		const headers: Record<string, string> = {};
		if (options?.mfaCode) headers["x-mfa-code"] = options.mfaCode;
		const { data } = await api.post(`/projects/${projectId}/rotate-db-url`, payload, { headers });
		const result = asDbUrlResult(unwrapDataEnvelope(data));
		return { dbUrl: requiredString(result.dbUrl, "dbUrl") };
	},

	async migrateUsers(projectId: string, payload: MigrateUsersPayload): Promise<{ jobId: string }> {
		assertProjectId(projectId);
		assertNonEmptyString(payload.selector, "selector");
		const { data } = await api.post(`/projects/${projectId}/migrate-users`, payload);
		return asJobIdResult(unwrapDataEnvelope(data));
	},

	async getOAuth(projectId: string): Promise<{ googleClientId: string | null; googleClientSecret: string | null; githubClientId: string | null; githubClientSecret: string | null }> {
		assertProjectId(projectId);
		const { data } = await api.get(`/projects/${projectId}/oauth`);
		return asOAuthResult(unwrapDataEnvelope(data));
	},

	async updateOAuth(projectId: string, payload: { googleClientId?: string | null; googleClientSecret?: string | null; githubClientId?: string | null; githubClientSecret?: string | null }): Promise<{ updated: boolean }> {
		assertProjectId(projectId);
		const { data } = await api.patch(`/projects/${projectId}/oauth`, payload);
		return asUpdatedFlagResult(unwrapDataEnvelope(data));
	},

	async getIntegrationConfig(projectId: string): Promise<IntegrationConfig> {
		assertProjectId(projectId);
		const { data } = await api.get(`/projects/${projectId}/integration-config`);
		return asIntegrationConfig(unwrapDataEnvelope(data));
	},

	async getApiDocs(projectId: string): Promise<ProjectApiDocs> {
		assertProjectId(projectId);
		const { data } = await api.get(`/projects/${projectId}/api-docs`);
		return asProjectApiDocs(unwrapDataEnvelope(data));
	},
};

export default ProjectService;

