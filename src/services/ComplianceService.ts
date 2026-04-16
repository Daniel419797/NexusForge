import api from "./api";

function projectHeaders(projectId?: string) {
    return projectId ? { headers: { "x-project-id": projectId } } : undefined;
}

export type ConsentType =
    | "data_processing"
    | "marketing_emails"
    | "analytics"
    | "third_party_sharing"
    | "cookies"
    | "terms_of_service";

export interface ConsentStatus {
    consentType: ConsentType;
    granted: boolean;
    updatedAt: string;
}

export interface ConsentRecord {
    id: string;
    consentType: ConsentType;
    granted: boolean;
    createdAt: string;
}

export interface DataExport {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
        metadata: unknown;
    };
    consentHistory: Array<{ consentType: string; granted: boolean; createdAt: string }>;
    auditTrail: Array<{ action: string; resource: string | null; createdAt: string }>;
    projectMemberships?: Array<{ projectId: string; role: string; joinedAt: string }>;
    exportedAt: string;
    format: string;
}

export interface DeletionResult {
    userId: string;
    deletedFrom: "platform" | "tenant";
    recordsRemoved: { refreshTokens: number; consentLogs: number; auditLogs: number };
    piiMinimized: boolean;
    deletedAt: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    createdAt: string;
}

export interface HipaaStatus {
    hipaaMode: boolean;
    projectId: string | null;
    controls: {
        httpsEnforced: boolean;
        sessionTimeoutSeconds: number | null;
        passwordComplexity: boolean;
        phiEncryption: boolean;
        auditRetentionDays: number | null;
        noCacheHeaders: boolean;
        maxAccessTokenExpiry: string;
        maxRefreshTokenExpiry: string;
    };
}

export interface UnsubscribeTokenResult {
    token: string;
}

export interface BreachReportPayload {
    date?: string;
    description: string;
    dataAffected: string;
    actionsTaken?: string;
    recommendedActions?: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedUserIds?: string[];
}

export interface BreachRecord {
    id: string;
    date: string;
    description: string;
    dataAffected: string;
    actionsTaken: string;
    recommendedActions: string;
    severity: "low" | "medium" | "high" | "critical";
    createdAt?: string;
}

const ComplianceService = {
    // Data Export
    async exportData(projectId?: string): Promise<DataExport> {
        const { data } = await api.get("/compliance/export", projectHeaders(projectId));
        return data.data;
    },

    // Account Deletion
    async deleteAccount(projectId?: string): Promise<DeletionResult> {
        const { data } = await api.post("/compliance/delete-account", {
            confirmation: "DELETE_MY_ACCOUNT",
        }, projectHeaders(projectId));
        return data.data;
    },

    // Consent Management
    async getConsentStatus(projectId?: string): Promise<ConsentStatus[]> {
        const { data } = await api.get("/compliance/consent", projectHeaders(projectId));
        return data.data;
    },

    async recordConsent(consentType: ConsentType, granted: boolean, projectId?: string): Promise<ConsentRecord> {
        const { data } = await api.post("/compliance/consent", { consentType, granted }, projectHeaders(projectId));
        return data.data;
    },

    async getConsentHistory(projectId?: string): Promise<ConsentRecord[]> {
        const { data } = await api.get("/compliance/consent/history", projectHeaders(projectId));
        return data.data;
    },

    // Audit Logs
    async getAuditLogs(limit = 100, projectId?: string): Promise<AuditLogEntry[]> {
        const { data } = await api.get(`/compliance/audit-logs?limit=${limit}`, projectHeaders(projectId));
        return data.data;
    },

    // HIPAA Status
    async getHipaaStatus(projectId?: string): Promise<HipaaStatus> {
        const { data } = await api.get("/compliance/hipaa-status", projectHeaders(projectId));
        return data.data;
    },

    // HIPAA Toggle (per-project)
    async toggleHipaaMode(enabled: boolean, projectId?: string): Promise<{ hipaaMode: boolean; projectId: string }> {
        const { data } = await api.post("/compliance/hipaa-toggle", { enabled }, projectHeaders(projectId));
        return data.data;
    },

    async getUnsubscribeToken(projectId?: string): Promise<UnsubscribeTokenResult> {
        const { data } = await api.get("/compliance/unsubscribe-token", projectHeaders(projectId));
        return data.data;
    },

    async unsubscribeWithToken(token: string): Promise<{ unsubscribed: boolean }> {
        const { data } = await api.post("/compliance/unsubscribe", { token });
        return data.data;
    },

    async reportBreach(payload: BreachReportPayload): Promise<BreachRecord> {
        const { data } = await api.post("/compliance/breach", payload);
        return data.data;
    },

    async listBreaches(limit = 50): Promise<BreachRecord[]> {
        const { data } = await api.get(`/compliance/breach?limit=${limit}`);
        return data.data;
    },
};

export default ComplianceService;
