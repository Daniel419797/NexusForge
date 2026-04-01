import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render that wraps UI in providers and returns user-event instance.
 * Extend AllTheProviders if you add context providers (e.g. QueryClient).
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) {
    return {
        user: userEvent.setup(),
        ...render(ui, { wrapper: AllTheProviders, ...options }),
    };
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };
