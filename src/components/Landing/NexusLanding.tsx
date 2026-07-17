"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDot,
  Code2,
  Database,
  GitPullRequest,
  Menu,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import ControlPlane from "./ControlPlane";
import styles from "./nexus-landing.module.css";

const nav = [
  ["Platform", "#platform"],
  ["Data & APIs", "#data"],
  ["Workflows", "#workflows"],
  ["Frontend Wiring", "#wiring"],
  ["Docs", "#docs"],
];
const stages = [
  ["01", "MODEL", "Define your data models", Database],
  ["02", "SECURE", "Scope APIs with auth & RBAC", ShieldCheck],
  ["03", "AUTOMATE", "Build workflows with triggers & actions", Zap],
  ["04", "DEPLOY", "Deploy gateway with versioned rollback", Boxes],
  ["05", "WIRE", "Connect your frontend via approved PR", Code2],
] as const;

export default function NexusLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          NEXUS <span>FORGE</span>
        </Link>
        <span className={styles.controlLabel}>THE FORGE CONTROL ROOM</span>
        <nav className={styles.nav}>
          {nav.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className={styles.auth}>
          <Link href="/login">Login</Link>
          <Link className={styles.primarySmall} href="/register">
            Create project <ArrowRight />
          </Link>
        </div>
        <button
          className={styles.menu}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        {menuOpen && (
          <div className={styles.mobileNav}>
            {nav.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Link href="/login">Login</Link>
            <Link href="/register">Create project</Link>
          </div>
        )}
      </header>

      <main id="main-content">
        <section className={styles.hero} id="platform">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>VERSIONED BACKEND INFRASTRUCTURE</p>
            <h1>
              COMPOSE YOUR BACKEND.
              <br />
              KEEP YOUR INFRASTRUCTURE.
              <br />
              <span>SHIP A VERSIONED API.</span>
            </h1>
            <p className={styles.lede}>
              Model data, secure project-scoped APIs, automate workflows, and
              wire your frontend from one control plane.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/register">
                Create your project <ArrowRight />
              </Link>
              <a className={styles.secondary} href="#control-plane">
                Explore the control plane
              </a>
            </div>
          </div>
          <SystemStatus />
        </section>

        <div className={styles.stages} id="data">
          {stages.map(([num, title, text, Icon]) => (
            <article key={num}>
              <Icon />
              <div>
                <b>{num}</b>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <section id="control-plane">
          <ControlPlane />
        </section>

        <section className={styles.controlStory} id="workflows">
          <div className={styles.sectionIntro}>
            <h2>
              ONE CONTROL PLANE.
              <br />
              <span>YOUR INFRASTRUCTURE.</span>
            </h2>
            <p>
              Teams stitch together the same backend building blocks. Nexus
              Forge unifies them—without taking ownership of your data or
              runtime.
            </p>
          </div>
          <div className={styles.compare}>
            <div>
              <h3>The usual way</h3>
              <p>Many tools. Many handoffs. More risk.</p>
              {[
                "Database & Migrations",
                "Auth & Permissions",
                "API Layer",
                "Business Workflows",
                "Realtime & Events",
                "Versioning & Rollback",
                "Gateway & Deploy",
                "Frontend Integration",
              ].map((x) => (
                <div className={styles.stackRow} key={x}>
                  <CircleDot />
                  {x}
                </div>
              ))}
            </div>
            <div className={styles.forgeMark}>NF</div>
            <div>
              <h3>With Nexus Forge</h3>
              <p>One control plane. Clear flow.</p>
              {[
                "Model data",
                "Secure APIs",
                "Automate workflows",
                "Deploy gateway",
                "Wire your frontend",
              ].map((x, i) => (
                <div className={styles.flowRow} key={x}>
                  <span>{i + 1}</span>
                  <div>
                    <b>{x}</b>
                    <small>
                      {
                        [
                          "PostgreSQL / Supabase / MSSQL / MongoDB",
                          "JWT / OAuth / RBAC · Project scopes",
                          "Triggers, actions, AI providers, realtime",
                          "Versioned releases · Rollback",
                          "Scanned repo · Validated · Draft PR",
                        ][i]
                      }
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Wiring />

        <section className={styles.finalCta}>
          <div>
            <h2>
              YOUR STACK. YOUR RULES.
              <br />
              <span>THE BACKEND YOU CONTROL.</span>
            </h2>
            <p>
              Self-hosted control plane. Your data stays with you.
              <br />
              Compose, deploy, and evolve with confidence.
            </p>
          </div>
          <div className={styles.finalActions}>
            <Link className={styles.primary} href="/register">
              Create your project <ArrowRight />
            </Link>
            <a href="#control-plane">
              Explore the control plane <ArrowRight />
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer} id="docs">
        <div>
          <div className={styles.brand}>
            NEXUS <span>FORGE</span>
          </div>
          <small>© 2026 Nexus Forge, Inc.</small>
        </div>
        <FooterLinks
          title="PRODUCT"
          links={["Platform", "Data & APIs", "Workflows", "Frontend Wiring"]}
        />
        <FooterLinks
          title="RESOURCES"
          links={["Docs", "Guides", "API Reference", "Changelog"]}
        />
        <FooterLinks
          title="COMPANY"
          links={["About", "Security", "Privacy", "Terms"]}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubscribed(true);
          }}
        >
          <b>FOLLOW UPDATES</b>
          <label>
            <span className="sr-only">Email address</span>
            <input
              required
              type="email"
              placeholder={
                subscribed ? "Subscribed — thank you" : "you@company.com"
              }
              disabled={subscribed}
            />
            <button aria-label="Subscribe">
              <ArrowRight />
            </button>
          </label>
        </form>
      </footer>
    </div>
  );
}

function SystemStatus() {
  return (
    <aside className={styles.status}>
      <div className={styles.statusTitle}>
        <span>CURRENT SYSTEM</span>
        <b>
          <i /> All systems operational
        </b>
      </div>
      {[
        ["Active project", "acme-payments"],
        ["Environment", "production"],
        ["Gateway", "https://api.acme.dev"],
        ["Workflow runs", "30 in last 24h"],
        ["Rollback available", "v1.8.3 · 2 versions back"],
        ["Draft PRs", "1 requires review"],
      ].map(([a, b]) => (
        <div className={styles.statusRow} key={a}>
          <span>{a}</span>
          <b>{b}</b>
        </div>
      ))}
      <div className={styles.dbTags}>
        {["PostgreSQL", "Supabase", "MSSQL", "MongoDB"].map((x) => (
          <span key={x}>
            <Database />
            {x}
          </span>
        ))}
      </div>
      <div className={styles.capabilities}>
        <span>Auth: JWT / OAuth / RBAC</span>
        <span>Realtime</span>
        <span>Versioned rollbacks</span>
        <span>Draft PR</span>
      </div>
    </aside>
  );
}

function Wiring() {
  const cards = [
    [
      "Scan repository",
      "We detect your stack, routes, data fetching, and API layer.",
    ],
    [
      "Generate patch",
      "We generate a patch that wires your frontend to the new API.",
    ],
    ["Validate", "We run checks and preview the changes."],
    ["Draft PR", "We open a draft PR for human review."],
  ];
  return (
    <section className={styles.wiring} id="wiring">
      <div className={styles.sectionIntro}>
        <h2>
          FRONTEND <span>WIRING</span> THAT SHIPS
        </h2>
        <p>
          Point to your repository. We propose the changes. You review and
          merge.
        </p>
      </div>
      <div className={styles.wiringGrid}>
        {cards.map(([title, text], i) => (
          <article key={title}>
            <span className={styles.stepNum}>{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            {i === 0 && (
              <pre>
                acme-web{"\n"}└ src/{"\n"} ├ app/{"\n"} ├ api/{"\n"} └ lib/
              </pre>
            )}
            {i === 1 && (
              <pre>
                <em>- const API = old-api</em>
                {"\n"}
                <b>+ const API = api.acme.dev</b>
              </pre>
            )}
            {i === 2 && (
              <ul>
                {[
                  "Type check",
                  "Build",
                  "Basic smoke tests",
                  "Contract validation",
                ].map((x) => (
                  <li key={x}>
                    <Check />
                    {x}
                  </li>
                ))}
              </ul>
            )}
            {i === 3 && (
              <div className={styles.prCard}>
                <GitPullRequest /> Nexus Forge Bot{" "}
                <small>8 files · +102 -18</small>
                <button>Open draft PR</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div className={styles.footerLinks}>
      <b>{title}</b>
      {links.map((x) => (
        <a href="#" key={x}>
          {x}
        </a>
      ))}
    </div>
  );
}
