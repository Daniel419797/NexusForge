export interface SdkCatalogItem {
    slug: string;
    name: string;
    packageName: string;
    language: string;
    status: "stable" | "beta";
    summary: string;
    longDescription: string;
    documentationSections: string[];
    quickStartSnippet: string;
}

export const sdkCatalog: SdkCatalogItem[] = [
    {
        slug: "nexusforge-auth",
        name: "NexusForge Auth SDK",
        packageName: "@nexus-forge-sdk/auth",
        language: "TypeScript / JavaScript",
        status: "stable",
        summary: "Type-safe auth client for login, token refresh, profile access, and OAuth redirects.",
        longDescription:
            "NexusForge Auth SDK provides a typed client for authentication flows. It manages access and refresh tokens, automatically refreshes near expiry, and exposes typed errors for robust handling in frontend and backend Node.js apps.",
        documentationSections: [
            "Installation",
            "Client initialization",
            "Login and registration",
            "Token refresh and session handling",
            "Profile and account operations",
            "OAuth redirect flow",
            "Error handling",
        ],
        quickStartSnippet: `import { NexusForgeAuth } from '@nexus-forge-sdk/auth';

const auth = new NexusForgeAuth({
  baseUrl: 'https://api.your-app.com',
  projectId: 'your-project-id',
});

await auth.login({ email: 'user@example.com', password: 'StrongPassword123!' });
const me = await auth.getMe();`,
    },
    {
        slug: "nexusforge-js-client",
        name: "NexusForge JS Client",
        packageName: "@nexus-forge-sdk/js-client",
        language: "TypeScript / JavaScript",
        status: "beta",
        summary: "Generated API client for project endpoints with typed request and response models.",
        longDescription:
            "NexusForge JS Client gives you a typed interface for CRUD resources, filters, pagination, and generated endpoint methods for your project APIs.",
        documentationSections: [
            "Installation",
            "Client setup",
            "Querying resources",
            "Mutations and validation",
            "Pagination and filtering",
            "Error handling",
        ],
        quickStartSnippet: `import { createNexusClient } from '@nexus-forge-sdk/js-client';

const client = createNexusClient({
  baseUrl: 'https://api.your-app.com',
  apiKey: 'nf_live_...'
});

const users = await client.users.list({ limit: 20 });`,
    },
    {
        slug: "nexusforge-react",
        name: "NexusForge React SDK",
        packageName: "@nexus-forge-sdk/react",
        language: "React",
        status: "beta",
        summary: "React hooks and providers for auth, data fetching, and realtime project state.",
        longDescription:
            "NexusForge React SDK wraps core clients in React context and hooks so teams can build quickly with composable primitives.",
        documentationSections: [
            "Installation",
            "Provider setup",
            "Authentication hooks",
            "Data hooks",
            "Optimistic updates",
            "Caching strategy",
        ],
        quickStartSnippet: `import { NexusForgeProvider, useNexusProject } from '@nexus-forge-sdk/react';

function App() {
  return (
    <NexusForgeProvider config={{ baseUrl: 'https://api.your-app.com' }}>
      <Dashboard />
    </NexusForgeProvider>
  );
}`,
    },
    {
        slug: "nexusforge-python",
        name: "NexusForge Python SDK",
        packageName: "nexusforge-sdk",
        language: "Python",
        status: "beta",
        summary: "Python client for backend jobs, data sync pipelines, and automation scripts.",
        longDescription:
            "NexusForge Python SDK is designed for automation and server-side tasks, including batch data imports and integration workers.",
        documentationSections: [
            "Installation",
            "Client initialization",
            "Authentication",
            "Batch operations",
            "Retry and backoff",
            "Error handling",
        ],
        quickStartSnippet: `from nexusforge_sdk import NexusForgeClient

client = NexusForgeClient(
    base_url="https://api.your-app.com",
    api_key="nf_live_..."
)

projects = client.projects.list(limit=10)`,
    },
];

export function getSdkBySlug(slug: string): SdkCatalogItem | undefined {
    return sdkCatalog.find((sdk) => sdk.slug === slug);
}
