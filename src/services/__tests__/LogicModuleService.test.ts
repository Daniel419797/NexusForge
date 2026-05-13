import { beforeEach, describe, expect, it, vi } from 'vitest';
import LogicModuleService from '@/services/LogicModuleService';

vi.mock('@/services/api', () => {
    const mockGet = vi.fn();
    const mockPost = vi.fn();
    return {
        default: {
            get: mockGet,
            post: mockPost,
        },
    };
});

import api from '@/services/api';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const projectId = '11111111-1111-4111-8111-111111111111';

const opsSummary = {
    projectId,
    moduleKey: null,
    windowHours: 24,
    generatedAt: '2026-05-11T00:00:00.000Z',
    modules: {
        total: 3,
        active: 2,
        draft: 1,
        archived: 0,
        needingAttention: 1,
    },
    runs: {
        total: 10,
        running: 0,
        succeeded: 8,
        failed: 1,
        deadLettered: 1,
        retried: 2,
        p95DurationMs: 321,
    },
    deadLetters: {
        total: 1,
        retryCount: 2,
    },
    retention: {
        runRetentionDays: 30,
        sweepIntervalMinutes: 60,
    },
    recentFailures: [
        {
            id: 'run-1',
            moduleKey: 'risk_gate',
            status: 'dead_lettered',
            errorSummary: 'failed at gate',
            startedAt: '2026-05-11T00:00:00.000Z',
        },
    ],
    brokerReadiness: {
        summary: {
            ready: 1,
            notConfigured: 0,
            failing: 0,
        },
    },
};

describe('LogicModuleService readiness and operations APIs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and maps release readiness', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    projectId,
                    status: 'degraded',
                    generatedAt: '2026-05-11T00:00:00.000Z',
                    checks: [
                        {
                            key: 'recent_failures',
                            label: 'Recent Failures',
                            status: 'warn',
                            message: '1 failed run',
                        },
                    ],
                    ops: opsSummary,
                    triggerBackfill: {
                        mode: 'dry-run',
                        scannedVersions: 3,
                        versionsMissingTriggers: 1,
                        insertedTriggers: 0,
                        skippedInvalidDefinitions: 0,
                    },
                },
            },
        });

        const readiness = await LogicModuleService.getReadiness(projectId);

        expect(mockGet).toHaveBeenCalledWith(`/modules/${projectId}/readiness`);
        expect(readiness.status).toBe('degraded');
        expect(readiness.checks[0]).toMatchObject({ key: 'recent_failures', status: 'warn' });
        expect(readiness.ops.runs.deadLettered).toBe(1);
        expect(readiness.triggerBackfill?.versionsMissingTriggers).toBe(1);
    });

    it('fetches project and module operation summaries', async () => {
        mockGet
            .mockResolvedValueOnce({ data: { data: opsSummary } })
            .mockResolvedValueOnce({ data: { data: { ...opsSummary, moduleKey: 'risk_gate' } } });

        await LogicModuleService.getOpsSummary(projectId, undefined, { windowHours: 12 });
        const moduleSummary = await LogicModuleService.getOpsSummary(projectId, 'risk_gate', { windowHours: 6 });

        expect(mockGet).toHaveBeenNthCalledWith(1, `/modules/${projectId}/ops/summary`, { params: { windowHours: 12 } });
        expect(mockGet).toHaveBeenNthCalledWith(2, `/modules/${projectId}/risk_gate/ops/summary`, { params: { windowHours: 6 } });
        expect(moduleSummary.moduleKey).toBe('risk_gate');
    });

    it('maps dead-lettered runs and retries with recovered input', async () => {
        const runId = '22222222-2222-4222-8222-222222222222';
        mockGet.mockResolvedValueOnce({
            data: {
                data: [
                    {
                        id: runId,
                        status: 'dead_lettered',
                        triggeredBy: 'manual',
                        startedAt: '2026-05-11T00:00:00.000Z',
                        finishedAt: '2026-05-11T00:00:01.000Z',
                    },
                ],
            },
        });
        mockPost.mockResolvedValueOnce({ data: { data: null } });

        const runs = await LogicModuleService.listRuns(projectId, 'risk_gate', { status: 'dead_lettered', limit: 20, offset: 0 });
        await LogicModuleService.retryRun(projectId, 'risk_gate', runId, { orderId: 'ord-1' });

        expect(runs[0].status).toBe('dead_lettered');
        expect(mockPost).toHaveBeenCalledWith(`/modules/${projectId}/risk_gate/runs/${runId}/retry`, {
            input: { orderId: 'ord-1' },
        });
    });
});
