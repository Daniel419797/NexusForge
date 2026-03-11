import api from "./api";
import axios from "axios";
import ProjectTokenService from "./ProjectTokenService";

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

const ApiKeyService = {
    async list(projectId: string) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            const { data } = await axios.get(`${API_BASE_URL}/api/v1/api-keys`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data.data;
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

    async create(projectId: string, payload: CreateApiKeyPayload) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const body = { ...payload, type: payload.type || 'publishable' } as CreateApiKeyPayload;
        const attempt = async (token: string) => {
            const { data } = await axios.post(`${API_BASE_URL}/api/v1/api-keys`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data.data;
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

    async revoke(keyId: string, projectId: string) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            const { data } = await axios.delete(`${API_BASE_URL}/api/v1/api-keys/${keyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data.data;
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

    async rotate(keyId: string, projectId: string) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const attempt = async (token: string) => {
            const { data } = await axios.post(`${API_BASE_URL}/api/v1/api-keys/${keyId}/rotate`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data.data;
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
