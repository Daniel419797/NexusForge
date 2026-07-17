"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ApiKeyService from "@/services/ApiKeyService";
import DeployService from "@/services/DeployService";
import FrontendIntegrationService from "@/services/FrontendIntegrationService";
import LogicModuleService from "@/services/LogicModuleService";
import ModuleService from "@/services/ModuleService";
import ProjectService from "@/services/ProjectService";
import TableService from "@/services/TableService";
import {
  deriveProjectSetupJourney,
  type DatabaseConnectionState,
  type ProjectSetupJourney,
  type SetupStepKey,
  type SetupVerification,
} from "@/lib/project-setup";
import { useProjectStore } from "@/store/projectStore";
import type { FrontendIntegrationRun } from "@/types";

interface ProjectSetupState {
  journey: ProjectSetupJourney | null;
  verification: SetupVerification | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function messageFromError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  return "We could not load this project's setup evidence.";
}

function responseStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return undefined;
  }

  return (error as { response?: { status?: number } }).response?.status;
}

export function useProjectSetup(
  projectId: string | undefined,
): ProjectSetupState {
  const [journey, setJourney] = useState<ProjectSetupJourney | null>(null);
  const [verification, setVerification] = useState<SetupVerification | null>(
    null,
  );
  const [loading, setLoading] = useState(Boolean(projectId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (background = false) => {
      const requestId = ++requestIdRef.current;

      if (!projectId) {
        setJourney(null);
        setVerification(null);
        setLoading(false);
        return;
      }

      if (background) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const detail = await ProjectService.getById(projectId);
        const databaseConfigured = detail.config?.dbConnected === true;
        const databaseTestSupported =
          detail.config?.dbType === "postgresql" ||
          detail.config?.dbType === "supabase";
        const results = await Promise.allSettled([
          TableService.listTables(projectId),
          DeployService.getReadiness(projectId),
          DeployService.getCurrentDeployment(projectId),
          FrontendIntegrationService.listIntegrations(projectId),
          ProjectService.getTemplates(),
          ModuleService.list(projectId),
          LogicModuleService.list(projectId),
          LogicModuleService.getReadiness(projectId),
          databaseConfigured && databaseTestSupported
            ? ProjectService.testDbConnection(projectId)
            : Promise.resolve(null),
          ApiKeyService.list(projectId),
        ] as const);
        const unavailable = new Set<SetupStepKey>();

        if (results[0].status === "rejected") unavailable.add("model");
        if (results[1].status === "rejected") unavailable.add("gateway");
        if (results[2].status === "rejected") unavailable.add("gateway");
        if (results[3].status === "rejected") unavailable.add("frontend");
        if (results[4].status === "rejected") unavailable.add("template");
        if (
          results[5].status === "rejected" ||
          results[9].status === "rejected"
        ) {
          unavailable.add("access");
        }
        if (
          results[6].status === "rejected" ||
          results[7].status === "rejected"
        ) {
          unavailable.add("modules");
        }

        let databaseConnection: DatabaseConnectionState;
        if (!databaseConfigured) {
          databaseConnection = "not-configured";
        } else if (!databaseTestSupported) {
          databaseConnection = "unsupported";
          unavailable.add("database");
        } else if (
          results[8].status === "fulfilled" &&
          results[8].value?.connected
        ) {
          databaseConnection = "passed";
        } else if (
          results[8].status === "rejected" &&
          [400, 503].includes(responseStatus(results[8].reason) ?? 0)
        ) {
          databaseConnection = "failed";
        } else if (
          results[8].status === "rejected" &&
          responseStatus(results[8].reason) === 403
        ) {
          databaseConnection = "permission-required";
          unavailable.add("database");
        } else {
          databaseConnection = "unavailable";
          unavailable.add("database");
        }

        let integrationRuns: FrontendIntegrationRun[] | null = null;
        if (results[3].status === "fulfilled") {
          const connectedIntegrations = results[3].value.filter(
            (integration) => integration.status === "connected",
          );
          const runResults = await Promise.allSettled(
            connectedIntegrations.map((integration) =>
              FrontendIntegrationService.listRuns(projectId, integration.id),
            ),
          );

          if (runResults.some((result) => result.status === "rejected")) {
            unavailable.add("frontend");
          } else {
            integrationRuns = runResults.flatMap((result) =>
              result.status === "fulfilled" ? result.value : [],
            );
          }
        }

        const nextVerification: SetupVerification = {
          project: {
            ...detail.project,
            config: detail.config,
            membership: detail.membership,
          },
          config: detail.config,
          templates:
            results[4].status === "fulfilled" ? results[4].value : null,
          databaseConnection,
          tables: results[0].status === "fulfilled" ? results[0].value : null,
          readiness:
            results[1].status === "fulfilled" ? results[1].value : null,
          deployment:
            results[2].status === "fulfilled" ? results[2].value : null,
          modules: results[5].status === "fulfilled" ? results[5].value : null,
          apiKeys: results[9].status === "fulfilled" ? results[9].value : null,
          logicModules:
            results[6].status === "fulfilled" ? results[6].value : null,
          logicReadiness:
            results[7].status === "fulfilled" ? results[7].value : null,
          integrations:
            results[3].status === "fulfilled" ? results[3].value : null,
          integrationRuns,
          unavailable: Array.from(unavailable),
        };

        if (requestIdRef.current !== requestId) return;

        setVerification(nextVerification);
        setJourney(deriveProjectSetupJourney(nextVerification));

        const current = useProjectStore.getState().activeProject;
        if (current?.id === projectId) {
          useProjectStore.getState().setActiveProject(nextVerification.project);
        }
      } catch (loadError) {
        if (requestIdRef.current !== requestId) return;
        setJourney(null);
        setVerification(null);
        setError(messageFromError(loadError));
      } finally {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    journey,
    verification,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}
