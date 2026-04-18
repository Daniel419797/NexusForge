const nextConfig = {
    turbopack: {
        root: frontendRoot,
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    experimental: {
        optimizeCss: true,
        sri: {
            algorithm: "sha256",
        },
    },
    async rewrites() {
        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            '').replace(/\/+$/, '');
        if (!backendUrl) {
            console.warn('[next.config] No backend URL env var set (NEXT_PUBLIC_BACKEND_URL / NEXT_PUBLIC_API_URL / NEXT_PUBLIC_BASE_URL). ' +
                'API rewrites disabled.');
            return [];
        }
        return [
            {
                source: '/api/v1/:path*',
                destination: `${backendUrl}/api/v1/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },
};
export default nextConfig;
