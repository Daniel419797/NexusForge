"use client";

import { useState } from "react";
import { Braces, ChevronDown, Code2, Database, KeyRound, Play, RotateCcw, Save, Settings, ShieldCheck, X, Zap } from "lucide-react";
import styles from "./nexus-landing.module.css";

const navGroups = [
  ["DATA", [["Models", Database], ["Enums", Braces], ["Relations", Code2], ["Seeds", Database]]],
  ["ACCESS", [["Auth Providers", KeyRound], ["Roles & Permissions", ShieldCheck], ["API Scopes", KeyRound]]],
  ["WORKFLOWS", [["Workflows", Zap], ["Runs", Play], ["Schedules", Settings]]],
  ["GATEWAY", [["Deployments", Database], ["Versions", RotateCcw], ["Settings", Settings]]],
] as const;

export default function ControlPlane() {
  const [version, setVersion] = useState("v1.2.0");
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  return <div className={styles.console}>
    <div className={styles.consoleTop}><b>NEXUS <span>FORGE</span></b><button>acme-payments <ChevronDown /></button><button>production <i /></button><div /><button>Feedback</button><button>Docs</button><span className={styles.avatar}>A</span></div>
    <aside className={styles.consoleNav}>{navGroups.map(([group, items]) => <div key={group}><h4>{group}</h4>{items.map(([label, Icon]) => <button className={label === "Workflows" ? styles.selected : ""} key={label}><Icon />{label}</button>)}</div>)}</aside>
    <section className={styles.canvas}>
      <div className={styles.canvasHead}><div><b>payment_flow</b><span>v1.2.0</span><i>Active</i><small>Triggered by: POST /v1/payments</small></div><div><button onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 900); }}><Play />{running ? "Running…" : "Test run"}</button><button className={styles.saveButton} onClick={() => setSaved(true)}><Save />{saved ? "Saved" : "Save"}</button></div></div>
      <div className={styles.nodes}>
        <Node className={styles.greenNode} x="2%" y="20%" icon={<Zap />} title="Trigger" text="HTTP Request · POST /v1/payments" />
        <Node x="29%" y="20%" icon={<Braces />} title="Validate" text="JSON Schema · payment.schema.json" />
        <Node className={styles.greenNode} x="57%" y="20%" icon={<ShieldCheck />} title="Authorize" text="RBAC Check · role: payments.write" />
        <Node x="43%" y="51%" icon={<Database />} title="Persist" text="PostgreSQL · insert payments" />
        <Node x="36%" y="77%" icon={<Zap />} title="Emit Event" text="Realtime · payment.created" />
        <Node className={styles.greenNode} x="66%" y="77%" icon={<Code2 />} title="Notify" text="Email · receipt to customer" />
        <div className={styles.flowLine + " " + styles.lineOne} /><div className={styles.flowLine + " " + styles.lineTwo} /><div className={styles.flowLine + " " + styles.lineThree} />
      </div>
      <div className={styles.runStatus}><i /> Run 3f8c9d1a <span>Completed</span><span>412 ms</span><span>30 nodes</span></div>
    </section>
    <aside className={styles.deploy}><div className={styles.deployTitle}><b>Deploy: {version}</b><X /></div><h4>Gateway</h4><dl><dt>URL</dt><dd>https://api.acme.dev</dd><dt>Status</dt><dd className={styles.healthy}>Healthy</dd><dt>Region</dt><dd>us-east-1</dd></dl><h4>Versions</h4>{["v1.2.0", "v1.1.3", "v1.1.2"].map((v, i) => <button className={version === v ? styles.currentVersion : ""} onClick={() => setVersion(v)} key={v}><Database /> {v} {i === 0 && <small>Current</small>}</button>)}<a href="#">View all versions</a><h4>Rollback</h4><p>Rollback to a previous version.</p><select aria-label="Rollback version"><option>v1.1.3</option><option>v1.1.2</option></select><button className={styles.rollback}><RotateCcw /> Rollback gateway</button><h4>Environment</h4>{["DATABASE_URL", "JWT_SECRET", "REDIS_URL"].map(x => <div className={styles.secret} key={x}><span>{x}</span><b>••••••••••••</b></div>)}</aside>
  </div>;
}

function Node({ x, y, icon, title, text, className = "" }: {x:string;y:string;icon:React.ReactNode;title:string;text:string;className?:string}) { return <div className={`${styles.node} ${className}`} style={{ left:x, top:y }}><div>{icon}<b>{title}</b></div><small>{text}</small><i /></div>; }
