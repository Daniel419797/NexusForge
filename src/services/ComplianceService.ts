import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

function projectHeaders(projectId?: string) {
    if (projectId !== undefined) {
        assertProjectId(projectId);
    }
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

function optionalNumberOrNull(value: unknown): number | null {
    if (value == null) return null;
    assert(typeof value === "number" && Number.isFinite(value), "Expected finite number or null");
    return value;
}

function asConsentStatus(value: unknown): ConsentStatus {
    assert(isRecord(value), "Invalid consent status item");
    return {
        consentType: requiredString(value.consentType, "consentType") as ConsentType,
        granted: requiredBoolean(value.granted, "granted"),
        updatedAt: requiredString(value.updatedAt, "updatedAt"),
    };
}

function asConsentRecord(value: unknown): ConsentRecord {
    assert(isRecord(value), "Invalid consent record item");
    return {
        id: requiredString(value.id, "id"),
        consentType: requiredString(value.consentType, "consentType") as ConsentType,
        granted: requiredBoolean(value.granted, "granted"),
        createdAt: requiredString(value.createdAt, "createdAt"),
    };
}

function asAuditLogEntry(value: unknown): AuditLogEntry {
    assert(isRecord(value), "Invalid audit log item");
    return {
        id: requiredString(value.id, "id"),
        action: requiredString(value.action, "action"),
        resource: optionalStringOrNull(value.resource),
        resourceId: optionalStringOrNull(value.resourceId),
        createdAt: requiredString(value.createdAt, "createdAt"),
    };
}

function asUnsubscribedResult(value: unknown): { unsubscribed: boolean } {
    assert(isRecord(value), "Invalid unsubscribe response");
    return {
        unsubscribed: requiredBoolean(value.unsubscribed, "unsubscribed"),
    };
}

function asHipaaStatus(value: unknown): HipaaStatus {
    assert(isRecord(value), "Invalid HIPAA status response");
    assert(isRecord(value.controls), "Invalid HIPAA controls response");
    return {
        hipaaMode: requiredBoolean(value.hipaaMode, "hipaaMode"),
        projectId: optionalStringOrNull(value.projectId),
        controls: {
            httpsEnforced: requiredBoolean(value.controls.httpsEnforced, "controls.httpsEnforced"),
            sessionTimeoutSeconds: optionalNumberOrNull(value.controls.sessionTimeoutSeconds),
            passwordComplexity: requiredBoolean(value.controls.passwordComplexity, "controls.passwordComplexity"),
            phiEncryption: requiredBoolean(value.controls.phiEncryption, "controls.phiEncryption"),
            auditRetentionDays: optionalNumberOrNull(value.controls.auditRetentionDays),
            noCacheHeaders: requiredBoolean(value.controls.noCacheHeaders, "controls.noCacheHeaders"),
            maxAccessTokenExpiry: requiredString(value.controls.maxAccessTokenExpiry, "controls.maxAccessTokenExpiry"),
            maxRefreshTokenExpiry: requiredString(value.controls.maxRefreshTokenExpiry, "controls.maxRefreshTokenExpiry"),
        },
    };
}

function asDataExport(value: unknown): DataExport {
    assert(isRecord(value), "Invalid data export response");
    assert(isRecord(value.user), "Invalid export user payload");
    return {
        user: {
            id: requiredString(value.user.id, "user.id"),
            email: requiredString(value.user.email, "user.email"),
            name: requiredString(value.user.name, "user.name"),
            role: requiredString(value.user.role, "user.role"),
            emailVerified: requiredBoolean(value.user.emailVerified, "user.emailVerified"),
            createdAt: requiredString(value.user.createdAt, "user.createdAt"),
            updatedAt: requiredString(value.user.updatedAt, "user.updatedAt"),
            metadata: value.user.metadata,
        },
        consentHistory: toArray(value.consentHistory, (item): { consentType: string; granted: boolean; createdAt: string } => {
            assert(isRecord(item), "Invalid consent history item");
            return {
                consentType: requiredString(item.consentType, "consentHistory.consentType"),
                granted: requiredBoolean(item.granted, "consentHistory.granted"),
                createdAt: requiredString(item.createdAt, "consentHistory.createdAt"),
            };
        }),
        auditTrail: toArray(value.auditTrail, (item): { action: string; resource: string | null; createdAt: string } => {
            assert(isRecord(item), "Invalid audit trail item");
            return {
                action: requiredString(item.action, "auditTrail.action"),
                resource: optionalStringOrNull(item.resource),
                createdAt: requiredString(item.createdAt, "auditTrail.createdAt"),
            };
        }),
        projectMemberships: Array.isArray(value.projectMemberships)
            ? value.projectMemberships.map((item): { projectId: string; role: string; joinedAt: string } => {
                assert(isRecord(item), "Invalid project membership item");
                return {
                    projectId: requiredString(item.projectId, "projectMemberships.projectId"),
                    role: requiredString(item.role, "projectMemberships.role"),
                    joinedAt: requiredString(item.joinedAt, "projectMemberships.joinedAt"),
                };
            })
            : undefined,
        exportedAt: requiredString(value.exportedAt, "exportedAt"),
        format: requiredString(value.format, "format"),
    };
}

function asDeletionResult(value: unknown): DeletionResult {
    assert(isRecord(value), "Invalid deletion response");
    assert(isRecord(value.recordsRemoved), "Invalid recordsRemoved payload");
    const deletedFrom = value.deletedFrom;
    assert(deletedFrom === "platform" || deletedFrom === "tenant", "Invalid deletedFrom value");

    return {
        userId: requiredString(value.userId, "userId"),
        deletedFrom,
        recordsRemoved: {
            refreshTokens: Number(value.recordsRemoved.refreshTokens ?? 0),
            consentLogs: Number(value.recordsRemoved.consentLogs ?? 0),
            auditLogs: Number(value.recordsRemoved.auditLogs ?? 0),
        },
        piiMinimized: requiredBoolean(value.piiMinimized, "piiMinimized"),
        deletedAt: requiredString(value.deletedAt, "deletedAt"),
    };
}

function asBreachRecord(value: unknown): BreachRecord {
    assert(isRecord(value), "Invalid breach record response");
    const severity = value.severity;
    assert(severity === "low" || severity === "medium" || severity === "high" || severity === "critical", "Invalid breach severity");
    return {
        id: requiredString(value.id, "id"),
        date: requiredString(value.date, "date"),
        description: requiredString(value.description, "description"),
        dataAffected: requiredString(value.dataAffected, "dataAffected"),
        actionsTaken: requiredString(value.actionsTaken, "actionsTaken"),
        recommendedActions: requiredString(value.recommendedActions, "recommendedActions"),
        severity,
        createdAt: value.createdAt == null ? undefined : requiredString(value.createdAt, "createdAt"),
    };
}

const ComplianceService = {
    // Data Export
    async exportData(projectId?: string): Promise<DataExport> {
        const { data } = await api.get("/compliance/export", projectHeaders(projectId));
        return asDataExport(unwrapDataEnvelope(data));
    },

    // Account Deletion
    async deleteAccount(projectId?: string): Promise<DeletionResult> {
        const { data } = await api.post("/compliance/delete-account", {
            confirmation: "DELETE_MY_ACCOUNT",
        }, projectHeaders(projectId));
        return asDeletionResult(unwrapDataEnvelope(data));
    },

    // Consent Management
    async getConsentStatus(projectId?: string): Promise<ConsentStatus[]> {
        const { data } = await api.get("/compliance/consent", projectHeaders(projectId));
        return toArray(unwrapDataEnvelope(data), asConsentStatus);
    },

    async recordConsent(consentType: ConsentType, granted: boolean, projectId?: string): Promise<ConsentRecord> {
        assertNonEmptyString(consentType, "consentType");
        const { data } = await api.post("/compliance/consent", { consentType, granted }, projectHeaders(projectId));
        return asConsentRecord(unwrapDataEnvelope(data));
    },

    async getConsentHistory(projectId?: string): Promise<ConsentRecord[]> {
        const { data } = await api.get("/compliance/consent/history", projectHeaders(projectId));
        return toArray(unwrapDataEnvelope(data), asConsentRecord);
    },

    // Audit Logs
    async getAuditLogs(limit = 100, projectId?: string): Promise<AuditLogEntry[]> {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("limit must be a positive integer");
        }
        const { data } = await api.get(`/compliance/audit-logs?limit=${limit}`, projectHeaders(projectId));
        return toArray(unwrapDataEnvelope(data), asAuditLogEntry);
    },

    // HIPAA Status
    async getHipaaStatus(projectId?: string): Promise<HipaaStatus> {
        const { data } = await api.get("/compliance/hipaa-status", projectHeaders(projectId));
        return asHipaaStatus(unwrapDataEnvelope(data));
    },

    // HIPAA Toggle (per-project)
    async toggleHipaaMode(enabled: boolean, projectId?: string): Promise<{ hipaaMode: boolean; projectId: string }> {
        const { data } = await api.post("/compliance/hipaa-toggle", { enabled }, projectHeaders(projectId));
        const status = asHipaaStatus(unwrapDataEnvelope(data));
        return {
            hipaaMode: status.hipaaMode,
            projectId: requiredString(status.projectId, "projectId"),
        };
    },

    async getUnsubscribeToken(projectId?: string): Promise<UnsubscribeTokenResult> {
        const { data } = await api.get("/compliance/unsubscribe-token", projectHeaders(projectId));
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), "Invalid unsubscribe token response");
        return { token: requiredString(raw.token, "token") };
    },

    async unsubscribeWithToken(token: string): Promise<{ unsubscribed: boolean }> {
        assertNonEmptyString(token, "token");
        const { data } = await api.post("/compliance/unsubscribe", { token });
        return asUnsubscribedResult(unwrapDataEnvelope(data));
    },

    async reportBreach(payload: BreachReportPayload): Promise<BreachRecord> {
        assertNonEmptyString(payload.description, "description");
        assertNonEmptyString(payload.dataAffected, "dataAffected");
        const { data } = await api.post("/compliance/breach", payload);
        return asBreachRecord(unwrapDataEnvelope(data));
    },

    async listBreaches(limit = 50): Promise<BreachRecord[]> {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("limit must be a positive integer");
        }
        const { data } = await api.get(`/compliance/breach?limit=${limit}`);
        return toArray(unwrapDataEnvelope(data), asBreachRecord);
    },
};

export default ComplianceService;
