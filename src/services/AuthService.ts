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

export interface UpdateProfilePayload {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface MfaStatus {
    enabled: boolean;
}

export interface MfaSetup {
    otpauthUrl: string;
    manualEntrySecret: string;
}

export interface MfaStepUpResult {
    stepUpToken: string;
    expiresInSeconds: number;
}

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
    if (value == null) {
        return {};
    }
    assert(isRecord(value), "Invalid action response");
    return {
        message: optionalString(value.message),
    };
}

function asMfaStatus(value: unknown): MfaStatus {
    assert(isRecord(value), "Invalid MFA status response");
    assert(typeof value.enabled === "boolean", "Invalid MFA enabled state");
    return { enabled: value.enabled };
}

function asMfaSetup(value: unknown): MfaSetup {
    assert(isRecord(value), "Invalid MFA setup response");
    return {
        otpauthUrl: requiredString(value.otpauthUrl, "mfa.otpauthUrl"),
        manualEntrySecret: requiredString(value.manualEntrySecret, "mfa.manualEntrySecret"),
    };
}

function asMfaStepUpResult(value: unknown): MfaStepUpResult {
    assert(isRecord(value), "Invalid MFA step-up response");
    const expiresInSeconds = value.expiresInSeconds;
    assert(typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0, "Invalid MFA step-up expiry");
    return {
        stepUpToken: requiredString(value.stepUpToken, "mfa.stepUpToken"),
        expiresInSeconds,
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

    async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
        const { data } = await api.patch("/auth/me", payload);
        return asAuthUser(unwrapDataEnvelope(data));
    },

    async deleteAccount(): Promise<void> {
        await api.delete("/auth/me");
    },

    async getMfaStatus(): Promise<MfaStatus> {
        const { data } = await api.get("/auth/mfa/totp/status");
        return asMfaStatus(unwrapDataEnvelope(data));
    },

    async setupMfa(): Promise<MfaSetup> {
        const { data } = await api.post("/auth/mfa/totp/setup");
        return asMfaSetup(unwrapDataEnvelope(data));
    },

    async enableMfa(code: string): Promise<MfaStatus> {
        assertNonEmptyString(code, "code");
        const { data } = await api.post("/auth/mfa/totp/enable", { code });
        return asMfaStatus(unwrapDataEnvelope(data));
    },

    async disableMfa(code: string): Promise<MfaStatus> {
        assertNonEmptyString(code, "code");
        const { data } = await api.post("/auth/mfa/totp/disable", { code });
        return asMfaStatus(unwrapDataEnvelope(data));
    },

    async createMfaStepUp(code: string): Promise<MfaStepUpResult> {
        assertNonEmptyString(code, "code");
        const { data } = await api.post("/auth/mfa/totp/step-up", { code });
        return asMfaStepUpResult(unwrapDataEnvelope(data));
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
            ? {
                verified: raw.verified == null ? typeof raw.email === "string" : Boolean(raw.verified),
                message: action.message,
            }
            : action;
    },

    async resendVerification(email: string): Promise<{ sent?: boolean; message?: string }> {
        assertNonEmptyString(email, "email");
        const { data } = await api.post("/auth/resend-verification", { email });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { sent: raw.sent == null ? true : Boolean(raw.sent), message: action.message }
            : { sent: true, message: action.message };
    },

    async forgotPassword(email: string): Promise<{ sent?: boolean; message?: string }> {
        assertNonEmptyString(email, "email");
        const { data } = await api.post("/auth/forgot-password", { email });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? { sent: raw.sent == null ? true : Boolean(raw.sent), message: action.message }
            : { sent: true, message: action.message };
    },

    async resetPassword(token: string, password: string): Promise<{ reset?: boolean; message?: string }> {
        assertNonEmptyString(token, "token");
        assertNonEmptyString(password, "password");
        const { data } = await api.post("/auth/reset-password", { token, password });
        const raw = unwrapDataEnvelope(data);
        const action = asMessageAction(raw);
        return isRecord(raw)
            ? {
                reset: raw.reset == null ? typeof raw.email === "string" : Boolean(raw.reset),
                message: action.message,
            }
            : action;
    },

    async exchangeOAuthCode(code: string): Promise<AuthResponse> {
        assertNonEmptyString(code, "code");
        const { data } = await api.post<{ data: AuthResponse }>("/auth/oauth/exchange", { code });
        return asAuthResponse(unwrapDataEnvelope(data));
    },
};

export default AuthService;
