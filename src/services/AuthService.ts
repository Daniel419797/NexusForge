import api from "./api";
import { assert, assertNonEmptyString, isRecord, unwrapDataEnvelope } from "./serviceGuards";

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

export type AuthUser = AuthResponse["user"];

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function optionalString(value: unknown): string | undefined {
    if (value == null) return undefined;
    assert(typeof value === "string", "Expected string or undefined");
    return value;
}

function asAuthUser(value: unknown): AuthUser {
    assert(isRecord(value), "Invalid auth user response");
    return {
        id: requiredString(value.id, "user.id"),
        email: requiredString(value.email, "user.email"),
        name: value.name == null ? null : requiredString(value.name, "user.name"),
        role: optionalString(value.role),
    };
}

function asAuthResponse(value: unknown): AuthResponse {
    assert(isRecord(value), "Invalid auth response");
    return {
        accessToken: requiredString(value.accessToken, "accessToken"),
        refreshToken: requiredString(value.refreshToken, "refreshToken"),
        user: asAuthUser(value.user),
        projectToken: optionalString(value.projectToken),
        emailVerificationToken: optionalString(value.emailVerificationToken),
    };
}

function asMessageAction(value: unknown): { message?: string } {
    assert(isRecord(value), "Invalid action response");
    return {
        message: optionalString(value.message),
    };
}

const AuthService = {
    async login(payload: LoginPayload) {
        assertNonEmptyString(payload.email, "email");
        assertNonEmptyString(payload.password, "password");
        const { data } = await api.post<{ data: AuthResponse }>("/auth/login", payload);
        return asAuthResponse(unwrapDataEnvelope(data));
    },

    async register(payload: RegisterPayload) {
        assertNonEmptyString(payload.email, "email");
        assertNonEmptyString(payload.password, "password");
        const { data } = await api.post<{ data: AuthResponse }>("/auth/register", payload);
        return asAuthResponse(unwrapDataEnvelope(data));
    },

    async logout() {
        await api.post("/auth/logout");
    },

    async getProfile(): Promise<AuthUser | null> {
        const { data } = await api.get("/auth/me");
        const raw = unwrapDataEnvelope(data);
        if (raw == null) return null;
        return asAuthUser(raw);
    },

    getGoogleAuthUrl() {
        return '/api/v1/auth/oauth/google';
    },

    getGitHubAuthUrl() {
        return '/api/v1/auth/oauth/github';
    },

    async verifyEmail(token: string): Promise<{ verified?: boolean; message?: string }> {
        assertNonEmptyString(token, "token");
        const { data } = await api.post("/auth/verify-email", { token });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { verified: raw.verified == null ? undefined : Boolean(raw.verified), message: action.message }
            : action;
    },

    async resendVerification(email: string): Promise<{ sent?: boolean; message?: string }> {
        assertNonEmptyString(email, "email");
        const { data } = await api.post("/auth/resend-verification", { email });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { sent: raw.sent == null ? undefined : Boolean(raw.sent), message: action.message }
            : action;
    },

    async forgotPassword(email: string): Promise<{ sent?: boolean; message?: string }> {
        assertNonEmptyString(email, "email");
        const { data } = await api.post("/auth/forgot-password", { email });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { sent: raw.sent == null ? undefined : Boolean(raw.sent), message: action.message }
            : action;
    },

    async resetPassword(token: string, password: string): Promise<{ reset?: boolean; message?: string }> {
        assertNonEmptyString(token, "token");
        assertNonEmptyString(password, "password");
        const { data } = await api.post("/auth/reset-password", { token, password });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { reset: raw.reset == null ? undefined : Boolean(raw.reset), message: action.message }
            : action;
    },

    async exchangeOAuthCode(code: string): Promise<AuthResponse> {
        assertNonEmptyString(code, "code");
        const { data } = await api.post<{ data: AuthResponse }>("/auth/oauth/exchange", { code });
        return asAuthResponse(unwrapDataEnvelope(data));
    },
};

export default AuthService;
