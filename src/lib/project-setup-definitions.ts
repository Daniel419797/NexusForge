import type {
  SetupStepDefinition,
  SetupStepKey,
  SetupVerification,
} from "@/lib/project-setup";

function isUnavailable(
  verification: SetupVerification,
  key: SetupStepKey,
): boolean {
  return verification.unavailable.includes(key);
}

export function buildSetupDefinitions(
  verification: SetupVerification,
): SetupStepDefinition[] {
  const {
    project,
    config,
    templates,
    databaseConnection,
    tables,
    readiness,
    deployment,
    modules,
    apiKeys,
    logicModules,
    logicReadiness,
    integrations,
    integrationRuns,
  } = verification;
  const projectBase = `/projects/${project.id}`;
  const templateStored = isUnavailable(verification, "template")
    ? null
    : (templates?.some((template) => template.category === project.category) ??
      false);
  const databaseConnected =
    databaseConnection === "passed"
      ? true
      : databaseConnection === "failed" ||
          databaseConnection === "not-configured"
        ? false
        : null;
  const modelDefined = isUnavailable(verification, "model")
    ? null
    : (tables?.length ?? 0) > 0 &&
      Boolean(tables?.every((table) => Boolean(table.migratedAt)));
  const accessModulesReady = ["auth", "api-keys"].every((moduleId) =>
    modules?.some(
      (module) =>
        module.moduleId === moduleId &&
        (module.enabled || module.alwaysEnabled),
    ),
  );
  const usableApiKeys =
    apiKeys?.filter(
      (key) =>
        key.isActive &&
        (!key.expiresAt || new Date(key.expiresAt).getTime() > Date.now()),
    ) ?? [];
  const authConfigured = isUnavailable(verification, "access")
    ? null
    : accessModulesReady && usableApiKeys.length > 0;
  const automationEnabled = isUnavailable(verification, "modules")
    ? null
    : (logicModules?.some(
        (module) =>
          module.status === "active" && Boolean(module.activeVersionId),
      ) ??
        false) &&
      logicReadiness?.status !== "blocked";
  const liveDeployment = isUnavailable(verification, "gateway")
    ? null
    : deployment?.deployment.status === "live" &&
      Boolean(deployment.deployment.liveAt) &&
      readiness?.ready === true;
  const latestIntegrationRun = integrationRuns
    ?.slice()
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )[0];
  const frontendConnected = isUnavailable(verification, "frontend")
    ? null
    : Boolean(
        integrations?.some(
          (integration) => integration.status === "connected",
        ) &&
        latestIntegrationRun?.status === "pr_created" &&
        latestIntegrationRun.prUrl,
      );
  const migratedCount =
    tables?.filter((table) => Boolean(table.migratedAt)).length ?? 0;

  return [
    {
      key: "project",
      number: 1,
      eyebrow: "Foundation",
      title: "Create your project",
      shortTitle: "Project",
      description:
        "Establish the backend workspace, ownership, and project identity.",
      tasks: ["Name the workspace", "Choose an owner", "Create the project"],
      why: "Every generated resource and release is scoped to this project.",
      unlocks: ["Project workspace", "Scoped configuration", "Team ownership"],
      href: projectBase,
      actionLabel: "Open project",
      required: true,
      complete: true,
      evidenceWhenComplete: `Project ${project.name} exists`,
      evidenceWhenIncomplete: "Project record missing",
    },
    {
      key: "template",
      number: 2,
      eyebrow: "Architecture",
      title: "Choose a backend template",
      shortTitle: "Template",
      description:
        "Confirm the starting architecture for modules, policies, and defaults.",
      tasks: [
        "Choose a blueprint",
        "Review its defaults",
        "Confirm the baseline",
      ],
      why: "The template gives the control plane a safe baseline to build from.",
      unlocks: ["Module defaults", "Suggested policies", "Backend blueprint"],
      href: projectBase,
      actionLabel: "Review blueprint",
      required: true,
      complete: templateStored,
      evidenceWhenComplete: `${project.category} blueprint stored`,
      evidenceWhenIncomplete: "Project blueprint could not be matched",
    },
    {
      key: "database",
      number: 3,
      eyebrow: "Current required step",
      title: "Connect and verify your database",
      shortTitle: "Database",
      description:
        "Connect PostgreSQL or Supabase and run a live connection check.",
      tasks: [
        "Choose the provider",
        "Add the connection URL",
        "Run the live check",
      ],
      why: "Models, migrations, and generated data APIs need a verified storage target.",
      unlocks: ["Schema builder", "Migrations", "Generated CRUD APIs"],
      href:
        databaseConnection === "permission-required"
          ? `${projectBase}/settings/members`
          : `${projectBase}/settings/database`,
      actionLabel:
        databaseConnection === "permission-required"
          ? "Review project members"
          : "Configure database",
      required: true,
      complete: databaseConnected,
      evidenceWhenComplete: `${config?.dbType ?? "Database"} live check passed`,
      evidenceWhenIncomplete:
        databaseConnection === "failed"
          ? "The configured database did not pass its live check"
          : databaseConnection === "permission-required"
            ? "A project owner or admin must run the live check"
            : "No verified database connection",
    },
    {
      key: "model",
      number: 4,
      eyebrow: "Data contract",
      title: "Define your data model",
      shortTitle: "Data model",
      description:
        "Create or import the tables that become your versioned API contract.",
      tasks: [
        "Create or import tables",
        "Validate fields",
        "Run each migration",
      ],
      why: "A backend is useful only when its data shape is explicit and testable.",
      unlocks: ["Validated schema", "CRUD endpoints", "SDK types"],
      href: `${projectBase}/tables`,
      actionLabel: "Define data model",
      required: true,
      complete: modelDefined,
      evidenceWhenComplete: `${tables?.length ?? 0} data model${tables?.length === 1 ? "" : "s"} migrated`,
      evidenceWhenIncomplete:
        (tables?.length ?? 0) > 0
          ? `${migratedCount} of ${tables?.length ?? 0} data models migrated`
          : "No data models defined",
    },
    {
      key: "access",
      number: 5,
      eyebrow: "Security boundary",
      title: "Review authentication and project keys",
      shortTitle: "Auth & keys",
      description:
        "Confirm the built-in authentication and project-key capabilities before release.",
      tasks: [
        "Review authentication",
        "Create a project key",
        "Test protected access",
      ],
      why: "The gateway needs a supported identity and credential path before clients connect.",
      unlocks: [
        "JWT authentication",
        "Project keys",
        "Protected gateway routes",
      ],
      href: `${projectBase}/api-keys`,
      actionLabel: "Review project keys",
      required: true,
      complete: authConfigured,
      evidenceWhenComplete: `Core authentication enabled with ${usableApiKeys.length} active project key${usableApiKeys.length === 1 ? "" : "s"}`,
      evidenceWhenIncomplete: accessModulesReady
        ? "Core authentication is ready; create an active project key"
        : "Core authentication capabilities could not be verified",
    },
    {
      key: "modules",
      number: 6,
      eyebrow: "Optional capability",
      title: "Activate a workflow",
      shortTitle: "Automation",
      description:
        "Add a versioned workflow with an active trigger when the product needs automation.",
      tasks: [
        "Define the workflow",
        "Attach a trigger",
        "Version and activate it",
      ],
      why: "Automation belongs after the core data and security contract is stable.",
      unlocks: ["Event triggers", "Business logic", "Versioned automation"],
      href: `${projectBase}/settings/modules/logic-builder`,
      actionLabel: "Open workflow builder",
      required: false,
      complete: automationEnabled,
      evidenceWhenComplete: `Active workflow verified${logicReadiness?.status === "ready" ? " and ready" : ""}`,
      evidenceWhenIncomplete: "No active workflow version",
    },
    {
      key: "gateway",
      number: 7,
      eyebrow: "Release gate",
      title: "Validate and deploy your API",
      shortTitle: "Deploy API",
      description:
        "Run readiness checks and publish a versioned gateway with rollback history.",
      tasks: [
        "Run readiness checks",
        "Resolve failed gates",
        "Publish the gateway",
      ],
      why: "Validation turns configuration into an operational, recoverable backend release.",
      unlocks: ["Live gateway URL", "Version history", "Rollback"],
      href: `${projectBase}/deploy`,
      actionLabel: "Validate and deploy",
      required: true,
      complete: liveDeployment,
      evidenceWhenComplete: `Gateway v${deployment?.deployment.version ?? ""} is live and current checks pass`,
      evidenceWhenIncomplete:
        deployment?.deployment.status === "live"
          ? "Live gateway exists, but current readiness checks need attention"
          : "No live gateway deployment",
    },
    {
      key: "frontend",
      number: 8,
      eyebrow: "Delivery",
      title: "Wire your frontend",
      shortTitle: "Frontend",
      description:
        "Connect a repository, scan its stack, validate a patch, and review the proposed PR.",
      tasks: [
        "Connect the repository",
        "Generate and validate a patch",
        "Review the draft PR",
      ],
      why: "The final step makes the backend consumable without hiding code changes from your team.",
      unlocks: ["Repository scan", "Validated patch", "Draft pull request"],
      href: `${projectBase}/frontend-integrations`,
      actionLabel: "Connect frontend",
      required: false,
      complete: frontendConnected,
      evidenceWhenComplete: `Draft PR #${latestIntegrationRun?.prNumber ?? ""} created`,
      evidenceWhenIncomplete: integrations?.some(
        (integration) => integration.status === "connected",
      )
        ? "Repository connected; no completed draft PR"
        : "No frontend repository connected",
    },
  ];
}
