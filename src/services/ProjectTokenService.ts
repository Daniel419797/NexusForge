import api from './api';
import { assertProjectId, assertNonEmptyString, isRecord, unwrapDataEnvelope } from './serviceGuards';

const API_TOKEN_STORAGE_KEY = (projectId: string) => `projectToken:${projectId}`;

const decodeJwtPayload = (token: string) => {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
};

const isTokenExpired = (token: string) => {
    const payload = decodeJwtPayload(token);
    if (!payload) return true;
    const exp = payload.exp as number | undefined;
    if (!exp) return true;
    // consider token expired if within 30 seconds of exp
    return Date.now() / 1000 >= (exp - 30);
};

const ProjectTokenService = {
    async fetchAndStore(projectId: string): Promise<string> {
        assertProjectId(projectId);
        const { data } = await api.post(`/projects/${projectId}/token`);
        const payload = unwrapDataEnvelope(data);
        const token = isRecord(payload) && typeof payload.token === 'string' ? payload.token : undefined;
        assertNonEmptyString(token ?? '', 'token');
        if (!token) throw new Error('Failed to obtain project token');
        try {
            localStorage.setItem(API_TOKEN_STORAGE_KEY(projectId), JSON.stringify({ token, fetchedAt: Date.now() }));
        } catch {
            // ignore storage errors
        }
        return token;
    },

    async getToken(projectId: string): Promise<string> {
        assertProjectId(projectId);
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem(API_TOKEN_STORAGE_KEY(projectId));
                if (raw) {
                    const parsed = JSON.parse(raw) as { token: string; fetchedAt: number };
                    if (parsed?.token && !isTokenExpired(parsed.token)) return parsed.token;
                }
            } catch {
                // continue to fetch if parse/storage fails
            }
        }

        // Request a fresh project token (requires the user access token to be present)
        return this.fetchAndStore(projectId);
    },

    clearToken(projectId: string): void {
        assertProjectId(projectId);
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(API_TOKEN_STORAGE_KEY(projectId));
            } catch {}
        }
    },
};

export default ProjectTokenService;
