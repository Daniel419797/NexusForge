import { describe, it, expect, vi, afterEach } from 'vitest';
import nextConfig from '../next.config';

type RewriteRule = { source: string; destination: string };
type HeaderEntry = { source: string; headers: { key: string; value: string }[] };

// rewrites() reads process.env at call-time, so vi.stubEnv() is sufficient
// without needing module resets between tests.

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// rewrites()
// ---------------------------------------------------------------------------

describe('next.config rewrites()', () => {
    it('returns an empty array and warns when no backend URL env var is set', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result).toEqual([]);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('No backend URL env var set'),
        );
    });

    it('uses NEXT_PUBLIC_BACKEND_URL when set', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://api.example.com');
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result).toEqual([
            {
                source: '/api/v1/:path*',
                destination: 'https://api.example.com/api/v1/:path*',
            },
        ]);
    });

    it('falls back to NEXT_PUBLIC_API_URL when NEXT_PUBLIC_BACKEND_URL is absent', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api2.example.com');
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result).toEqual([
            {
                source: '/api/v1/:path*',
                destination: 'https://api2.example.com/api/v1/:path*',
            },
        ]);
    });

    it('falls back to NEXT_PUBLIC_BASE_URL when both higher-priority vars are absent', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://base.example.com');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result).toEqual([
            {
                source: '/api/v1/:path*',
                destination: 'https://base.example.com/api/v1/:path*',
            },
        ]);
    });

    it('strips a single trailing slash from the backend URL', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://api.example.com/');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result[0].destination).toBe('https://api.example.com/api/v1/:path*');
    });

    it('strips multiple trailing slashes from the backend URL', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://api.example.com///');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result[0].destination).toBe('https://api.example.com/api/v1/:path*');
    });

    it('NEXT_PUBLIC_BACKEND_URL takes priority over NEXT_PUBLIC_API_URL', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://backend.example.com');
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result[0].destination).toContain('https://backend.example.com');
    });

    it('rewrite source is always /api/v1/:path*', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://api.example.com');

        const result = await (nextConfig.rewrites as () => Promise<RewriteRule[]>)();

        expect(result[0].source).toBe('/api/v1/:path*');
    });
});

// ---------------------------------------------------------------------------
// headers()
// ---------------------------------------------------------------------------

describe('next.config headers()', () => {
    async function getHeaders(): Promise<{ key: string; value: string }[]> {
        const entries = await (nextConfig.headers as () => Promise<HeaderEntry[]>)();
        expect(entries).toHaveLength(1);
        expect(entries[0].source).toBe('/(.*)');
        return entries[0].headers;
    }

    function findHeader(headers: { key: string; value: string }[], key: string) {
        return headers.find((h) => h.key === key);
    }

    it('applies headers to all routes via /(.*)', async () => {
        const entries = await (nextConfig.headers as () => Promise<HeaderEntry[]>)();
        expect(entries[0].source).toBe('/(.*)');
    });

    it('sets X-Frame-Options to DENY', async () => {
        const headers = await getHeaders();
        expect(findHeader(headers, 'X-Frame-Options')?.value).toBe('DENY');
    });

    it('sets X-Content-Type-Options to nosniff', async () => {
        const headers = await getHeaders();
        expect(findHeader(headers, 'X-Content-Type-Options')?.value).toBe('nosniff');
    });

    it('sets Referrer-Policy', async () => {
        const headers = await getHeaders();
        expect(findHeader(headers, 'Referrer-Policy')?.value).toBe(
            'strict-origin-when-cross-origin',
        );
    });

    it('sets Permissions-Policy restricting camera, microphone, and geolocation', async () => {
        const headers = await getHeaders();
        const value = findHeader(headers, 'Permissions-Policy')?.value ?? '';
        expect(value).toContain('camera=()');
        expect(value).toContain('microphone=()');
        expect(value).toContain('geolocation=()');
    });

    it('sets Strict-Transport-Security with long max-age and preload', async () => {
        const headers = await getHeaders();
        const value = findHeader(headers, 'Strict-Transport-Security')?.value ?? '';
        expect(value).toContain('max-age=63072000');
        expect(value).toContain('includeSubDomains');
        expect(value).toContain('preload');
    });

    it('sets frame-ancestors to none in CSP', async () => {
        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain("frame-ancestors 'none'");
    });

    it('includes self in CSP default-src', async () => {
        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain("default-src 'self'");
    });

    it('includes wss: ws: in CSP connect-src for WebSocket support', async () => {
        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain('wss: ws:');
    });

    it('defaults connect-src to localhost:3001 when NEXT_PUBLIC_BASE_URL is not set', async () => {
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');

        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain('http://localhost:3001');
    });

    it('includes NEXT_PUBLIC_BACKEND_URL in CSP connect-src when set', async () => {
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://api.example.com');

        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain('https://api.example.com');
    });

    it('includes NEXT_PUBLIC_BASE_URL in CSP connect-src instead of localhost when set', async () => {
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://myapp.example.com');
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');

        const headers = await getHeaders();
        const csp = findHeader(headers, 'Content-Security-Policy')?.value ?? '';
        expect(csp).toContain('https://myapp.example.com');
        expect(csp).not.toContain('http://localhost:3001');
    });
});
