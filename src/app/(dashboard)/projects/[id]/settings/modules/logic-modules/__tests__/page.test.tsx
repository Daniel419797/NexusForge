import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@/test/test-utils';
import LogicModulesListPage from '../page';

const mocks = vi.hoisted(() => ({
    list: vi.fn(),
    getReadiness: vi.fn(),
    getOpsSummary: vi.fn(),
    archiveDefinition: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useParams: () => ({ id: '11111111-1111-4111-8111-111111111111' }),
}));

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock('@/services/LogicModuleService', () => ({
    default: mocks,
}));

describe('LogicModulesListPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.list.mockResolvedValue([
            {
                id: 'mod-1',
                projectId: '11111111-1111-4111-8111-111111111111',
                moduleKey: 'risk_gate',
                displayName: 'Risk Gate',
                description: 'Routes high-risk orders',
                status: 'active',
                activeVersionId: 'ver-1',
                metadata: {},
                createdAt: '2026-05-11T00:00:00.000Z',
                updatedAt: '2026-05-11T00:00:00.000Z',
            },
            {
                id: 'mod-2',
                projectId: '11111111-1111-4111-8111-111111111111',
                moduleKey: 'draft_flow',
                displayName: 'Draft Flow',
                description: null,
                status: 'draft',
                activeVersionId: null,
                metadata: {},
                createdAt: '2026-05-11T00:00:00.000Z',
                updatedAt: '2026-05-11T00:00:00.000Z',
            },
        ]);
        mocks.getOpsSummary.mockResolvedValue({
            projectId: '11111111-1111-4111-8111-111111111111',
            moduleKey: null,
            windowHours: 24,
            generatedAt: '2026-05-11T00:00:00.000Z',
            modules: { total: 2, active: 1, draft: 1, archived: 0, needingAttention: 1 },
            runs: { total: 8, running: 0, succeeded: 5, failed: 2, deadLettered: 1, retried: 3, p95DurationMs: 42 },
            deadLetters: { total: 1, retryCount: 3 },
            retention: { runRetentionDays: 30, sweepIntervalMinutes: 60 },
            recentFailures: [
                {
                    id: 'run-1',
                    moduleKey: 'risk_gate',
                    status: 'dead_lettered',
                    errorSummary: 'failed',
                    startedAt: '2026-05-11T00:00:00.000Z',
                },
            ],
        });
        mocks.getReadiness.mockResolvedValue({
            projectId: '11111111-1111-4111-8111-111111111111',
            status: 'degraded',
            generatedAt: '2026-05-11T00:00:00.000Z',
            checks: [
                {
                    key: 'recent_failures',
                    label: 'Recent Failures',
                    status: 'warn',
                    message: 'Recent failures need review.',
                },
            ],
            ops: {},
        });
    });

    it('renders operations cards and readiness state', async () => {
        render(<LogicModulesListPage />);

        await waitFor(() => expect(screen.getByText('Risk Gate')).toBeInTheDocument());
        expect(screen.getByText('Dead Letters')).toBeInTheDocument();
        expect(screen.getByText('42ms')).toBeInTheDocument();
        expect(screen.getByText('Release readiness needs attention')).toBeInTheDocument();
        expect(screen.getByText('degraded')).toBeInTheDocument();
    });

    it('filters to modules that need attention', async () => {
        const { user } = render(<LogicModulesListPage />);

        await waitFor(() => expect(screen.getByText('Draft Flow')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /needs attention/i }));

        expect(screen.getByText('Risk Gate')).toBeInTheDocument();
        expect(screen.queryByText('Draft Flow')).not.toBeInTheDocument();
    });
});
