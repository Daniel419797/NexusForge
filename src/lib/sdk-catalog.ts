export interface SdkVariant {
    slug: string;
    name: string;
    packageName: string;
    language: string;
    runtime: string;
    status: "stable" | "beta";
    summary: string;
    quickStartSnippet: string;
    documentationSections: string[];
}

export interface SdkFamily {
    slug: string;
    name: string;
    tagline: string;
    summary: string;
    variants: SdkVariant[];
}

export const sdkCatalog: SdkFamily[] = [
    {
        slug: "authentication",
        name: "Authentication SDK",
        tagline: "Identity flows for every app surface",
        summary:
            "Everything needed to sign users in, rotate sessions, handle OAuth redirects, and keep authentication logic consistent across web apps, React products, and automation workflows.",
        variants: [
            {
                slug: "javascript",
                name: "JavaScript Auth",
                packageName: "@nexus-forge-sdk/auth",
                language: "TypeScript / JavaScript",
                runtime: "Browser + Node.js",
                status: "stable",
                summary: "Type-safe auth client for login, token refresh, profile access, and OAuth redirects.",
                quickStartSnippet: `import { NexusForgeAuth } from '@nexus-forge-sdk/auth';

const auth = new NexusForgeAuth({
  baseUrl: 'https://api.your-app.com',
  projectId: 'your-project-id',
});

await auth.login({ email: 'user@example.com', password: 'StrongPassword123!' });
const me = await auth.getMe();`,
                documentationSections: [
                    "Installation",
                    "Client initialization",
                    "Login and registration",
                    "Token refresh and session handling",
                    "Profile and account operations",
                    "OAuth redirect flow",
                    "Error handling",
                ],
            },
            {
                slug: "react",
                name: "React Auth",
                packageName: "@nexus-forge-sdk/react-auth",
                language: "React",
                runtime: "Next.js / SPA",
                status: "beta",
                summary: "Provider and hooks layer for auth-aware React interfaces.",
                quickStartSnippet: `import { NexusForgeAuthProvider } from '@nexus-forge-sdk/react-auth';

export function AppShell() {
  return (
    <NexusForgeAuthProvider baseUrl="https://api.your-app.com">
      <App />
    </NexusForgeAuthProvider>
  );
}`,
                documentationSections: [
                    "Installation",
                    "Provider setup",
                    "Session hooks",
                    "Route guards",
                    "Token-aware fetch flows",
                ],
            },
            {
                slug: "python",
                name: "Python Auth",
                packageName: "nexusforge-auth",
                language: "Python",
                runtime: "Workers / Scripts",
                status: "beta",
                summary: "Authentication primitives for backend scripts and operational tooling.",
                quickStartSnippet: `from nexusforge_auth import NexusForgeAuthClient

client = NexusForgeAuthClient(
    base_url="https://api.your-app.com",
    project_id="your-project-id"
)

session = client.login(email="user@example.com", password="StrongPassword123!")`,
                documentationSections: [
                    "Installation",
                    "Client initialization",
                    "Credential exchange",
                    "Refresh workflow",
                    "Operational scripting",
                ],
            },
        ],
    },
    {
        slug: "data-client",
        name: "Data Client SDK",
        tagline: "Typed data access across app tiers",
        summary:
            "Generated clients and UI bindings for querying resources, mutating data, and integrating NexusForge projects into frontend dashboards and backend pipelines.",
        variants: [
            {
                slug: "javascript",
                name: "JavaScript Client",
                packageName: "@nexus-forge-sdk/js-client",
                language: "TypeScript / JavaScript",
                runtime: "Browser + Node.js",
                status: "beta",
                summary: "Generated API client for project endpoints with typed request and response models.",
                quickStartSnippet: `import { createNexusClient } from '@nexus-forge-sdk/js-client';

const client = createNexusClient({
  baseUrl: 'https://api.your-app.com',
  apiKey: 'nf_live_...'
});

const users = await client.users.list({ limit: 20 });`,
                documentationSections: [
                    "Installation",
                    "Client setup",
                    "Querying resources",
                    "Mutations and validation",
                    "Pagination and filtering",
                    "Error handling",
                ],
            },
            {
                slug: "react",
                name: "React Client",
                packageName: "@nexus-forge-sdk/react",
                language: "React",
                runtime: "Next.js / SPA",
                status: "beta",
                summary: "React hooks and providers for auth, data fetching, and realtime project state.",
                quickStartSnippet: `import { NexusForgeProvider, useNexusProject } from '@nexus-forge-sdk/react';

function Dashboard() {
  const project = useNexusProject();
  return <pre>{JSON.stringify(project.data, null, 2)}</pre>;
}`,
                documentationSections: [
                    "Installation",
                    "Provider setup",
                    "Data hooks",
                    "Optimistic updates",
                    "Caching strategy",
                ],
            },
            {
                slug: "python",
                name: "Python Client",
                packageName: "nexusforge-sdk",
                language: "Python",
                runtime: "Workers / Data Pipelines",
                status: "beta",
                summary: "Python client for backend jobs, data sync pipelines, and automation scripts.",
                quickStartSnippet: `from nexusforge_sdk import NexusForgeClient

client = NexusForgeClient(
    base_url="https://api.your-app.com",
    api_key="nf_live_..."
)

projects = client.projects.list(limit=10)`,
                documentationSections: [
                    "Installation",
                    "Client initialization",
                    "Authentication",
                    "Batch operations",
                    "Retry and backoff",
                    "Error handling",
                ],
            },
        ],
    },
];

export function getSdkFamilyBySlug(slug: string): SdkFamily | undefined {
    return sdkCatalog.find((family) => family.slug === slug);
}

export function getSdkVariant(familySlug: string, variantSlug: string): { family: SdkFamily; variant: SdkVariant } | undefined {
    const family = getSdkFamilyBySlug(familySlug);
    if (!family) return undefined;

    const variant = family.variants.find((item) => item.slug === variantSlug);
    if (!variant) return undefined;

    return { family, variant };
}
