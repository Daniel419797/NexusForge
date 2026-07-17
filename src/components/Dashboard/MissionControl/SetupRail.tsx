import Link from "next/link";
import { Check, CircleAlert, CircleDashed, LockKeyhole } from "lucide-react";

import type { SetupStep } from "@/lib/project-setup";

import styles from "./setup-rail.module.css";

interface SetupRailProps {
  steps: SetupStep[];
}

function getStatusLabel(step: SetupStep) {
  if (step.status === "complete") return "Verified";
  if (step.status === "current") return "Do this next";
  if (step.status === "available") return "Optional";
  if (step.status === "unverified") return "Unavailable";
  return "Locked";
}

function StepIcon({ step }: { step: SetupStep }) {
  if (step.status === "complete") return <Check aria-hidden="true" />;
  if (step.status === "unverified") return <CircleAlert aria-hidden="true" />;
  if (step.status === "locked") return <LockKeyhole aria-hidden="true" />;
  return <CircleDashed aria-hidden="true" />;
}

function StepContent({ step }: { step: SetupStep }) {
  return (
    <>
      <span className={styles.railMarker}>
        <StepIcon step={step} />
      </span>
      <span className={styles.railCopy}>
        <span className={styles.railNumber}>
          {String(step.number).padStart(2, "0")}
        </span>
        <span className={styles.railTitle}>{step.shortTitle}</span>
        <span className={styles.railStatus}>{getStatusLabel(step)}</span>
      </span>
    </>
  );
}

export default function SetupRail({ steps }: SetupRailProps) {
  return (
    <section aria-labelledby="setup-map-title" className={styles.railSection}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>Backend setup map</p>
          <h2 id="setup-map-title">From project to production</h2>
        </div>
        <p>
          Follow the highlighted action. Later stages unlock as evidence is
          verified.
        </p>
      </div>

      <ol className={styles.railList}>
        {steps.map((step) => {
          const className = `${styles.railStep} ${styles[`rail_${step.status}`]}`;
          const canOpen = step.status !== "locked";

          return (
            <li key={step.key}>
              {canOpen ? (
                <Link
                  href={step.href}
                  className={className}
                  aria-label={`${step.title}: ${getStatusLabel(step)}. ${step.evidence}`}
                >
                  <StepContent step={step} />
                </Link>
              ) : (
                <div className={className} aria-label={`${step.title}: locked`}>
                  <StepContent step={step} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
