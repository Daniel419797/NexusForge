export interface User {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role?: string;
    createdAt?: string;
}

export interface Project {
    id: string;
    /** Auto-generated subdomain slug, e.g. "my-app-69e93f31" */
    slug?: string;
    /** Full gateway URL, e.g. "https://my-app-69e93f31.reuse.app" */
    apiUrl?: string;
    name: string;
    category: string;
    status: string;
    ownerId: string;
    description?: string;
    enabledModules?: string[];
    // optional detailed config returned by project detail API
    config?: {
        dbType: string;
        dbUrl?: string | null;
        dbConnected?: boolean;
        settings?: {
            tenantOwnedAuth?: boolean;
            jwtSecret?: string;
            sslMode?: string;
            poolSize?: number;
            schemaName?: string;
            allowedOrigins?: string[];
            [key: string]: any;
        };
    } | null;
    membership?: { role: string; joinedAt: string } | null;
    createdAt: string;
    updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    status: number;
    data: T;
}

export interface PaginatedResult<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    body?: string;
    read: boolean;
    createdAt: string;
}

export interface ChatRoom {
    id: string;
    name: string;
    type: "public" | "private" | "dm";
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    updatedAt?: string;
}

// ── Deploy types ────────────────────────────────────────────────────────────

export type DeployStatus =
    | 'pending'
    | 'validating'
    | 'provisioning'
    | 'activating'
    | 'live'
    | 'failed'
    | 'rolled_back'
    | 'superseded';

export type DeployStep =
    | 'validate'
    | 'snapshot'
    | 'provision_db'
    | 'migrate_schema'
    | 'activate_routes'
    | 'apply_policies'
    | 'health_check'
    | 'go_live';

export interface Deployment {
    id: string;
    projectId?: string;
    version: number;
    status: DeployStatus;
    configSnapshot?: unknown;
    apiUrl: string | null;
    enabledModules: string[];
    deployedBy: string;
    errorMessage: string | null;
    releaseNote: string | null;
    createdAt: string;
    liveAt: string | null;
    rolledBackAt: string | null;
}

export interface DeploymentLog {
    id: string;
    deploymentId: string;
    step: DeployStep;
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    message: string | null;
    startedAt: string | null;
    completedAt: string | null;
}

export interface ReadinessCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
}

export interface ReadinessResult {
    ready: boolean;
    checks: ReadinessCheck[];
}

export interface DeploymentListResult {
    deployments: Deployment[];
    total: number;
    limit: number;
    offset: number;
}

export interface DeploymentDetail {
    deployment: Deployment;
    logs: DeploymentLog[];
}
