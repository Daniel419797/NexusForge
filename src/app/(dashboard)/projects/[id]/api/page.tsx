"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";

export default function ProjectApiPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;
    const project = useProjectStore((s) => s.activeProject);

    if (!projectId) return null;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const gatewayBase = `${apiBase}/api/v1/p/${projectId}`;
    const isTenantAuth = project?.config?.settings?.tenantOwnedAuth === true;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-lg font-semibold">Project API</h2>
                <p className="text-sm text-muted-foreground">Base endpoints and example requests for this project.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gateway Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                    <code className="block p-2 rounded bg-card border border-border font-mono">{gatewayBase}</code>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Authentication Endpoints</CardTitle>
                        {isTenantAuth && (
                            <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
                                Tenant-Owned
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        {isTenantAuth
                            ? "Users are stored in your project database."
                            : "User registration, login, and token management."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { method: "POST", path: "/auth/register", desc: "Register a new user" },
                        { method: "POST", path: "/auth/login", desc: "Login and receive JWT tokens" },
                        { method: "POST", path: "/auth/refresh", desc: "Refresh access token (rotates)" },
                        { method: "POST", path: "/auth/logout", desc: "Revoke all refresh tokens" },
                        { method: "GET", path: "/auth/me", desc: "Get current user profile" },
                        { method: "POST", path: "/auth/verify-email", desc: "Verify email address" },
                        { method: "POST", path: "/auth/resend-verification", desc: "Resend verification email" },
                    ].map(({ method, path, desc }) => (
                        <div key={path} className="flex items-center gap-3 p-2 rounded bg-muted/5 border border-border">
                            <Badge variant="outline" className={`text-[10px] font-mono ${method === "GET" ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"}`}>
                                {method}
                            </Badge>
                            <code className="text-xs font-mono text-muted-foreground flex-1">{gatewayBase}{path}</code>
                            <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">{desc}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {isTenantAuth && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Auth Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <ul className="space-y-1.5 list-disc list-inside">
                            <li><strong>Per-project JWT signing</strong> &mdash; Access and refresh tokens are signed with your project&apos;s own secret</li>
                            <li><strong>Project-scoped lockout</strong> &mdash; Failed login attempts are isolated per project (no cross-tenant interference)</li>
                            <li><strong>Tenant-aware email verification</strong> &mdash; Verification tokens route to your project database</li>
                            <li><strong>Refresh token rotation</strong> &mdash; Tokens rotate on every refresh; reuse triggers family revocation</li>
                            <li><strong>Audit logs</strong> &mdash; Auth events (register, login, logout) are written to your project database</li>
                        </ul>
                        <div className="mt-2 p-3 rounded-lg bg-muted/5 border">
                            <p className="text-xs font-medium mb-1">Response shape (register/login):</p>
                            <pre className="text-[11px] font-mono text-muted-foreground/80 whitespace-pre-wrap">{`{
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "user" },
  "accessToken": "eyJ...",    // includes projectId claim
  "refreshToken": "eyJ...",   // includes projectId claim
  "projectToken": "eyJ..."    // project-scoped token for API access
}`}</pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Example: Submit Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">POST /events</p>
                    <pre className="p-3 rounded bg-muted/5 border border-border text-sm overflow-auto">{
                        `POST ${gatewayBase}/events
{
  "type": "message.created",
  "payload": { "text": "Hello" }
}`
                    }</pre>
                </CardContent>
            </Card>
        </div>
    );
}
