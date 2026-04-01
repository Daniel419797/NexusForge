import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import LoginPage from '@/components/Auth/LoginPage';

// Mock AuthService
const mockLogin = vi.fn();
vi.mock('@/services/AuthService', () => ({
    default: { login: (...args: unknown[]) => mockLogin(...args) },
}));

// Mock OAuthButtons (non-essential for unit tests)
vi.mock('@/components/Auth/OAuthButtons', () => ({
    default: () => <div data-testid="oauth-buttons">OAuth</div>,
}));

// Capture router.push calls
const mockPush = vi.fn();
vi.mock('next/navigation', async () => {
    const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
    return {
        ...actual,
        useRouter: () => ({
            push: mockPush,
            replace: vi.fn(),
            back: vi.fn(),
            prefetch: vi.fn(),
            refresh: vi.fn(),
        }),
    };
});

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('LoginPage', () => {
    it('renders login form with all fields', () => {
        render(<LoginPage />);
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders OAuth buttons', () => {
        render(<LoginPage />);
        expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument();
    });

    it('shows forgot password link', () => {
        render(<LoginPage />);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('shows register link', () => {
        render(<LoginPage />);
        expect(screen.getByText(/create one/i)).toBeInTheDocument();
    });

    it('submits form and redirects on success', async () => {
        mockLogin.mockResolvedValue({
            accessToken: 'tok',
            refreshToken: 'ref',
            user: { id: 'u1', email: 'test@test.com', name: 'Test' },
        });

        const { user } = render(<LoginPage />);
        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'password123',
            });
        });
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/projects');
        });
        expect(localStorage.getItem('accessToken')).toBe('tok');
        expect(localStorage.getItem('refreshToken')).toBe('ref');
    });

    it('shows error message on login failure', async () => {
        mockLogin.mockRejectedValue({
            response: { data: { message: 'Invalid credentials' } },
        });

        const { user } = render(<LoginPage />);
        await user.type(screen.getByLabelText('Email'), 'bad@test.com');
        await user.type(screen.getByLabelText('Password'), 'wrong');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
        });
    });

    it('shows generic error when API returns no message', async () => {
        mockLogin.mockRejectedValue(new Error('Network error'));

        const { user } = render(<LoginPage />);
        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.type(screen.getByLabelText('Password'), 'pass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials. Please try again.');
        });
    });

    it('disables submit button while loading', async () => {
        let resolveLogin: (v: unknown) => void;
        mockLogin.mockReturnValue(new Promise((r) => { resolveLogin = r; }));

        const { user } = render(<LoginPage />);
        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.type(screen.getByLabelText('Password'), 'pass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
        });

        resolveLogin!({
            accessToken: 'tok', refreshToken: 'ref',
            user: { id: 'u1', email: 'test@test.com', name: 'Test' },
        });
    });

    it('requires email field', () => {
        render(<LoginPage />);
        const emailInput = screen.getByLabelText('Email');
        expect(emailInput).toBeRequired();
    });

    it('requires password field', () => {
        render(<LoginPage />);
        const passwordInput = screen.getByLabelText('Password');
        expect(passwordInput).toBeRequired();
    });
});
