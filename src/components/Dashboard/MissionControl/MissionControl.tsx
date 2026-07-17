"use client";

import { AlertTriangle, Plus, RefreshCw } from "lucide-react";

import type { Project } from "@/types";
import type { ProjectSetupJourney } from "@/lib/project-setup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CurrentStepPanel from "./CurrentStepPanel";
import ProjectLedger from "./ProjectLedger";
import ReadinessInspector from "./ReadinessInspector";
import SetupRail from "./SetupRail";
import styles from "./mission-control.module.css";

interface MissionControlProps {
  projects: Project[];
  activeProject: Project;
  journey: ProjectSetupJourney;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

export function MissionControl({
  projects,
  activeProject,
  journey,
  refreshing,
  onRefresh,
  onSelectProject,
  onCreateProject,
}: MissionControlProps) {
  const currentStep =
    journey.currentStep ??
    journey.steps.find((step) => step.key === "frontend") ??
    journey.steps[0];

  return (
    <div className={styles.missionControl}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Forge Mission Control</p>
          <h1>Build the backend in the right order.</h1>
          <p className={styles.heroDescription}>
            Nexus Forge reads the project state, shows the next safe action, and
            carries the setup from workspace to a versioned API.
          </p>
        </div>

        <div className={styles.heroActions}>
          <label htmlFor="mission-project-select">Active project</label>
          <div className={styles.projectSelectRow}>
            <Select
              value={activeProject.id}
              onValueChange={(projectId) => {
                const project = projects.find((item) => item.id === projectId);
                if (project) onSelectProject(project);
              }}
            >
              <SelectTrigger
                id="mission-project-select"
                className={styles.projectSelect}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              className={styles.createAction}
              onClick={onCreateProject}
            >
              <Plus aria-hidden="true" />
              Create project
            </button>
          </div>
        </div>
      </header>

      <SetupRail steps={journey.steps} />

      <div className={styles.commandGrid}>
        <CurrentStepPanel journey={journey} step={currentStep} />
        <ReadinessInspector
          journey={journey}
          projectStatus={activeProject.status}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </div>

      <ProjectLedger
        projects={projects}
        activeProjectId={activeProject.id}
        onSelect={onSelectProject}
        onCreate={onCreateProject}
      />
    </div>
  );
}

export function MissionControlSkeleton() {
  return (
    <div className={styles.missionControl} aria-label="Loading mission control">
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonRail} />
      <div className={styles.skeletonGrid}>
        <div />
        <div />
      </div>
      <div className={styles.skeletonLedger} />
    </div>
  );
}

interface MissionControlErrorProps {
  message: string;
  onRetry: () => void;
}

export function MissionControlError({
  message,
  onRetry,
}: MissionControlErrorProps) {
  return (
    <div className={styles.missionControl}>
      <section className={styles.statePanel} role="alert">
        <AlertTriangle aria-hidden="true" />
        <p className={styles.kicker}>Mission Control unavailable</p>
        <h1>We could not verify this project&apos;s setup.</h1>
        <p>{message}</p>
        <button type="button" className={styles.createAction} onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      </section>
    </div>
  );
}

export function MissionControlEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.missionControl}>
      <section className={styles.statePanel}>
        <p className={styles.kicker}>Start the setup map</p>
        <h1>Create the project that becomes your backend.</h1>
        <p>
          The first project unlocks a guided path through storage, data models,
          access control, deployment, and frontend wiring.
        </p>
        <button
          type="button"
          className={styles.createAction}
          onClick={onCreate}
        >
          <Plus aria-hidden="true" />
          Create your first project
        </button>
      </section>
    </div>
  );
}
