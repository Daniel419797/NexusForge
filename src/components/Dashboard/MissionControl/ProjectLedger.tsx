import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus } from "lucide-react";

import type { Project } from "@/types";

import styles from "./project-ledger.module.css";

interface ProjectLedgerProps {
  projects: Project[];
  activeProjectId?: string;
  onSelect: (project: Project) => void;
  onCreate: () => void;
}

function formatDate(value: string | undefined) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProjectLedger({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
}: ProjectLedgerProps) {
  return (
    <section className={styles.ledger} aria-labelledby="project-ledger-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>Project ledger</p>
          <h2 id="project-ledger-title">Your backend workspaces</h2>
        </div>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={onCreate}
        >
          <Plus aria-hidden="true" />
          New project
        </button>
      </div>

      <div className={styles.ledgerList}>
        {projects.map((project) => (
          <article
            key={project.id}
            className={`${styles.ledgerRow} ${
              project.id === activeProjectId ? styles.ledgerRowActive : ""
            }`}
          >
            <button
              type="button"
              className={styles.projectIdentity}
              onClick={() => onSelect(project)}
            >
              <span className={styles.projectMark}>
                <FolderKanban aria-hidden="true" />
              </span>
              <span>
                <strong>{project.name}</strong>
                <small>{project.category || "Custom backend"}</small>
              </span>
            </button>

            <div className={styles.ledgerMeta}>
              <span className={styles.statusPill} data-status={project.status}>
                {project.status}
              </span>
              <span>
                <small>Created</small>
                {formatDate(project.createdAt)}
              </span>
              <span>
                <small>Gateway</small>
                {project.apiUrl ? "Assigned" : "Not deployed"}
              </span>
            </div>

            <Link
              href={`/projects/${project.id}`}
              className={styles.openProject}
              onClick={() => onSelect(project)}
            >
              Open
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
