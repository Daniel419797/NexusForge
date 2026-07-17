import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import type { ProjectSetupJourney } from "@/lib/project-setup";

import styles from "./readiness-inspector.module.css";

interface ReadinessInspectorProps {
  journey: ProjectSetupJourney;
  projectStatus: string;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export default function ReadinessInspector({
  journey,
  projectStatus,
  refreshing,
  onRefresh,
}: ReadinessInspectorProps) {
  const blocker = journey.currentStep;

  return (
    <aside
      className={styles.inspector}
      aria-labelledby="readiness-title"
      aria-busy={refreshing}
    >
      <div className={styles.inspectorHeader}>
        <div>
          <p className={styles.kicker}>Readiness inspector</p>
          <h2 id="readiness-title">
            {journey.backendReady ? "Backend ready" : "Setup in progress"}
          </h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => void onRefresh()}
          aria-label="Refresh setup evidence"
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? styles.spinning : undefined} />
        </button>
      </div>

      <div className={styles.readinessScore}>
        <strong>{journey.journeyPercent}%</strong>
        <div>
          <span>Journey verified</span>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Backend setup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={journey.journeyPercent}
          >
            <span style={{ width: `${journey.journeyPercent}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.readinessCounts}>
        <div>
          <strong>{journey.completedCount}/8</strong>
          <span>All stages</span>
        </div>
        <div>
          <strong>
            {journey.requiredCompleted}/{journey.requiredTotal}
          </strong>
          <span>Required</span>
        </div>
        <div>
          <strong>{projectStatus}</strong>
          <span>Project state</span>
        </div>
      </div>

      <div className={styles.blockerBox}>
        {journey.backendReady ? (
          <ShieldCheck aria-hidden="true" />
        ) : (
          <CircleAlert aria-hidden="true" />
        )}
        <div>
          <span>
            {journey.backendReady ? "Release state" : "Current blocker"}
          </span>
          <strong>
            {journey.backendReady
              ? "All required backend gates passed"
              : (blocker?.title ?? "Evidence unavailable")}
          </strong>
          {blocker && !journey.backendReady && (
            <Link href={blocker.href}>Resolve blocker</Link>
          )}
        </div>
      </div>

      <div className={styles.evidenceList}>
        <span className={styles.evidenceLabel}>Setup evidence</span>
        {journey.evidence.map((item) => (
          <div
            key={item.label}
            className={`${styles.evidenceRow} ${styles[`evidence_${item.tone}`]}`}
          >
            {item.tone === "positive" ? (
              <CheckCircle2 aria-hidden="true" />
            ) : item.tone === "warning" ? (
              <CircleAlert aria-hidden="true" />
            ) : (
              <CircleDashed aria-hidden="true" />
            )}
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
