import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Database,
  GitPullRequestArrow,
  KeyRound,
  Rocket,
  Workflow,
} from "lucide-react";

import type { ProjectSetupJourney, SetupStep } from "@/lib/project-setup";

import styles from "./current-step.module.css";

const stepIcons = {
  project: Braces,
  template: Braces,
  database: Database,
  model: Braces,
  access: KeyRound,
  modules: Workflow,
  gateway: Rocket,
  frontend: GitPullRequestArrow,
};

interface CurrentStepPanelProps {
  journey: ProjectSetupJourney;
  step: SetupStep;
}

export default function CurrentStepPanel({
  journey,
  step,
}: CurrentStepPanelProps) {
  const Icon = stepIcons[step.key];
  const readyOptional = journey.backendReady && !step.required;

  return (
    <section
      className={styles.currentPanel}
      aria-labelledby="current-step-title"
    >
      <div className={styles.currentHeader}>
        <div className={styles.currentIcon}>
          <Icon aria-hidden="true" />
        </div>
        <div>
          <p className={styles.kicker}>
            {readyOptional ? "Backend ready / recommended next" : step.eyebrow}
          </p>
          <h2 id="current-step-title">{step.title}</h2>
        </div>
        <span className={styles.stepBadge}>Stage {step.number} of 8</span>
      </div>

      <p className={styles.currentDescription}>{step.description}</p>

      <div className={styles.taskSection}>
        <span>Finish this stage</span>
        <ol>
          {step.tasks.map((task, index) => (
            <li key={task}>
              <strong>{index + 1}</strong>
              <span>{task}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.reasonBox}>
        <span>Why this is next</span>
        <p>{step.why}</p>
      </div>

      <div className={styles.unlockSection}>
        <span>Completing this unlocks</span>
        <ul>
          {step.unlocks.map((unlock) => (
            <li key={unlock}>{unlock}</li>
          ))}
        </ul>
      </div>

      <div className={styles.currentFooter}>
        <div>
          <span className={styles.evidenceLabel}>Current evidence</span>
          <strong>{step.evidence}</strong>
        </div>
        <Link href={step.href} className={styles.primaryAction}>
          {step.actionLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
