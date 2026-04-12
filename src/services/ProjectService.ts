import api from "./api";
import type { Project } from "@/types";

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

export interface CreateProjectResult {
	project: Project;
	config: ProjectConfig;
	template: CategoryTemplate;
	projectToken: string;
}

const ProjectService = {
	async list(): Promise<Project[]> {
		const { data } = await api.get("/projects");
		return data.data || [];
	},

	// Returns the detailed project payload: { project, config, membership }
	async getById(projectId: string): Promise<ProjectDetail> {
		const { data } = await api.get(`/projects/${projectId}`);
		return data.data;
	},

	async getDbUrl(projectId: string): Promise<{ dbUrl: string | null }> {
		const { data } = await api.get(`/projects/${projectId}/config/db-url`);
		return data.data;
	},

	async create(payload: CreateProjectPayload): Promise<CreateProjectResult> {
		const { data } = await api.post("/projects", payload);
		return data.data;
	},

	async update(projectId: string, payload: UpdateProjectPayload): Promise<Partial<Project> & { updatedAt?: string } > {
		const { data } = await api.patch(`/projects/${projectId}`, payload);
		return data.data;
	},

	async updateConfig(projectId: string, config: Record<string, any>): Promise<ProjectConfig> {
		const { data } = await api.patch(`/projects/${projectId}/config`, config);
		return data.data;
	},

	async updateCors(projectId: string, allowedOrigins: string[]): Promise<{ allowedOrigins: string[] }> {
		const { data } = await api.patch(`/projects/${projectId}/cors`, { allowedOrigins });
		return data.data;
	},

	async delete(projectId: string): Promise<{ success: boolean }> {
		const { data } = await api.delete(`/projects/${projectId}`);
		return data.data;
	},

	async getTemplates(): Promise<CategoryTemplate[]> {
		const { data } = await api.get("/projects/templates");
		return data.data;
	},

	async getProjectToken(projectId: string): Promise<{ token: string; projectId: string; role: string }> {
		const { data } = await api.post(`/projects/${projectId}/token`);
		return data.data;
	},

	// Database operations
	async runMigrations(projectId: string): Promise<{ jobId: string }> {
		const { data } = await api.post(`/projects/${projectId}/migrate`);
		return data.data;
	},

	async getJobStatus(projectId: string, jobId: string): Promise<{ state: string; progress?: number; result?: any; failedReason?: string }> {
		const { data } = await api.get(`/projects/${projectId}/jobs/${jobId}`);
		return data.data;
	},

	async rotateDbUrl(
		projectId: string,
		payload: { dbUrl: string; dbType?: "postgresql" | "supabase" | "mssql" | "mongodb" }
	): Promise<{ dbUrl: string }> {
		const { data } = await api.post(`/projects/${projectId}/rotate-db-url`, payload);
		return data.data;
	},

	async migrateUsers(projectId: string): Promise<{ jobId: string }> {
		const { data } = await api.post(`/projects/${projectId}/migrate-users`);
		return data.data;
	},
};

export default ProjectService;

