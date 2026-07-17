"use client";

import { useCallback, useEffect, useState } from "react";

import {
  MissionControl,
  MissionControlEmpty,
  MissionControlError,
  MissionControlSkeleton,
} from "@/components/Dashboard/MissionControl/MissionControl";
import CreateProjectDialog from "@/components/Projects/CreateProjectDialog";
import { useProjectSetup } from "@/hooks/useProjectSetup";
import {
  CREATE_PROJECT_EVENT,
  CREATE_PROJECT_PENDING_KEY,
} from "@/lib/dashboard-events";
import ProjectService from "@/services/ProjectService";
import { useProjectStore } from "@/store/projectStore";
import type { Project } from "@/types";

function projectListError(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  return "We could not load your projects. Check the API connection and try again.";
}

export default function ProjectsPage() {
  const projects = useProjectStore((state) => state.projects);
  const activeProject = useProjectStore((state) => state.activeProject);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const setup = useProjectSetup(activeProject?.id);

  const loadProjects = useCallback(
    async (preferNewProject = false) => {
      setProjectsError(null);
      const previousIds = new Set(
        useProjectStore.getState().projects.map((project) => project.id),
      );

      try {
        const nextProjects = await ProjectService.list();
        setProjects(nextProjects);

        const current = useProjectStore.getState().activeProject;
        const newlyCreated = preferNewProject
          ? nextProjects.find((project) => !previousIds.has(project.id))
          : undefined;
        const nextActive =
          newlyCreated ??
          nextProjects.find((project) => project.id === current?.id) ??
          nextProjects[0] ??
          null;

        setActiveProject(nextActive);
      } catch (error) {
        setProjectsError(projectListError(error));
      } finally {
        setLoadingProjects(false);
      }
    },
    [setActiveProject, setProjects],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const openCreateDialog = () => setCreateOpen(true);
    globalThis.addEventListener(CREATE_PROJECT_EVENT, openCreateDialog);

    if (
      globalThis.sessionStorage?.getItem(CREATE_PROJECT_PENDING_KEY) === "true"
    ) {
      globalThis.sessionStorage.removeItem(CREATE_PROJECT_PENDING_KEY);
      setCreateOpen(true);
    }

    return () => {
      globalThis.removeEventListener(CREATE_PROJECT_EVENT, openCreateDialog);
    };
  }, []);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
  };

  let content: React.ReactNode;

  if (loadingProjects || (activeProject && setup.loading)) {
    content = <MissionControlSkeleton />;
  } else if (projectsError) {
    content = (
      <MissionControlError
        message={projectsError}
        onRetry={() => {
          setLoadingProjects(true);
          void loadProjects();
        }}
      />
    );
  } else if (projects.length === 0 || !activeProject) {
    content = <MissionControlEmpty onCreate={() => setCreateOpen(true)} />;
  } else if (setup.error || !setup.journey) {
    content = (
      <MissionControlError
        message={
          setup.error ?? "No setup evidence was returned for this project."
        }
        onRetry={() => void setup.refresh()}
      />
    );
  } else {
    content = (
      <MissionControl
        projects={projects}
        activeProject={activeProject}
        journey={setup.journey}
        refreshing={setup.refreshing}
        onRefresh={setup.refresh}
        onSelectProject={handleSelectProject}
        onCreateProject={() => setCreateOpen(true)}
      />
    );
  }

  return (
    <>
      {content}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadProjects(true)}
      />
    </>
  );
}
