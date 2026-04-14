export const PASSWORD_POLICY_HINT = 'Use at least 12 characters with uppercase, lowercase, number, and special character.';

export function getPasswordPolicyError(password: string): string | null {
    if (password.length < 12) {
        return 'Password must be at least 12 characters.';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter.';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }

    if (!/\d/.test(password)) {
        return 'Password must contain at least one number.';
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain at least one special character.';
    }

    return null;
}