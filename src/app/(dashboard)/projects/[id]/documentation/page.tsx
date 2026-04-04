"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeployStore } from "@/store/deployStore";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";
import {
    Copy,
    Check,
    Terminal,
    Key,
    Shield,
    Zap,
    BookOpen,
    Rocket,
    AlertCircle,
} from "lucide-react";


/* ── Constants ── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ── Module definitions ── */
interface ModuleDef {
    moduleId: string;
    label: string;
    segment: string;
    description: string;
    /** If true, this module is internal and should NOT be shown to end-users */
    internal?: boolean;
    endpoints: EndpointExample[];
}

interface EndpointExample {
    method: string;
    path: string;
    title: string;
    description: string;
    auth: "bearer" | "api-key" | "none";
    body?: Record<string, unknown>;
    responsePreview?: Record<string, unknown>;
}

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
    POST: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    PATCH: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    DELETE: "bg-red-600/20 text-red-400 border-red-600/30",
    PUT: "bg-amber-600/20 text-amber-400 border-amber-600/30",
};

function buildModuleDocs(projectId: string): ModuleDef[] {
    return [
        {
            moduleId: "auth",
            label: "Authentication",
            segment: "auth",
            description: "User registration, login, JWT management, email verification, tenant-owned auth",
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/register`,
                    title: "Register User",
                    description: "Create a new user account. With tenant-owned auth, the user is stored in your project DB. Response includes accessToken, refreshToken, and (for tenant projects) a projectToken.",
                    auth: "none",
                    body: { email: "user@example.com", password: "securePass123!", name: "Jane Doe" },
                    responsePreview: {
                        user: { id: "uuid", email: "user@example.com", name: "Jane Doe", role: "user" },
                        accessToken: "eyJ...",
                        refreshToken: "eyJ...",
                        projectToken: "eyJ... (tenant-owned auth only)",
                    },
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/login`,
                    title: "Login",
                    description: "Authenticate and receive JWT tokens. Access tokens include projectId when using tenant-owned auth. Lockout is project-scoped.",
                    auth: "none",
                    body: { email: "user@example.com", password: "securePass123!" },
                    responsePreview: {
                        user: { id: "uuid", email: "user@example.com", name: "Jane Doe", role: "user" },
                        accessToken: "eyJ...",
                        refreshToken: "eyJ...",
                        projectToken: "eyJ... (tenant-owned auth only)",
                    },
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/auth/me`,
                    title: "Get Current User",
                    description: "Retrieve the authenticated user's profile. Resolves from tenant DB when using tenant-owned auth.",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/refresh`,
                    title: "Refresh Token",
                    description: "Exchange a refresh token for a new access + refresh token pair. Performs rotation with reuse detection — reused tokens revoke the entire family.",
                    auth: "none",
                    body: { refreshToken: "<refresh_token>" },
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/logout`,
                    title: "Logout",
                    description: "Revoke all refresh tokens for the current user. For tenant-owned auth, tokens are revoked in the tenant DB.",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/verify-email`,
                    title: "Verify Email",
                    description: "Verify a user's email address using the token from the registration email. The token is project-scoped and routes to the correct database.",
                    auth: "none",
                    body: { token: "<verification_token>" },
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/auth/resend-verification`,
                    title: "Resend Verification Email",
                    description: "Resend the email verification token. Rate-limited to 3 per minute.",
                    auth: "none",
                    body: { email: "user@example.com" },
                },
            ],
        },
        {
            moduleId: "database",
            label: "Database",
            segment: "db",
            description: "Project data operations and migrations",
            internal: true,
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/db/migrate`,
                    title: "Run Migrations",
                    description: "Execute pending schema migrations on your project database",
                    auth: "bearer",
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/db/config/db-url`,
                    title: "Get Database URL",
                    description: "Retrieve the decrypted database connection string",
                    auth: "bearer",
                },
            ],
        },
        {
            moduleId: "chat",
            label: "Chat & Messaging",
            segment: "channels",
            description: "Rooms, messages, real-time chat",
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/channels`,
                    title: "Create Channel",
                    description: "Create a new chat room / channel",
                    auth: "bearer",
                    body: { name: "general", type: "public" },
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/channels`,
                    title: "List Channels",
                    description: "List all channels the user has access to",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/channels/:roomId/messages`,
                    title: "Send Message",
                    description: "Send a message to a channel",
                    auth: "bearer",
                    body: { content: "Hello, world!", type: "text" },
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/channels/:roomId/messages`,
                    title: "List Messages",
                    description: "Retrieve paginated messages from a channel",
                    auth: "bearer",
                },
            ],
        },
        {
            moduleId: "notifications",
            label: "Notifications",
            segment: "notifications",
            description: "Push notifications and in-app alerts",
            endpoints: [
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/notifications`,
                    title: "List Notifications",
                    description: "Get the user's notification feed",
                    auth: "bearer",
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/notifications/unread-count`,
                    title: "Unread Count",
                    description: "Get the number of unread notifications",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/notifications/devices`,
                    title: "Register Device",
                    description: "Register a push notification device token (FCM/APNs)",
                    auth: "bearer",
                    body: { token: "<fcm_token>", platform: "android" },
                },
            ],
        },
        {
            moduleId: "ai",
            label: "AI",
            segment: "ai",
            description: "Text generation, chat, and analysis",
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/ai/generate`,
                    title: "Generate Text",
                    description: "Single-turn text generation",
                    auth: "bearer",
                    body: { prompt: "Summarize this article...", maxTokens: 500 },
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/ai/chat`,
                    title: "Chat Completion",
                    description: "Multi-turn chat with AI",
                    auth: "bearer",
                    body: {
                        messages: [
                            { role: "user", content: "What is NexusForge?" },
                        ],
                    },
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/ai/analyze`,
                    title: "Content Analysis",
                    description: "Analyze text for sentiment, topics, etc.",
                    auth: "bearer",
                    body: { text: "This product is amazing!", analysisType: "sentiment" },
                },
            ],
        },
        {
            moduleId: "blockchain",
            label: "Blockchain",
            segment: "blockchain",
            description: "Wallets, transactions, NFTs",
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/blockchain/wallets`,
                    title: "Link Wallet",
                    description: "Link a blockchain wallet to the user's account",
                    auth: "bearer",
                    body: { address: "0x...", chain: "ethereum" },
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/blockchain/wallets`,
                    title: "List Wallets",
                    description: "List all linked wallets",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/blockchain/transactions`,
                    title: "Record Transaction",
                    description: "Record a blockchain transaction",
                    auth: "bearer",
                    body: { txHash: "0x...", chain: "ethereum", amount: "1.5" },
                },
            ],
        },
        {
            moduleId: "plugins",
            label: "Plugins",
            segment: "plugins",
            description: "Browse, install, and configure plugins",
            internal: true,
            endpoints: [
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/plugins/available`,
                    title: "Browse Marketplace",
                    description: "List all available plugins in the marketplace",
                    auth: "bearer",
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/plugins/installed`,
                    title: "List Installed",
                    description: "List plugins installed for this project",
                    auth: "bearer",
                },
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/plugins/install`,
                    title: "Install Plugin",
                    description: "Install a plugin from the marketplace",
                    auth: "bearer",
                    body: { name: "wallet-connect" },
                },
            ],
        },
        {
            moduleId: "api-keys",
            label: "API Keys",
            segment: "keys",
            description: "Create and manage API keys for your app",
            internal: true,
            endpoints: [
                {
                    method: "POST",
                    path: `/api/v1/p/${projectId}/keys`,
                    title: "Create API Key",
                    description: "Generate a new publishable (pk_) or secret (sk_) API key",
                    auth: "bearer",
                    body: { name: "Mobile App Key", type: "publishable" },
                },
                {
                    method: "GET",
                    path: `/api/v1/p/${projectId}/keys`,
                    title: "List API Keys",
                    description: "List all active API keys for the project",
                    auth: "bearer",
                },
            ],
        },
    ];
}

/* ── Code generator helpers ── */

/**
 * Resolve the full URL for a code example.
 * - If gatewayBase is a subdomain URL (e.g. https://my-app-69e93f31.reuse.app),
 *   strip the /api/v1/p/:uuid prefix from the path so the example uses the
 *   cleaner subdomain form: https://my-app-69e93f31.reuse.app/auth/register
 * - Otherwise fall back to the original long-form URL.
 */
function resolveExampleUrl(endpoint: EndpointExample, apiBase: string, gatewayBase: string): string {
    // Check if gatewayBase is already a subdomain URL (doesn't end with /p/<uuid>)
    const uuidInPath = /\/api\/v1\/p\/[0-9a-f-]{36}$/.exec(gatewayBase);
    if (!uuidInPath) {
        // Subdomain or custom URL — strip the uuid prefix from the endpoint path
        const strippedPath = endpoint.path.replace(/^\/api\/v1\/p\/[0-9a-f-]{36}/, '');
        return `${gatewayBase}${strippedPath}`;
    }
    return `${apiBase}${endpoint.path}`;
}

function curlExample(endpoint: EndpointExample, apiBase: string, token: string, gatewayBase: string): string {
    const url = resolveExampleUrl(endpoint, apiBase, gatewayBase);
    let cmd = `curl -X ${endpoint.method} "${url}"`;

    if (endpoint.auth === "bearer") {
        cmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
    } else if (endpoint.auth === "api-key") {
        cmd += ` \\\n  -H "x-api-key: sk_your_secret_key"`;
    }

    if (endpoint.body) {
        cmd += ` \\\n  -H "Content-Type: application/json"`;
        cmd += ` \\\n  -d '${JSON.stringify(endpoint.body, null, 2)}'`;
    }

    return cmd;
}

function jsExample(endpoint: EndpointExample, apiBase: string, token: string, gatewayBase: string): string {
    const url = resolveExampleUrl(endpoint, apiBase, gatewayBase);
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (endpoint.auth === "bearer") headers["Authorization"] = `Bearer ${token}`;
    if (endpoint.auth === "api-key") headers["x-api-key"] = "sk_your_secret_key";

    let code = `const response = await fetch("${url}", {\n  method: "${endpoint.method}",\n  headers: ${JSON.stringify(headers, null, 4)},`;

    if (endpoint.body) {
        code += `\n  body: JSON.stringify(${JSON.stringify(endpoint.body, null, 4)}),`;
    }

    code += `\n});\nconst data = await response.json();\nconsole.log(data);`;
    return code;
}

function pythonExample(endpoint: EndpointExample, apiBase: string, token: string, gatewayBase: string): string {
    const url = resolveExampleUrl(endpoint, apiBase, gatewayBase);
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (endpoint.auth === "bearer") headers["Authorization"] = `Bearer ${token}`;
    if (endpoint.auth === "api-key") headers["x-api-key"] = "sk_your_secret_key";

    let code = `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${url}",\n    headers=${JSON.stringify(headers).replaceAll('"', "'")},`;

    if (endpoint.body) {
        code += `\n    json=${JSON.stringify(endpoint.body).replaceAll('"', "'")},`;
    }

    code += `\n)\nprint(response.json())`;
    return code;
}

/* ── Copy button component ── */

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            title="Copy to clipboard"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

/* ── Main page ── */

export default function DocumentationPage() {
    const params = useParams();
    const projectId = typeof params.id === "string" ? params.id : "";
    const project = useProjectStore((s) => s.activeProject);
    const { currentDeployment, fetchCurrentDeployment } = useDeployStore();
    const [projectToken, setProjectToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState<"curl" | "js" | "python">("curl");
    const [expandedModule, setExpandedModule] = useState<string | null>("auth");

    // Fetch current deployment
    useEffect(() => {
        if (projectId) fetchCurrentDeployment(projectId);
    }, [projectId, fetchCurrentDeployment]);

    // Build module docs — filter out internal modules
    const allModules = useMemo(() => buildModuleDocs(projectId), [projectId]);
    const publicModules = useMemo(() => allModules.filter((m) => !m.internal), [allModules]);

    const enabledModuleIds = useMemo(() => {
        const dep = currentDeployment?.deployment;
        if (!dep) return new Set<string>();
        const modules = new Set(dep.enabledModules || []);
        // Always show auth
        modules.add("auth");
        return modules;
    }, [currentDeployment]);

    const enabledModules = useMemo(
        () => publicModules.filter((m) => enabledModuleIds.has(m.moduleId)),
        [publicModules, enabledModuleIds],
    );

    const apiBase = API_BASE;
    const gatewayBase = project?.apiUrl || ``;
    const tokenDisplay = projectToken || "YOUR_PROJECT_TOKEN";

    const handleGetToken = useCallback(async () => {
        setTokenLoading(true);
        try {
            const result = await ProjectService.getProjectToken(projectId);
            setProjectToken(result.token);
        } catch {
            // Silent fail — token generation might not be available
        } finally {
            setTokenLoading(false);
        }
    }, [projectId]);

    const isDeployed = currentDeployment?.deployment?.status === "live";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Documentation
                </h1>
                <p className="text-sm text-white/40 mt-1">
                    Everything you need to integrate {project?.name || "your project"}&apos;s backend into your app.
                </p>
            </motion.div>

            {/* Deployment status banner */}
            {!isDeployed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
                >
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-300">Project not deployed yet</p>
                            <p className="text-xs text-amber-300/60 mt-0.5">
                                Deploy your project first to enable the API gateway. Go to the Deploy page to get started.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 1: API Base URL */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-white/90">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            1. Your API Base URL
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-white/40 mb-3">
                            All your project&apos;s API requests go through this gateway URL. Every module is accessible as a sub-path.
                        </p>
                        <div className="relative">
                            <code className="block p-3 rounded-lg bg-black/30 border border-white/[0.08] text-sm font-mono text-cyan-400 break-all">
                                {gatewayBase}
                            </code>
                            <CopyBtn text={gatewayBase} />
                        </div>
                        <p className="text-[11px] text-white/25 mt-2">
                            Module endpoints: <code className="text-white/35">{gatewayBase}/auth</code>,{" "}
                            <code className="text-white/35">{gatewayBase}/channels</code>,{" "}
                            <code className="text-white/35">{gatewayBase}/ai</code>, etc.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Step 2: Authentication */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-white/90">
                            <Shield className="w-4 h-4 text-white/50" />
                            2. Authentication
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-white/40">
                            Your app authenticates to the gateway using either a <strong className="text-white/60">project-scoped JWT</strong> or an <strong className="text-white/60">API key</strong>.
                        </p>

                        {/* Two auth methods */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.01]">
                                <h4 className="text-xs font-semibold text-white/70 mb-1 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5" /> JWT Token
                                </h4>
                                <p className="text-[11px] text-white/35 mb-2">
                                    Best for server-to-server. Pass in the Authorization header.
                                </p>
                                <div className="relative">
                                    <code className="block p-2 rounded-lg bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/50 break-all">
                                        Authorization: Bearer {tokenDisplay.length > 30 ? tokenDisplay.slice(0, 30) + "..." : tokenDisplay}
                                    </code>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 text-[10px] h-7 border-white/10 text-white/50"
                                    onClick={handleGetToken}
                                    disabled={tokenLoading}
                                >
                                    {tokenLoading ? "Generating..." : projectToken ? "Regenerate Token" : "Generate Project Token"}
                                </Button>
                                {projectToken && (
                                    <div className="mt-2 relative">
                                        <code className="block p-2 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-mono text-primary break-all">
                                            {projectToken}
                                        </code>
                                        <CopyBtn text={projectToken} />
                                    </div>
                                )}
                            </div>

                            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.01]">
                                <h4 className="text-xs font-semibold text-white/70 mb-1 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5" /> API Key
                                </h4>
                                <p className="text-[11px] text-white/35 mb-2">
                                    Best for client-side apps. Create keys in the API Keys page.
                                </p>
                                <div className="relative">
                                    <code className="block p-2 rounded-lg bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/50 break-all">
                                        x-api-key: pk_xxxxxxxxxxxx
                                    </code>
                                </div>
                                <p className="text-[10px] text-white/25 mt-2">
                                    <strong className="text-white/40">pk_</strong> = publishable (read-only, safe for client-side) <br />
                                    <strong className="text-white/40">sk_</strong> = secret (full access, server-side only)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Step 3: Available modules/endpoints */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2 text-white/90">
                                <BookOpen className="w-4 h-4 text-emerald-400" />
                                3. Your API Endpoints
                            </CardTitle>
                            {/* Language selector */}
                            <div className="flex items-center gap-1">
                                {(["curl", "js", "python"] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLang(lang)}
                                        className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${selectedLang === lang
                                                ? "bg-primary/15 text-primary border border-primary/25"
                                                : "text-white/30 hover:text-white/50 border border-transparent"
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-xs text-white/40 mb-3">
                            {isDeployed
                                ? `${enabledModules.length} module(s) enabled. Click any module to see request examples.`
                                : "Deploy your project to see which modules are enabled."
                            }
                        </p>

                        {enabledModules.length === 0 && !isDeployed && (
                            <div className="py-8 text-center text-white/20 text-sm">
                                No active deployment found. Deploy your project first.
                            </div>
                        )}

                        {(isDeployed ? enabledModules : publicModules).map((mod) => (
                            <ModuleSection
                                key={mod.moduleId}
                                module={mod}
                                apiBase={apiBase}
                                gatewayBase={gatewayBase}
                                token={tokenDisplay}
                                selectedLang={selectedLang}
                                isExpanded={expandedModule === mod.moduleId}
                                onToggle={() =>
                                    setExpandedModule(expandedModule === mod.moduleId ? null : mod.moduleId)
                                }
                                isEnabled={enabledModuleIds.has(mod.moduleId)}
                            />
                        ))}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Step 4: Quick Start snippet */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-white/90">
                            <Rocket className="w-4 h-4 text-amber-400" />
                            4. Quick Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-white/40 mb-3">
                            Copy this complete example to register a user and make your first authenticated request.
                        </p>
                        <QuickStartSnippet
                            projectId={projectId}
                            apiBase={apiBase}
                            lang={selectedLang}
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Discovery endpoint */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-white/90">
                            <Terminal className="w-4 h-4 text-white/50" />
                            Discovery Endpoint
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-white/40 mb-3">
                            Hit your gateway base URL to see all available modules and their base URLs dynamically:
                        </p>
                        <div className="relative">
                            <pre className="p-3 rounded-lg bg-black/30 border border-white/[0.08] text-[11px] font-mono text-white/50 overflow-x-auto">
                                {`curl ${gatewayBase}

# Response:
{
  "success": true,
  "data": {
    "projectId": "${projectId}",
    "apiBase": "/api/v1/p/${projectId}",
    "modules": [
      { "module": "auth", "baseUrl": "/api/v1/p/${projectId}/auth", ... },
      { "module": "chat", "baseUrl": "/api/v1/p/${projectId}/channels", ... },
      ...
    ]
  }
}`}
                            </pre>
                            <CopyBtn text={`curl ${gatewayBase}`} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Module Section Component
   ═══════════════════════════════════════════════════════════════════════════ */

function ModuleSection({
    module: mod,
    apiBase,
    gatewayBase,
    token,
    selectedLang,
    isExpanded,
    onToggle,
    isEnabled,
}: {
    module: ModuleDef;
    apiBase: string;
    gatewayBase: string;
    token: string;
    selectedLang: "curl" | "js" | "python";
    isExpanded: boolean;
    onToggle: () => void;
    isEnabled: boolean;
}) {
    return (
        <div className={`rounded-xl border transition-all ${isEnabled ? "border-white/[0.08]" : "border-white/[0.04] opacity-50"}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors rounded-xl"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">{mod.label}</span>
                    <Badge
                        variant="outline"
                        className="text-[9px] border-white/10 text-white/30"
                    >
                        /{mod.segment}
                    </Badge>
                    {!isEnabled && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-400/60">
                            not enabled
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">
                        {mod.endpoints.length} endpoint{mod.endpoints.length !== 1 ? "s" : ""}
                    </span>
                    <svg aria-hidden="true" className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                    <p className="text-[11px] text-white/30">{mod.description}</p>
                    {mod.endpoints.map((ep, i) => (
                        <EndpointCard key={i} endpoint={ep} apiBase={apiBase} gatewayBase={gatewayBase} token={token} lang={selectedLang} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Endpoint Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function EndpointCard({
    endpoint,
    apiBase,
    gatewayBase,
    token,
    lang,
}: {
    endpoint: EndpointExample;
    apiBase: string;
    gatewayBase: string;
    token: string;
    lang: "curl" | "js" | "python";
}) {
    const [showCode, setShowCode] = useState(false);

    const codeSnippet = useMemo(() => {
        switch (lang) {
            case "curl":
                return curlExample(endpoint, apiBase, token, gatewayBase);
            case "js":
                return jsExample(endpoint, apiBase, token, gatewayBase);
            case "python":
                return pythonExample(endpoint, apiBase, token, gatewayBase);
        }
    }, [endpoint, apiBase, token, lang]);

    return (
        <div className="rounded-lg border border-white/[0.05] bg-black/10 overflow-hidden">
            <button
                onClick={() => setShowCode(!showCode)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/[0.02] transition-colors"
            >
                <Badge className={`text-[9px] px-1.5 py-0 font-mono ${METHOD_COLORS[endpoint.method] || ""}`}>
                    {endpoint.method}
                </Badge>
                <code className="text-[11px] font-mono text-white/50 flex-1 truncate">
                    {endpoint.path}
                </code>
                <span className="text-[10px] text-white/25 shrink-0">{endpoint.title}</span>
            </button>

            {showCode && (
                <div className="border-t border-white/[0.04] p-2.5 space-y-2">
                    <p className="text-[10px] text-white/30">{endpoint.description}</p>
                    {endpoint.auth !== "none" && (
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-white/20" />
                            <span className="text-[10px] text-white/25">
                                Requires: {endpoint.auth === "bearer" ? "Bearer Token or API Key" : "API Key"}
                            </span>
                        </div>
                    )}
                    <div className="relative">
                        <pre className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/50 overflow-x-auto whitespace-pre-wrap">
                            {codeSnippet}
                        </pre>
                        <CopyBtn text={codeSnippet} />
                    </div>
                    {endpoint.responsePreview && (
                        <div>
                            <p className="text-[10px] text-white/25 mb-1">Response shape:</p>
                            <pre className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-mono text-emerald-300/60 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(endpoint.responsePreview, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Quick Start Snippet
   ═══════════════════════════════════════════════════════════════════════════ */

function QuickStartSnippet({
    projectId,
    apiBase,
    lang,
}: {
    projectId: string;
    apiBase: string;
    lang: "curl" | "js" | "python";
}) {
    const gateway = `${apiBase}/api/v1/p/${projectId}`;

    const snippets: Record<string, string> = {
        curl: `# 1. Register a user
curl -X POST "${gateway}/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "securePass123!", "name": "Jane Doe"}'

# Response: { accessToken, refreshToken, user, projectToken? }

# 2. Login and get a token
TOKEN=$(curl -s -X POST "${gateway}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "securePass123!"}' | jq -r '.data.accessToken')

# 3. Use the token to call protected endpoints
curl "${gateway}/auth/me" \\
  -H "Authorization: Bearer $TOKEN"

# 4. Refresh tokens (automatic rotation with reuse detection)
curl -X POST "${gateway}/auth/refresh" \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken": "<your_refresh_token>"}'

# 5. Logout (revokes all refresh tokens for this user)
curl -X POST "${gateway}/auth/logout" \\
  -H "Authorization: Bearer $TOKEN"`,

        js: `// 1. Register a user
const registerRes = await fetch("${gateway}/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        email: "user@example.com",
        password: "securePass123!",
        name: "Jane Doe",
    }),
});
const { data: registerData } = await registerRes.json();
// registerData: { accessToken, refreshToken, user, projectToken? }

// 2. Login and get a token
const loginRes = await fetch("${gateway}/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        email: "user@example.com",
        password: "securePass123!",
    }),
});
const { data: loginData } = await loginRes.json();
const token = loginData.accessToken;

// 3. Use the token to call protected endpoints
const meRes = await fetch("${gateway}/auth/me", {
    headers: { "Authorization": \`Bearer \${token}\` },
});
const me = await meRes.json();
console.log("Current user:", me.data);

// 4. Refresh tokens (rotate automatically)
const refreshRes = await fetch("${gateway}/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: loginData.refreshToken }),
});
const { data: newTokens } = await refreshRes.json();

// 5. Logout
await fetch("${gateway}/auth/logout", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${token}\` },
});`,

        python: `import requests

BASE = "${gateway}"

# 1. Register a user
register = requests.post(f"{BASE}/auth/register", json={
    "email": "user@example.com",
    "password": "securePass123!",
    "name": "Jane Doe",
})
print("Registered:", register.json())
# response: { accessToken, refreshToken, user, projectToken? }

# 2. Login and get a token
login = requests.post(f"{BASE}/auth/login", json={
    "email": "user@example.com",
    "password": "securePass123!",
})
token = login.json()["data"]["accessToken"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Use the token to call protected endpoints
me = requests.get(f"{BASE}/auth/me", headers=headers)
print("Current user:", me.json()["data"])

# 4. Refresh tokens
refresh = requests.post(f"{BASE}/auth/refresh", json={
    "refreshToken": login.json()["data"]["refreshToken"],
})
print("New tokens:", refresh.json()["data"])

# 5. Logout (revokes all sessions)
requests.post(f"{BASE}/auth/logout", headers=headers)
print("Logged out")`,
    };

    const code = snippets[lang] || snippets.curl;

    return (
        <div className="relative">
            <pre className="p-3 rounded-lg bg-black/30 border border-white/[0.08] text-[11px] font-mono text-white/50 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {code}
            </pre>
            <CopyBtn text={code} />
        </div>
    );
}
