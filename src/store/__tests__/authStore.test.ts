import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';

beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });
    localStorage.clear();
    vi.clearAllMocks();
});

describe('authStore', () => {
    describe('initial state', () => {
        it('has default values', () => {
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(true);
        });
    });

    describe('setUser', () => {
        it('sets user and marks authenticated', () => {
            const user = { id: 'u1', email: 'test@test.com', name: 'Test' };
            useAuthStore.getState().setUser(user);
            const state = useAuthStore.getState();
            expect(state.user).toEqual(user);
            expect(state.isAuthenticated).toBe(true);
            expect(state.isLoading).toBe(false);
        });

        it('clears user when set to null', () => {
            const user = { id: 'u1', email: 'test@test.com', name: 'Test' };
            useAuthStore.getState().setUser(user);
            useAuthStore.getState().setUser(null);
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('setLoading', () => {
        it('updates loading state', () => {
            useAuthStore.getState().setLoading(false);
            expect(useAuthStore.getState().isLoading).toBe(false);
            useAuthStore.getState().setLoading(true);
            expect(useAuthStore.getState().isLoading).toBe(true);
        });
    });

    describe('logout', () => {
        it('clears user, auth state, and tokens', () => {
            localStorage.setItem('accessToken', 'tok');
            localStorage.setItem('refreshToken', 'ref');
            useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', name: 'A' });

            useAuthStore.getState().logout();

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(false);
            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
        });
    });
});
