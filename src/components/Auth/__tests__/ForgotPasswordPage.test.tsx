import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import ForgotPasswordPage from '@/components/Auth/ForgotPasswordPage';

const mockForgotPassword = vi.fn();
vi.mock('@/services/AuthService', () => ({
    default: { forgotPassword: (...args: unknown[]) => mockForgotPassword(...args) },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
    it('renders the forgot password form', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('shows link back to login', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('submits email and shows success message', async () => {
        mockForgotPassword.mockResolvedValue({});
        const { user } = render(<ForgotPasswordPage />);

        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(mockForgotPassword).toHaveBeenCalledWith('test@test.com');
        });
        await waitFor(() => {
            expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        });
    });

    it('shows error on failure', async () => {
        mockForgotPassword.mockRejectedValue({
            response: { data: { message: 'Too many requests' } },
        });
        const { user } = render(<ForgotPasswordPage />);

        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Too many requests');
        });
    });

    it('requires email field', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByLabelText('Email')).toBeRequired();
    });
});
