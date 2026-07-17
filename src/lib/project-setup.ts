import { buildSetupDefinitions } from "@/lib/project-setup-definitions";
import type { ApiKey } from "@/services/ApiKeyService";
import type {
  LogicModuleDefinition,
  LogicModuleReadiness,
} from "@/services/LogicModuleService";
import type { ModuleInfo } from "@/services/ModuleService";
import type {
  CategoryTemplate,
  ProjectConfig,
} from "@/services/ProjectService";
import type { CustomTable } from "@/services/TableService";
import type {
  DeploymentDetail,
  FrontendIntegration,
  FrontendIntegrationRun,
  Project,
  ReadinessResult,
} from "@/types";

export type SetupStepKey =
  | "project"
  | "template"
  | "database"
  | "model"
  | "access"
  | "modules"
  | "gateway"
  | "frontend";

export type SetupStepStatus =
  "complete" | "current" | "available" | "locked" | "unverified";

export type DatabaseConnectionState =
  | "passed"
  | "failed"
  | "not-configured"
  | "permission-required"
  | "unsupported"
  | "unavailable";

export interface SetupVerification {
  project: Project;
  config: ProjectConfig | null;
  templates: CategoryTemplate[] | null;
  databaseConnection: DatabaseConnectionState;
  tables: CustomTable[] | null;
  readiness: ReadinessResult | null;
  deployment: DeploymentDetail | null;
  modules: ModuleInfo[] | null;
  apiKeys: ApiKey[] | null;
  logicModules: LogicModuleDefinition[] | null;
  logicReadiness: LogicModuleReadiness | null;
  integrations: FrontendIntegration[] | null;
  integrationRuns: FrontendIntegrationRun[] | null;
  unavailable: SetupStepKey[];
}

export interface SetupStep {
  key: SetupStepKey;
  number: number;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  tasks: string[];
  why: string;
  unlocks: string[];
  href: string;
  actionLabel: string;
  required: boolean;
  status: SetupStepStatus;
  evidence: string;
}

export interface SetupStepDefinition extends Omit<
  SetupStep,
  "status" | "evidence"
> {
  complete: boolean | null;
  evidenceWhenComplete: string;
  evidenceWhenIncomplete: string;
}

export interface ProjectSetupJourney {
  steps: SetupStep[];
  currentStep: SetupStep | null;
  journeyPercent: number;
  completedCount: number;
  requiredCompleted: number;
  requiredTotal: number;
  backendReady: boolean;
  evidence: Array<{
    label: string;
    value: string;
    tone: "positive" | "warning" | "neutral";
  }>;
}

const REQUIRED_STEP_KEYS: SetupStepKey[] = [
  "project",
  "template",
  "database",
  "model",
  "access",
  "gateway",
];

function isUnavailable(
  verification: SetupVerification,
  key: SetupStepKey,
): boolean {
  return verification.unavailable.includes(key);
}

function buildEvidence(verification: SetupVerification) {
  const deployment = verification.deployment?.deployment;
  const migratedTables =
    verification.tables?.filter((table) => table.migratedAt).length ?? 0;
  const allTablesMigrated =
    (verification.tables?.length ?? 0) > 0 &&
    verification.tables?.every((table) => table.migratedAt);

  return [
    {
      label: "Project",
      value: verification.project.name,
      tone: "positive" as const,
    },
    {
      label: "Database",
      value:
        verification.databaseConnection === "passed"
          ? `${verification.config?.dbType ?? "database"} live check passed`
          : verification.databaseConnection === "unsupported"
            ? `${verification.config?.dbType ?? "database"} configured; live check unsupported`
            : verification.databaseConnection === "permission-required"
              ? "Owner or admin verification required"
              : verification.databaseConnection === "failed"
                ? "Live check failed"
                : verification.databaseConnection === "unavailable"
                  ? "Live check unavailable"
                  : "Connection required",
      tone:
        verification.databaseConnection === "passed"
          ? ("positive" as const)
          : ("warning" as const),
    },
    {
      label: "Data models",
      value: isUnavailable(verification, "model")
        ? "Unavailable"
        : `${migratedTables}/${verification.tables?.length ?? 0} migrated`,
      tone: allTablesMigrated ? ("positive" as const) : ("warning" as const),
    },
    {
      label: "Gateway",
      value:
        deployment?.status === "live" && deployment.liveAt
          ? `v${deployment.version} live`
          : isUnavailable(verification, "gateway")
            ? "Unavailable"
            : "Not deployed",
      tone:
        deployment?.status === "live" && deployment.liveAt
          ? ("positive" as const)
          : ("neutral" as const),
    },
  ];
}

export function deriveProjectSetupJourney(
  verification: SetupVerification,
): ProjectSetupJourney {
  const definitions = buildSetupDefinitions(verification);
  const firstRequiredIncomplete =
    definitions.find((step) => step.required && step.complete === false) ??
    definitions.find((step) => step.required && step.complete === null);
  const currentIndex = firstRequiredIncomplete
    ? definitions.findIndex((step) => step.key === firstRequiredIncomplete.key)
    : -1;

  const steps: SetupStep[] = definitions.map((step, index) => {
    let status: SetupStepStatus;

    if (step.complete === true) status = "complete";
    else if (step.complete === null) status = "unverified";
    else if (step.key === firstRequiredIncomplete?.key) status = "current";
    else if (!step.required && (currentIndex === -1 || index <= currentIndex)) {
      status = "available";
    } else status = "locked";

    return {
      ...step,
      status,
      evidence:
        step.complete === true
          ? step.evidenceWhenComplete
          : step.evidenceWhenIncomplete,
    };
  });

  const requiredSteps = steps.filter((step) =>
    REQUIRED_STEP_KEYS.includes(step.key),
  );
  const requiredCompleted = requiredSteps.filter(
    (step) => step.status === "complete",
  ).length;
  const completedCount = steps.filter(
    (step) => step.status === "complete",
  ).length;

  return {
    steps,
    currentStep: firstRequiredIncomplete
      ? (steps.find((step) => step.key === firstRequiredIncomplete.key) ?? null)
      : (steps.find((step) => step.status === "available") ?? null),
    journeyPercent: Math.round((completedCount / steps.length) * 100),
    completedCount,
    requiredCompleted,
    requiredTotal: requiredSteps.length,
    backendReady: requiredCompleted === requiredSteps.length,
    evidence: buildEvidence(verification),
  };
}
