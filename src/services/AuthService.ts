import api from "./api";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    name?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        role?: string;
    };
    /** Returned when registering/logging in via a project gateway with tenantOwnedAuth */
    projectToken?: string;
    /** Returned on registration when email verification is enabled */
    emailVerificationToken?: string;
}

const AuthService = {
    async login(payload: LoginPayload) {
        const { data } = await api.post<{ data: AuthResponse }>("/auth/login", payload);
        return data.data;
    },

    async register(payload: RegisterPayload) {
        const { data } = await api.post<{ data: AuthResponse }>("/auth/register", payload);
        return data.data;
    },

    async logout() {
        await api.post("/auth/logout");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },

    async getProfile() {
        const { data } = await api.get("/auth/me");
        return data.data;
    },

    getGoogleAuthUrl() {
        return `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/api/v1/auth/oauth/google`;
    },

    getGitHubAuthUrl() {
        return `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/api/v1/auth/oauth/github`;
    },

    async verifyEmail(token: string) {
        const { data } = await api.post("/auth/verify-email", { token });
        return data.data;
    },

    async resendVerification(email: string) {
        const { data } = await api.post("/auth/resend-verification", { email });
        return data.data;
    },

    async forgotPassword(email: string) {
        const { data } = await api.post("/auth/forgot-password", { email });
        return data.data;
    },

    async resetPassword(token: string, password: string) {
        const { data } = await api.post("/auth/reset-password", { token, password });
        return data.data;
    },

    async exchangeOAuthCode(code: string): Promise<AuthResponse> {
        const { data } = await api.post<{ data: AuthResponse }>("/auth/oauth/exchange", { code });
        return data.data;
    },
};

export default AuthService;
