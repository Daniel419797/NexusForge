"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeployStore } from "@/store/deployStore";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";
import TableService, { type CustomTable } from "@/services/TableService";
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

type LangOption = "curl" | "js" | "python";

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

function CopyBtn({ text }: Readonly<{ text: string }>) {
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
    const { currentDeployment, fetchCurrentDeployment, isLoadingCurrentDeployment } = useDeployStore();
    const [projectToken, setProjectToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState<LangOption>("curl");
    const [expandedModule, setExpandedModule] = useState<string | null>("auth");
    const [customTables, setCustomTables] = useState<CustomTable[]>([]);
    const [tablesLoading, setTablesLoading] = useState(false);

    // Fetch current deployment
    useEffect(() => {
        if (projectId) fetchCurrentDeployment(projectId);
    }, [projectId, fetchCurrentDeployment]);

    // Fetch custom tables
    useEffect(() => {
        if (!projectId) return;
        setTablesLoading(true);
        TableService.listTables(projectId)
            .then(setCustomTables)
            .catch(() => {})
            .finally(() => setTablesLoading(false));
    }, [projectId]);

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
    const gatewayBase = currentDeployment?.deployment?.apiUrl || ``;
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
    const tokenActionLabel = projectToken ? "Regenerate Token" : "Generate Project Token";
    const generateTokenLabel = tokenLoading ? "Generating..." : tokenActionLabel;

    return (
        <div className="flex flex-col max-w-4xl mx-auto divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="flex items-start gap-3 pb-6">
                <div className="shrink-0 mt-1.5 w-[3px] self-stretch rounded-full" style={{ background: "rgba(129,236,255,0.45)" }} />
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/90">Documentation</h1>
                    <p className="text-sm text-white/35 mt-0.5">
                        Everything you need to integrate {project?.name || "your project"}&apos;s backend into your app.
                    </p>
                </div>
            </div>

            {/* Deployment status banner */}
            {!isLoadingCurrentDeployment && !isDeployed && (
                <div className="py-4">
                    <div className="flex items-start gap-3 p-3.5 rounded-md border border-amber-500/15 bg-amber-500/5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-300/80">Project not deployed yet</p>
                            <p className="text-xs text-amber-300/40 mt-0.5">
                                Deploy your project first to enable the API gateway. Go to the Deploy page to get started.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: API Base URL */}
            <div className="py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-[#81ecff]/50" />
                    <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Step 1 · API Base URL</span>
                </div>
                <p className="text-xs text-white/35 mb-3">
                    All your project&apos;s API requests go through this gateway URL. Every module is accessible as a sub-path.
                </p>
                <div className="relative">
                    <code className="block p-3 rounded-md bg-white/[0.02] border border-white/[0.04] text-sm font-mono text-[#81ecff]/70 break-all">
                        {gatewayBase}
                    </code>
                    <CopyBtn text={gatewayBase} />
                </div>
                <p className="text-[11px] text-white/20 mt-2">
                    Module endpoints:{" "}
                    <code className="text-white/30">{gatewayBase}/auth</code>,{" "}
                    <code className="text-white/30">{gatewayBase}/channels</code>,{" "}
                    <code className="text-white/30">{gatewayBase}/ai</code>, etc.
                </p>
            </div>

            {/* Step 2: Authentication */}
            <div className="py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Step 2 · Authentication</span>
                </div>
                <p className="text-xs text-white/35 mb-4">
                    Your app authenticates to the gateway using either a{" "}
                    <strong className="text-white/55">project-scoped JWT</strong> or an{" "}
                    <strong className="text-white/55">API key</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 p-3.5 border border-white/[0.06] rounded-md bg-white/[0.01]">
                        <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-xs font-semibold text-white/60">JWT Token</span>
                        </div>
                        <p className="text-[11px] text-white/30">Best for server-to-server. Pass in the Authorization header.</p>
                        <div className="relative">
                            <code className="block p-2 rounded-md bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/40 break-all">
                                Authorization: Bearer {tokenDisplay.length > 30 ? tokenDisplay.slice(0, 30) + "..." : tokenDisplay}
                            </code>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 text-[10px] h-7 border-white/10 text-white/40 hover:text-white/60 w-fit"
                            onClick={handleGetToken}
                            disabled={tokenLoading}
                        >
                            {generateTokenLabel}
                        </Button>
                        {projectToken && (
                            <div className="relative">
                                <code className="block p-2 rounded-md bg-[#81ecff]/5 border border-[#81ecff]/15 text-[10px] font-mono text-[#81ecff]/60 break-all">
                                    {projectToken}
                                </code>
                                <CopyBtn text={projectToken} />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 p-3.5 border border-white/[0.06] rounded-md bg-white/[0.01]">
                        <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-xs font-semibold text-white/60">API Key</span>
                        </div>
                        <p className="text-[11px] text-white/30">Best for client-side apps. Create keys in the API Keys page.</p>
                        <div className="relative">
                            <code className="block p-2 rounded-md bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/40 break-all">
                                x-api-key: pk_xxxxxxxxxxxx
                            </code>
                        </div>
                        <p className="text-[10px] text-white/20 mt-1">
                            <strong className="text-white/35">pk_</strong> = publishable (read-only, safe for client-side)<br />
                            <strong className="text-white/35">sk_</strong> = secret (full access, server-side only)
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 3: Available modules/endpoints */}
            <div className="py-6">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400/60" />
                        <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Step 3 · API Endpoints</span>
                    </div>
                    {/* Language selector */}
                    <div className="flex items-center gap-1">
                        {(["curl", "js", "python"] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setSelectedLang(lang)}
                                className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${selectedLang === lang
                                    ? "bg-[#81ecff]/10 text-[#81ecff]/70 border border-[#81ecff]/20"
                                    : "text-white/25 hover:text-white/45 border border-transparent"
                                }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-white/30 mb-4">
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

                <div className="divide-y divide-white/[0.04]">
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
                </div>
            </div>

            {/* Step 4: Quick Start snippet */}
            <div className="py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Rocket className="w-3.5 h-3.5 text-amber-400/60" />
                    <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Step 4 · Quick Start</span>
                </div>
                <p className="text-xs text-white/35 mb-3">
                    Copy this complete example to register a user and make your first authenticated request.
                </p>
                <QuickStartSnippet
                    projectId={projectId}
                    apiBase={apiBase}
                    gatewayBase={gatewayBase}
                    lang={selectedLang}
                />
            </div>

            {/* Discovery endpoint */}
            <div className="py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Discovery Endpoint</span>
                </div>
                <p className="text-xs text-white/35 mb-3">
                    Hit your gateway base URL to see all available modules and their base URLs dynamically:
                </p>
                <div className="relative">
                    <pre className="p-3 rounded-md bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-white/40 overflow-x-auto">
                        {`curl ${gatewayBase}

# Response:
{
  "success": true,
  "data": {
    "projectId": "${projectId}",
    "apiBase": "${gatewayBase}",
    "modules": [
      { "module": "auth", "baseUrl": "${gatewayBase}/auth", ... },
      { "module": "chat", "baseUrl": "${gatewayBase}/channels", ... },
      ...
    ]
  }
}`}
                    </pre>
                    <CopyBtn text={`curl ${gatewayBase}`} />
                </div>
            </div>

            {/* Custom Tables */}
            {(tablesLoading || customTables.length > 0) && (
                <div className="py-6">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400/60" />
                        <span className="text-[11px] uppercase tracking-wider text-white/25 font-mono">Custom Table APIs</span>
                    </div>
                    <p className="text-xs text-white/30 mb-4">
                        Each custom table you defined gets full CRUD endpoints at{" "}
                        <code className="text-white/45">{gatewayBase}/table/&#123;tableName&#125;</code>. Only migrated tables are active.
                    </p>

                    {tablesLoading ? (
                        <div className="py-4 text-center text-white/20 text-xs">Loading tables…</div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {customTables.map((table) => (
                                <CustomTableSection
                                    key={table.id}
                                    table={table}
                                    gatewayBase={gatewayBase}
                                    lang={selectedLang}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
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
}: Readonly<{
    module: ModuleDef;
    apiBase: string;
    gatewayBase: string;
    token: string;
    selectedLang: LangOption;
    isExpanded: boolean;
    onToggle: () => void;
    isEnabled: boolean;
}>) {
    return (
        <div className={`rounded-xl border transition-all ${isEnabled ? "border-white/[0.08]" : "border-white/[0.04] opacity-50"}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors rounded-xl"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">{mod.label}</span>
                    <span className="text-[9px] font-mono text-white/25 border border-white/[0.06] px-1.5 py-0.5 rounded">
                        /{mod.segment}
                    </span>
                    {isEnabled ? null : (
                        <span className="text-[9px] font-mono border border-amber-500/15 text-amber-400/50 px-1.5 py-0.5 rounded">
                            not enabled
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">
                        {mod.endpoints.length} endpoint{mod.endpoints.length === 1 ? "" : "s"}
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
                    {mod.endpoints.map((ep) => (
                        <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} apiBase={apiBase} gatewayBase={gatewayBase} token={token} lang={selectedLang} />
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
}: Readonly<{
    endpoint: EndpointExample;
    apiBase: string;
    gatewayBase: string;
    token: string;
    lang: LangOption;
}>) {
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
                <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 font-mono rounded border ${METHOD_COLORS[endpoint.method] || ""}`}>
                    {endpoint.method}
                </span>
                <code className="text-[11px] font-mono text-white/50 flex-1 truncate">
                    {resolveExampleUrl(endpoint, apiBase, gatewayBase)}
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
    gatewayBase,
    lang,
}: Readonly<{
    projectId: string;
    apiBase: string;
    gatewayBase: string;
    lang: LangOption;
}>) {
    const gateway = gatewayBase;

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

/* ═══════════════════════════════════════════════════════════════════════════
   Custom Table Section
   ═══════════════════════════════════════════════════════════════════════════ */

type FieldValueExample = string | number | boolean | null;

function fieldExample(type: string): FieldValueExample {
    switch (type) {
        case "number": return 0;
        case "boolean": return true;
        case "date": return new Date().toISOString();
        case "array": return "[]" as unknown as null;
        case "object": return "{}" as unknown as null;
        default: return "string_value";
    }
}

function buildBodyExample(fields: CustomTable["fields"]): Record<string, FieldValueExample> {
    const obj: Record<string, FieldValueExample> = {};
    for (const f of fields) {
        obj[f.name] = fieldExample(f.type);
    }
    return obj;
}

function buildTableSnippets(
    table: CustomTable,
    gatewayBase: string,
    lang: LangOption,
): { list: string; create: string; update: string; remove: string } {
    const base = `${gatewayBase}/table/${table.name}`;
    const body = buildBodyExample(table.fields);
    const bodyStr = JSON.stringify(body, null, 2);

    if (lang === "curl") {
        return {
            list: `curl "${base}?limit=20&offset=0" \\\n  -H "Authorization: Bearer YOUR_TOKEN"`,
            create: `curl -X POST "${base}" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`,
            update: `curl -X PATCH "${base}/ROW_ID" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`,
            remove: `curl -X DELETE "${base}/ROW_ID" \\\n  -H "Authorization: Bearer YOUR_TOKEN"`,
        };
    }

    if (lang === "js") {
        const headers = `{ "Authorization": "Bearer YOUR_TOKEN", "Content-Type": "application/json" }`;
        return {
            list: `const res = await fetch("${base}?limit=20&offset=0", {\n  headers: { "Authorization": "Bearer YOUR_TOKEN" },\n});\nconst { data } = await res.json();\n// data: { rows: [...], total: number }`,
            create: `const res = await fetch("${base}", {\n  method: "POST",\n  headers: ${headers},\n  body: JSON.stringify(${bodyStr}),\n});\nconst { data } = await res.json();`,
            update: `const res = await fetch(\`${base}/\${rowId}\`, {\n  method: "PATCH",\n  headers: ${headers},\n  body: JSON.stringify(${bodyStr}),\n});\nconst { data } = await res.json();`,
            remove: `const res = await fetch(\`${base}/\${rowId}\`, {\n  method: "DELETE",\n  headers: { "Authorization": "Bearer YOUR_TOKEN" },\n});\nconst { data } = await res.json();`,
        };
    }

    // python
    const headersStr = `{"Authorization": "Bearer YOUR_TOKEN", "Content-Type": "application/json"}`;
    return {
        list: `import requests\nres = requests.get("${base}", params={"limit": 20, "offset": 0},\n    headers={"Authorization": "Bearer YOUR_TOKEN"})\nprint(res.json())`,
        create: `import requests\nres = requests.post("${base}",\n    headers=${headersStr},\n    json=${JSON.stringify(body).replaceAll('"', "'")})\nprint(res.json())`,
        update: `import requests\nres = requests.patch(f"${base}/ROW_ID",\n    headers=${headersStr},\n    json=${JSON.stringify(body).replaceAll('"', "'")})\nprint(res.json())`,
        remove: `import requests\nres = requests.delete(f"${base}/ROW_ID",\n    headers={"Authorization": "Bearer YOUR_TOKEN"})\nprint(res.json())`,
    };
}

const TABLE_ENDPOINT_META = [
    { key: "list" as const, method: "GET", label: "List rows", pathSuffix: "" },
    { key: "create" as const, method: "POST", label: "Insert row", pathSuffix: "" },
    { key: "update" as const, method: "PATCH", label: "Update row", pathSuffix: "/:rowId" },
    { key: "remove" as const, method: "DELETE", label: "Delete row", pathSuffix: "/:rowId" },
];

function CustomTableSection({
    table,
    gatewayBase,
    lang,
}: Readonly<{
    table: CustomTable;
    gatewayBase: string;
    lang: LangOption;
}>) {
    const [expanded, setExpanded] = useState(false);
    const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);

    const snippets = useMemo(
        () => buildTableSnippets(table, gatewayBase, lang),
        [table, gatewayBase, lang],
    );

    const base = `${gatewayBase}/table/${table.name}`;

    return (
        <div className={`rounded-xl border transition-all ${table.migratedAt ? "border-white/[0.08]" : "border-white/[0.04] opacity-50"}`}>
            <button
                onClick={() => setExpanded((x) => !x)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors rounded-xl"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">{table.displayName}</span>
                    <span className="text-[9px] font-mono text-white/25 border border-white/[0.06] px-1.5 py-0.5 rounded">
                        /table/{table.name}
                    </span>
                    {!table.migratedAt && (
                        <span className="text-[9px] font-mono border border-amber-500/15 text-amber-400/50 px-1.5 py-0.5 rounded">
                            not migrated
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">{table.fields.length} field{table.fields.length === 1 ? "" : "s"}</span>
                    <svg aria-hidden="true" className={`w-4 h-4 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="px-3 pb-3 space-y-4">
                    {/* DTO field table */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/20 mb-2">Schema / DTO</p>
                        <div className="rounded-lg border border-white/[0.05] overflow-hidden">
                            <table className="w-full text-[10px] font-mono">
                                <thead>
                                    <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                                        <th className="text-left px-2.5 py-1.5 text-white/30 font-medium">Field</th>
                                        <th className="text-left px-2.5 py-1.5 text-white/30 font-medium">Type</th>
                                        <th className="text-left px-2.5 py-1.5 text-white/30 font-medium">Required</th>
                                        <th className="text-left px-2.5 py-1.5 text-white/30 font-medium">Unique</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    <tr className="bg-white/[0.005]">
                                        <td className="px-2.5 py-1.5 text-[#81ecff]/60">id</td>
                                        <td className="px-2.5 py-1.5 text-violet-400/60">uuid</td>
                                        <td className="px-2.5 py-1.5 text-emerald-400/50">auto</td>
                                        <td className="px-2.5 py-1.5 text-emerald-400/50">✓</td>
                                    </tr>
                                    {table.fields.map((f) => (
                                        <tr key={f.name} className="bg-white/[0.005]">
                                            <td className="px-2.5 py-1.5 text-white/60">{f.name}</td>
                                            <td className="px-2.5 py-1.5 text-violet-400/60">{f.type}</td>
                                            <td className="px-2.5 py-1.5">
                                                {f.required
                                                    ? <span className="text-amber-400/60">required</span>
                                                    : <span className="text-white/20">optional</span>}
                                            </td>
                                            <td className="px-2.5 py-1.5">
                                                {f.unique
                                                    ? <span className="text-emerald-400/50">✓</span>
                                                    : <span className="text-white/20">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-white/[0.005]">
                                        <td className="px-2.5 py-1.5 text-white/30">created_at</td>
                                        <td className="px-2.5 py-1.5 text-violet-400/40">timestamp</td>
                                        <td className="px-2.5 py-1.5 text-white/20">auto</td>
                                        <td className="px-2.5 py-1.5 text-white/20">—</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Endpoints */}
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-white/20">Endpoints</p>
                        {TABLE_ENDPOINT_META.map(({ key, method, label, pathSuffix }) => {
                            const isOpen = openEndpoint === key;
                            const snippet = snippets[key];
                            const url = `${base}${pathSuffix}`;
                            return (
                                <div key={key} className="rounded-lg border border-white/[0.05] bg-black/10 overflow-hidden">
                                    <button
                                        onClick={() => setOpenEndpoint(isOpen ? null : key)}
                                        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/[0.02] transition-colors"
                                    >
                                        <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 font-mono rounded border ${METHOD_COLORS[method] || ""}`}>
                                            {method}
                                        </span>
                                        <code className="text-[11px] font-mono text-white/50 flex-1 truncate">{url}</code>
                                        <span className="text-[10px] text-white/25 shrink-0">{label}</span>
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-white/[0.04] p-2.5 space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3 h-3 text-white/20" />
                                                <span className="text-[10px] text-white/25">Requires: Bearer Token or API Key</span>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] text-[10px] font-mono text-white/50 overflow-x-auto whitespace-pre-wrap">
                                                    {snippet}
                                                </pre>
                                                <CopyBtn text={snippet} />
                                            </div>
                                            {key === "list" && (
                                                <div>
                                                    <p className="text-[10px] text-white/25 mb-1">Response shape:</p>
                                                    <pre className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-mono text-emerald-300/60 overflow-x-auto whitespace-pre-wrap">
                                                        {JSON.stringify({ success: true, data: { rows: [{ id: "uuid", ...buildBodyExample(table.fields), created_at: new Date().toISOString() }], total: 1 } }, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {(key === "create" || key === "update") && (
                                                <div>
                                                    <p className="text-[10px] text-white/25 mb-1">Request body:</p>
                                                    <pre className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[10px] font-mono text-blue-300/60 overflow-x-auto whitespace-pre-wrap">
                                                        {JSON.stringify(buildBodyExample(table.fields), null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
