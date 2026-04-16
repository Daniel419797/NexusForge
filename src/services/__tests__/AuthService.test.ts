import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@/services/AuthService';

// Mock the api module
vi.mock('@/services/api', () => {
    const mockPost = vi.fn();
    const mockGet = vi.fn();
    return {
        default: {
            post: mockPost,
            get: mockGet,
        },
        onApiError: vi.fn(() => vi.fn()),
    };
});

import api from '@/services/api';
const mockPost = vi.mocked(api.post);
const mockGet = vi.mocked(api.get);

const mockAuthResponse = {
    data: {
        data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
            user: { id: 'u1', email: 'test@test.com', name: 'Test User' },
        },
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('AuthService', () => {
    describe('login', () => {
        it('posts credentials and returns auth data', async () => {
            mockPost.mockResolvedValue(mockAuthResponse);
            const result = await AuthService.login({ email: 'test@test.com', password: 'pass123' });
            expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'pass123' });
            expect(result).toEqual(mockAuthResponse.data.data);
        });

        it('propagates API errors', async () => {
            mockPost.mockRejectedValue(new Error('Network error'));
            await expect(AuthService.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow('Network error');
        });
    });

    describe('register', () => {
        it('posts registration payload and returns auth data', async () => {
            mockPost.mockResolvedValue(mockAuthResponse);
            const result = await AuthService.register({ email: 'new@test.com', password: 'pass123', name: 'New' });
            expect(mockPost).toHaveBeenCalledWith('/auth/register', { email: 'new@test.com', password: 'pass123', name: 'New' });
            expect(result).toEqual(mockAuthResponse.data.data);
        });
    });

    describe('logout', () => {
        it('calls logout endpoint', async () => {
            mockPost.mockResolvedValue({ data: {} });
            await AuthService.logout();
            expect(mockPost).toHaveBeenCalledWith('/auth/logout');
        });
    });

    describe('getProfile', () => {
        it('fetches and returns current user', async () => {
            const user = { id: 'u1', email: 'test@test.com', name: 'Test' };
            mockGet.mockResolvedValue({ data: { data: user } });
            const result = await AuthService.getProfile();
            expect(mockGet).toHaveBeenCalledWith('/auth/me');
            expect(result).toEqual(user);
        });
    });

    describe('OAuth URLs', () => {
        it('returns google auth URL', () => {
            const url = AuthService.getGoogleAuthUrl();
            expect(url).toContain('/api/v1/auth/oauth/google');
        });

        it('returns github auth URL', () => {
            const url = AuthService.getGitHubAuthUrl();
            expect(url).toContain('/api/v1/auth/oauth/github');
        });
    });

    describe('verifyEmail', () => {
        it('sends token for verification', async () => {
            mockPost.mockResolvedValue({ data: { data: { verified: true } } });
            const result = await AuthService.verifyEmail('verification-token');
            expect(mockPost).toHaveBeenCalledWith('/auth/verify-email', { token: 'verification-token' });
            expect(result).toEqual({ verified: true });
        });
    });

    describe('resendVerification', () => {
        it('sends email for re-verification', async () => {
            mockPost.mockResolvedValue({ data: { data: { sent: true } } });
            const result = await AuthService.resendVerification('user@test.com');
            expect(mockPost).toHaveBeenCalledWith('/auth/resend-verification', { email: 'user@test.com' });
            expect(result).toEqual({ sent: true });
        });
    });

    describe('forgotPassword', () => {
        it('sends email for password reset', async () => {
            mockPost.mockResolvedValue({ data: { data: { sent: true } } });
            const result = await AuthService.forgotPassword('user@test.com');
            expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@test.com' });
            expect(result).toEqual({ sent: true });
        });
    });

    describe('resetPassword', () => {
        it('sends token and new password', async () => {
            mockPost.mockResolvedValue({ data: { data: { reset: true } } });
            const result = await AuthService.resetPassword('reset-tok', 'newpass123');
            expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'reset-tok', password: 'newpass123' });
            expect(result).toEqual({ reset: true });
        });
    });

    describe('exchangeOAuthCode', () => {
        it('posts code and returns auth data', async () => {
            mockPost.mockResolvedValue(mockAuthResponse);
            const result = await AuthService.exchangeOAuthCode('abc123');
            expect(mockPost).toHaveBeenCalledWith('/auth/oauth/exchange', { code: 'abc123' });
            expect(result).toEqual(mockAuthResponse.data.data);
        });

        it('propagates API errors', async () => {
            mockPost.mockRejectedValue(new Error('invalid or expired code'));
            await expect(AuthService.exchangeOAuthCode('bad-code')).rejects.toThrow('invalid or expired code');
        });
    });
});
