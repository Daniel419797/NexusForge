import api from "./api";

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

const ComplianceService = {
    // Data Export
    async exportData(): Promise<DataExport> {
        const { data } = await api.get("/compliance/export");
        return data.data;
    },

    // Account Deletion
    async deleteAccount(): Promise<DeletionResult> {
        const { data } = await api.post("/compliance/delete-account", {
            confirmation: "DELETE_MY_ACCOUNT",
        });
        return data.data;
    },

    // Consent Management
    async getConsentStatus(): Promise<ConsentStatus[]> {
        const { data } = await api.get("/compliance/consent");
        return data.data;
    },

    async recordConsent(consentType: ConsentType, granted: boolean): Promise<ConsentRecord> {
        const { data } = await api.post("/compliance/consent", { consentType, granted });
        return data.data;
    },

    async getConsentHistory(): Promise<ConsentRecord[]> {
        const { data } = await api.get("/compliance/consent/history");
        return data.data;
    },

    // Audit Logs
    async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
        const { data } = await api.get(`/compliance/audit-logs?limit=${limit}`);
        return data.data;
    },

    // HIPAA Status
    async getHipaaStatus(): Promise<HipaaStatus> {
        const { data } = await api.get("/compliance/hipaa-status");
        return data.data;
    },

    // HIPAA Toggle (per-project)
    async toggleHipaaMode(enabled: boolean): Promise<{ hipaaMode: boolean; projectId: string }> {
        const { data } = await api.post("/compliance/hipaa-toggle", { enabled });
        return data.data;
    },
};

export default ComplianceService;
