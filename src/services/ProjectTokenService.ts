import api from './api';
import { assertProjectId, assertNonEmptyString, isRecord, unwrapDataEnvelope } from './serviceGuards';

const tokenCache = new Map<string, string>();

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
        tokenCache.set(projectId, token);
        return token;
    },

    async getToken(projectId: string): Promise<string> {
        assertProjectId(projectId);
        const cached = tokenCache.get(projectId);
        if (cached && !isTokenExpired(cached)) return cached;

        // Request a fresh project token using the authenticated browser session.
        return this.fetchAndStore(projectId);
    },

    clearToken(projectId: string): void {
        assertProjectId(projectId);
        tokenCache.delete(projectId);
    },
};

export default ProjectTokenService;
