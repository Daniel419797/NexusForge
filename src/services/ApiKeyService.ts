import axios from "axios";
import ProjectTokenService from "./ProjectTokenService";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    expiresAt: string | null;
    createdAt: string;
}

export interface CreateApiKeyPayload {
    name: string;
    type?: 'publishable' | 'secret';
    scopes?: string[];
    expiresInDays?: number;
}

export interface ApiKeyCreateResult {
    id?: string;
    keyPrefix?: string;
    type?: string;
    createdAt?: string;
    label?: string | null;
    expiresAt?: string | null;
    key?: string;
    apiKey?: string;
    [key: string]: unknown;
}

export interface ApiKeyRotateResult {
    revokedKeyId?: string;
    key?: string;
    newKey?: {
        id?: string;
        keyPrefix?: string;
        type?: string;
        createdAt?: string;
        label?: string | null;
        expiresAt?: string | null;
        key?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function optionalStringOrNull(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    assert(typeof value === "string", "Expected string, null, or undefined");
    return value;
}

function asApiKey(value: unknown): ApiKey {
    assert(isRecord(value), "Invalid API key list item");
    const id = requiredString(value.id, "apiKey.id");
    const prefixCandidate =
        (typeof value.prefix === "string" && value.prefix) ||
        (typeof value.keyPrefix === "string" && value.keyPrefix) ||
        (typeof value.maskedKey === "string" && value.maskedKey) ||
        undefined;
    const prefix = requiredString(prefixCandidate, "apiKey.prefix");
    const name =
        (typeof value.name === "string" && value.name) ||
        (typeof value.label === "string" && value.label) ||
        "API Key";
    const createdAt = requiredString(value.createdAt, "apiKey.createdAt");

    return {
        id,
        name,
        prefix,
        scopes: toArray(value.scopes, (item) => String(item)),
        expiresAt: optionalStringOrNull(value.expiresAt) ?? null,
        createdAt,
    };
}

function asApiKeyCreateResult(value: unknown): ApiKeyCreateResult {
    assert(isRecord(value), "Invalid API key create response");
    return {
        id: value.id == null ? undefined : requiredString(value.id, "id"),
        keyPrefix: value.keyPrefix == null ? undefined : requiredString(value.keyPrefix, "keyPrefix"),
        type: value.type == null ? undefined : requiredString(value.type, "type"),
        createdAt: value.createdAt == null ? undefined : requiredString(value.createdAt, "createdAt"),
        label: optionalStringOrNull(value.label) ?? null,
        expiresAt: optionalStringOrNull(value.expiresAt) ?? null,
        key: value.key == null ? undefined : requiredString(value.key, "key"),
        apiKey: value.apiKey == null ? undefined : requiredString(value.apiKey, "apiKey"),
    };
}

function asRevokeResult(value: unknown): { success?: boolean; message?: string } {
    assert(isRecord(value), "Invalid API key revoke response");
    const isActive = value.isActive;
    const derivedSuccess = typeof isActive === "boolean" ? !isActive : undefined;
    return {
        success: typeof value.success === "boolean" ? value.success : derivedSuccess,
        message: value.message == null ? undefined : requiredString(value.message, "message"),
    };
}

function asApiKeyRotateResult(value: unknown): ApiKeyRotateResult {
    assert(isRecord(value), "Invalid API key rotate response");
    const rawNewKey = value.newKey;
    if (rawNewKey != null) {
        assert(isRecord(rawNewKey), "Invalid newKey payload");
    }
    return {
        revokedKeyId: value.revokedKeyId == null ? undefined : requiredString(value.revokedKeyId, "revokedKeyId"),
        key: value.key == null ? undefined : requiredString(value.key, "key"),
        newKey: rawNewKey == null
            ? undefined
            : {
                id: rawNewKey.id == null ? undefined : requiredString(rawNewKey.id, "newKey.id"),
                keyPrefix: rawNewKey.keyPrefix == null ? undefined : requiredString(rawNewKey.keyPrefix, "newKey.keyPrefix"),
                type: rawNewKey.type == null ? undefined : requiredString(rawNewKey.type, "newKey.type"),
                createdAt: rawNewKey.createdAt == null ? undefined : requiredString(rawNewKey.createdAt, "newKey.createdAt"),
                label: optionalStringOrNull(rawNewKey.label) ?? null,
                expiresAt: optionalStringOrNull(rawNewKey.expiresAt) ?? null,
                key: rawNewKey.key == null ? undefined : requiredString(rawNewKey.key, "newKey.key"),
            },
    };
}

const ApiKeyService = {
    async list(projectId: string): Promise<ApiKey[]> {
        assertProjectId(projectId);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            assertNonEmptyString(token, "token");
            const { data } = await axios.get(`${API_BASE_URL}/api/v1/api-keys`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return toArray(unwrapDataEnvelope(data), asApiKey);
        };

        let token = await ProjectTokenService.getToken(projectId);
        try {
            return await attempt(token);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                // token expired or revoked; refresh and retry once
                ProjectTokenService.clearToken(projectId);
                token = await ProjectTokenService.getToken(projectId);
                return await attempt(token);
            }
            throw err;
        }
    },

    async create(projectId: string, payload: CreateApiKeyPayload): Promise<ApiKeyCreateResult> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.name, "name");
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const body = { ...payload, type: payload.type || 'publishable' } as CreateApiKeyPayload;
        const attempt = async (token: string) => {
            assertNonEmptyString(token, "token");
            const { data } = await axios.post(`${API_BASE_URL}/api/v1/api-keys`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return asApiKeyCreateResult(unwrapDataEnvelope(data));
        };

        let token = await ProjectTokenService.getToken(projectId);
        try {
            return await attempt(token);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                ProjectTokenService.clearToken(projectId);
                token = await ProjectTokenService.getToken(projectId);
                return await attempt(token);
            }
            throw err;
        }
    },

    async revoke(keyId: string, projectId: string): Promise<{ success?: boolean; message?: string }> {
        assertProjectId(projectId);
        assertNonEmptyString(keyId, "keyId");
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            assertNonEmptyString(token, "token");
            const { data } = await axios.delete(`${API_BASE_URL}/api/v1/api-keys/${keyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return asRevokeResult(unwrapDataEnvelope(data));
        };

        let token = await ProjectTokenService.getToken(projectId);
        try {
            return await attempt(token);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                ProjectTokenService.clearToken(projectId);
                token = await ProjectTokenService.getToken(projectId);
                return await attempt(token);
            }
            throw err;
        }
    },

    async rotate(keyId: string, projectId: string): Promise<ApiKeyRotateResult> {
        assertProjectId(projectId);
        assertNonEmptyString(keyId, "keyId");
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            assertNonEmptyString(token, "token");
            const { data } = await axios.post(`${API_BASE_URL}/api/v1/api-keys/${keyId}/rotate`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return asApiKeyRotateResult(unwrapDataEnvelope(data));
        };

        let token = await ProjectTokenService.getToken(projectId);
        try {
            return await attempt(token);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                ProjectTokenService.clearToken(projectId);
                token = await ProjectTokenService.getToken(projectId);
                return await attempt(token);
            }
            throw err;
        }
    },
};

export default ApiKeyService;
