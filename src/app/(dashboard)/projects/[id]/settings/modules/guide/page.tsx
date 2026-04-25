"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, ShieldCheck, Zap, Workflow, Settings2 } from "lucide-react";

type GuideSection = {
    id: string;
    title: string;
    summary: string;
};

const sections: GuideSection[] = [
    { id: "overview", title: "Overview", summary: "What this system is and what users can build" },
    { id: "project-setup", title: "1. Create Project", summary: "Create a project and enable needed modules" },
    { id: "module-setup", title: "2. Create Module", summary: "Define and activate a logic module version" },
    { id: "workflow-design", title: "3. Design Workflow", summary: "Node types, triggers, and recommended patterns" },
    { id: "public-api", title: "4. Public API", summary: "Webhook and CRUD-style invocation" },
    { id: "signature", title: "5. Sign Requests", summary: "HMAC signature model for public endpoints" },
    { id: "rate-limits", title: "6. Tune Rate Limits", summary: "Method-specific defaults and tenant overrides" },
    { id: "operations", title: "7. Operate in Production", summary: "Runs, traces, retries, and dead letters" },
    { id: "advanced", title: "8. Full Capabilities", summary: "Most advanced use-cases and architecture patterns" },
    { id: "examples", title: "9. Practical Examples", summary: "Copy-and-adapt request and payload examples" },
    { id: "checklist", title: "10. Launch Checklist", summary: "Go-live checklist for secure production rollout" },
];

function CodeBlock({ code }: { code: string }) {
    return (
        <pre className="rounded-lg border border-border bg-muted/30 p-4 overflow-x-auto text-xs leading-6">
            <code>{code}</code>
        </pre>
    );
}

export default function LogicModulesGuidePage() {
    const params = useParams();
    const projectId = params.id as string | undefined;
    if (!projectId) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href={`/projects/${projectId}/settings/modules/logic-modules`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold font-display tracking-tight">Logic Modules Guide</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Complete dashboard guide: from creating a project to exposing secure, production-ready workflow APIs.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-3 py-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Detailed Setup + Full Capabilities
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                <aside className="lg:sticky lg:top-20 h-fit rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-2">
                        Guide Sections
                    </p>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="block rounded-md px-2 py-2 hover:bg-muted/60 transition-colors"
                            >
                                <p className="text-sm font-medium">{section.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{section.summary}</p>
                            </a>
                        ))}
                    </nav>
                </aside>

                <main className="space-y-10">
                    <section id="overview" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">Overview</h2>
                        <p className="text-sm text-muted-foreground leading-7">
                            Logic Modules let users build backend behavior from the UI. A module can receive events,
                            evaluate business rules, read and write data, and expose callable endpoints for external systems.
                            This is designed for users who do not want to build and host their own backend.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold"><Workflow className="w-4 h-4" /> Workflow Runtime</div>
                                <p className="text-xs text-muted-foreground mt-2">Visual graph execution with versioning and rollback.</p>
                            </div>
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="w-4 h-4" /> Security</div>
                                <p className="text-xs text-muted-foreground mt-2">Checksum validation, recompile-on-run, and signed public calls.</p>
                            </div>
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold"><Zap className="w-4 h-4" /> Operations</div>
                                <p className="text-xs text-muted-foreground mt-2">Run traces, retries, dead-letter recovery, and throttling controls.</p>
                            </div>
                        </div>
                    </section>

                    <section id="project-setup" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">1. Create Project</h2>
                        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2 leading-7">
                            <li>Create a new project from the dashboard.</li>
                            <li>Go to Settings - Modules and enable what you need (at minimum keep required modules enabled).</li>
                            <li>Configure project database so read/write workflow nodes have a target datastore.</li>
                            <li>Optionally configure project CORS/OAuth settings if external app surfaces are needed.</li>
                        </ol>
                        <p className="text-xs text-muted-foreground">Recommended: create a dedicated table for each domain (for example `products`, `inventory`, `orders`).</p>
                    </section>

                    <section id="module-setup" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">2. Create Module</h2>
                        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2 leading-7">
                            <li>Open Settings - Modules - Logic Modules.</li>
                            <li>Create a module definition (module key + display name).</li>
                            <li>Open Logic Builder, design graph, then save version.</li>
                            <li>Activate a version to make it runnable in production.</li>
                        </ol>
                        <p className="text-xs text-muted-foreground">Module key becomes part of callable endpoint paths, so keep it stable.</p>
                    </section>

                    <section id="workflow-design" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">3. Design Workflow</h2>
                        <p className="text-sm text-muted-foreground leading-7">
                            Build with node types: start, filter, branch, read_table, write_table, notify, end.
                            Trigger types: manual, row_created, row_updated, scheduled, webhook.
                        </p>
                        <div className="rounded-lg border border-border p-4">
                            <p className="text-sm font-medium">Recommended pattern for API-like modules</p>
                            <ol className="list-decimal pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                                <li>Start</li>
                                <li>Branch on method/event type</li>
                                <li>Validate payload with filter nodes</li>
                                <li>Read/write target tables</li>
                                <li>Notify or log</li>
                                <li>End with normalized result output</li>
                            </ol>
                        </div>
                    </section>

                    <section id="public-api" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">4. Public API</h2>
                        <p className="text-sm text-muted-foreground leading-7">
                            Logic Modules can be called publicly through webhook and CRUD-style endpoint surfaces.
                            This is separate from products pages and can act as backend endpoints for external systems.
                        </p>
                        <CodeBlock
                            code={`POST   /api/v1/modules/:projectId/:moduleKey/webhook

GET    /api/v1/modules/:projectId/:moduleKey/crud
POST   /api/v1/modules/:projectId/:moduleKey/crud
PATCH  /api/v1/modules/:projectId/:moduleKey/crud/:resourceId
DELETE /api/v1/modules/:projectId/:moduleKey/crud/:resourceId`}
                        />
                    </section>

                    <section id="signature" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">5. Sign Requests</h2>
                        <p className="text-sm text-muted-foreground leading-7">
                            Public invocation endpoints require request signatures when webhook secret is configured.
                            CRUD endpoint usage requires webhook trigger secret configuration.
                        </p>
                        <CodeBlock
                                                        code={[
                                                                'import crypto from "node:crypto";',
                                                                '',
                                                                'function sign(secret: string, payload: unknown) {',
                                                                '  const digest = crypto.createHmac("sha256", secret)',
                                                                '    .update(JSON.stringify(payload))',
                                                                '    .digest("hex");',
                                                                '  return "sha256=" + digest;',
                                                                '}',
                                                        ].join("\n")}
                        />
                    </section>

                    <section id="rate-limits" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">6. Tune Rate Limits</h2>
                        <p className="text-sm text-muted-foreground leading-7">
                            Method-specific defaults are applied, and tenants can override in project settings with bounded values.
                        </p>
                        <CodeBlock
                            code={`Defaults (per minute):
webhook: 120
crud GET: 180
crud POST: 60
crud PATCH: 30
crud DELETE: 20

Tenant override payload:
PATCH /api/v1/projects/:projectId/config
{
  "settings": {
    "rateLimit": {
      "logicModules": {
        "webhookPerMinute": 200,
        "crud": {
          "getPerMinute": 300,
          "postPerMinute": 80,
          "patchPerMinute": 40,
          "deletePerMinute": 20
        }
      }
    }
  }
}`}
                        />
                        <p className="text-xs text-muted-foreground">Valid range is 5 to 1000 for each value.</p>
                    </section>

                    <section id="operations" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">7. Operate in Production</h2>
                        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2 leading-7">
                            <li>Use Runs view to inspect execution status over time.</li>
                            <li>Open trace for a run to inspect node-by-node I/O and failures.</li>
                            <li>Retry failed/dead-lettered runs when transient errors are resolved.</li>
                            <li>Review dead letters frequently to prevent silent backlog growth.</li>
                            <li>Use version activation/rollback for controlled releases.</li>
                        </ol>
                    </section>

                    <section id="advanced" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">8. Full Capabilities</h2>
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <p className="text-sm font-medium">Most sophisticated pattern: Tenant backend orchestration</p>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2 leading-7">
                                <li>Use CRUD endpoints as a public API facade for tenant apps.</li>
                                <li>Route by request method/event with branch nodes.</li>
                                <li>Read/write multiple domain tables in one flow.</li>
                                <li>Trigger secondary modules from row events for async fan-out.</li>
                                <li>Use schedule trigger for sync/reconciliation tasks.</li>
                                <li>Track each run with traces, dead-letter fallback, and retries.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="examples" className="space-y-3 scroll-mt-24">
                        <h2 className="text-xl font-semibold">9. Practical Examples</h2>
                        <p className="text-sm text-muted-foreground">Example product module calls from external clients:</p>
                        <CodeBlock
                            code={`# Create product
POST /api/v1/modules/<projectId>/product_api/crud
Body: { "name": "T-Shirt", "sku": "TS-001", "price": 29.99, "stock": 10 }

# Get product
GET /api/v1/modules/<projectId>/product_api/crud/prod_123?includeInventory=true

# Patch product
PATCH /api/v1/modules/<projectId>/product_api/crud/prod_123
Body: { "price": 24.99 }

# Delete product
DELETE /api/v1/modules/<projectId>/product_api/crud/prod_123`}
                        />
                    </section>

                    <section id="checklist" className="space-y-3 scroll-mt-24 pb-10">
                        <h2 className="text-xl font-semibold">10. Launch Checklist</h2>
                        <div className="rounded-lg border border-border p-4">
                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2 leading-7">
                                <li>Project DB configured and tested.</li>
                                <li>Module created, version saved, and active.</li>
                                <li>Webhook trigger configured with strong secret.</li>
                                <li>Public caller uses valid `x-webhook-signature`.</li>
                                <li>Rate limits tuned for expected traffic profile.</li>
                                <li>Run monitoring, retry flow, and dead-letter review in place.</li>
                            </ul>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/projects/${projectId}/settings/modules/logic-modules`}
                                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Settings2 className="w-4 h-4" />
                                Open Logic Modules
                            </Link>
                            <Link
                                href={`/projects/${projectId}/settings/modules/logic-builder`}
                                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Workflow className="w-4 h-4" />
                                Open Logic Builder
                            </Link>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
