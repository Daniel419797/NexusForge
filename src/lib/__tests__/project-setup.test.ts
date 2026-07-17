import { describe, expect, it } from "vitest";

import {
  deriveProjectSetupJourney,
  type SetupVerification,
} from "@/lib/project-setup";

function verification(
  overrides: Partial<SetupVerification> = {},
): SetupVerification {
  return {
    project: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Payments API",
      category: "saas",
      status: "active",
      ownerId: "22222222-2222-4222-8222-222222222222",
      createdAt: "2026-07-17T08:00:00.000Z",
    },
    config: {
      dbType: "postgresql",
      dbConnected: false,
      settings: {},
    },
    templates: [
      {
        name: "SaaS",
        category: "saas",
        description: "SaaS backend",
        defaultSettings: {},
        suggestedPlugins: [],
        notificationEvents: [],
      },
    ],
    databaseConnection: "not-configured",
    tables: [],
    readiness: { ready: false, checks: [] },
    deployment: null,
    modules: [
      {
        moduleId: "auth",
        label: "Authentication",
        description: "Authentication",
        enabled: false,
        alwaysEnabled: true,
      },
      {
        moduleId: "api-keys",
        label: "API Keys",
        description: "API Keys",
        enabled: false,
        alwaysEnabled: true,
      },
    ],
    apiKeys: [],
    logicModules: [],
    logicReadiness: null,
    integrations: [],
    integrationRuns: [],
    unavailable: [],
    ...overrides,
  };
}

describe("deriveProjectSetupJourney", () => {
  it("points a new project to the first missing required stage", () => {
    const journey = deriveProjectSetupJourney(verification());

    expect(journey.currentStep?.key).toBe("database");
    expect(journey.steps.find((step) => step.key === "database")?.status).toBe(
      "current",
    );
    expect(journey.backendReady).toBe(false);
  });

  it("does not complete the data-model stage until every table is migrated", () => {
    const journey = deriveProjectSetupJourney(
      verification({
        databaseConnection: "passed",
        tables: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            projectId: "11111111-1111-4111-8111-111111111111",
            name: "payments",
            displayName: "Payments",
            fields: [],
            migratedAt: null,
            createdAt: "2026-07-17T08:00:00.000Z",
            updatedAt: "2026-07-17T08:00:00.000Z",
          },
        ],
      }),
    );

    expect(journey.currentStep?.key).toBe("model");
    expect(journey.currentStep?.evidence).toBe("0 of 1 data models migrated");
  });

  it("requires an active project key before completing the access stage", () => {
    const migratedTable = {
      id: "33333333-3333-4333-8333-333333333333",
      projectId: "11111111-1111-4111-8111-111111111111",
      name: "payments",
      displayName: "Payments",
      fields: [],
      migratedAt: "2026-07-17T08:30:00.000Z",
      createdAt: "2026-07-17T08:00:00.000Z",
      updatedAt: "2026-07-17T08:30:00.000Z",
    };
    const withoutKey = deriveProjectSetupJourney(
      verification({ databaseConnection: "passed", tables: [migratedTable] }),
    );

    expect(withoutKey.currentStep?.key).toBe("access");

    const withKey = deriveProjectSetupJourney(
      verification({
        databaseConnection: "passed",
        tables: [migratedTable],
        apiKeys: [
          {
            id: "66666666-6666-4666-8666-666666666666",
            name: "Web client",
            prefix: "nf_live_1234",
            scopes: [],
            keyType: "secret",
            isActive: true,
            expiresAt: null,
            createdAt: "2026-07-17T09:00:00.000Z",
          },
        ],
      }),
    );

    expect(withKey.steps.find((step) => step.key === "access")?.status).toBe(
      "complete",
    );
  });

  it("marks unsupported live database verification as unverified", () => {
    const journey = deriveProjectSetupJourney(
      verification({
        config: {
          dbType: "mongodb",
          dbConnected: true,
          settings: {},
        },
        databaseConnection: "unsupported",
        unavailable: ["database"],
      }),
    );

    expect(journey.currentStep?.key).toBe("model");
    expect(journey.steps.find((step) => step.key === "database")?.status).toBe(
      "unverified",
    );
  });

  it("requires the latest frontend run to produce a draft PR", () => {
    const journey = deriveProjectSetupJourney(
      verification({
        integrations: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            projectId: "11111111-1111-4111-8111-111111111111",
            provider: "github",
            repoOwner: "acme",
            repoName: "web",
            repoId: "123",
            installationId: "456",
            defaultBranch: "main",
            status: "connected",
            createdBy: "22222222-2222-4222-8222-222222222222",
            createdAt: "2026-07-17T08:00:00.000Z",
            updatedAt: "2026-07-17T08:00:00.000Z",
          },
        ],
        integrationRuns: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            integrationId: "44444444-4444-4444-8444-444444444444",
            projectId: "11111111-1111-4111-8111-111111111111",
            targetBranch: "main",
            baseSha: null,
            status: "failed",
            plan: null,
            summary: null,
            prNumber: null,
            prUrl: null,
            errorMessage: "Validation failed",
            createdBy: "22222222-2222-4222-8222-222222222222",
            createdAt: "2026-07-17T10:00:00.000Z",
            updatedAt: "2026-07-17T10:00:00.000Z",
          },
        ],
      }),
    );

    expect(
      journey.steps.find((step) => step.key === "frontend")?.status,
    ).not.toBe("complete");
  });
});
