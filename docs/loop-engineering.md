# Loop Engineering Brief

Use this document when you want to give one high-level prompt and have the agent turn it into a complete product, feature, or launch-ready workflow.

## One-prompt starter

```text
Use the loop-engineering protocol in AGENTS.md.

I want to build: [describe the product, feature, or business idea].

Ask me every important question first. For architecture, tools, UI, data, integrations, deployment, and market-scale decisions, recommend the best option and explain why. After I answer, implement the whole thing end to end, verify it, and give me a production handoff.
```

## What the agent should ask

The agent should gather enough context to avoid tiny back-and-forth implementation prompts later.

- Product: goal, target users, primary workflow, success metrics, MVP versus later versions.
- Experience: brand feel, visual references, responsive behavior, accessibility, copy tone, onboarding.
- Architecture: framework patterns, data model, server/client boundaries, caching, jobs, realtime needs.
- Tools: UI kit, database, auth, payments, email, analytics, storage, search, deployment, monitoring.
- Operations: environment variables, admin workflows, seed data, migration needs, backup and recovery.
- Quality: test strategy, acceptance criteria, performance targets, security requirements, error handling.
- Market scale: SEO, pricing, funnels, instrumentation, support, compliance, launch checklist.

## Answer format that works well

You can answer in plain language. If you are unsure, say "recommend" and the agent should choose a conservative default with reasons.

```text
Product:
- Goal:
- Users:
- MVP:

Design:
- Style:
- Examples:
- Must avoid:

Technical:
- Data:
- Auth:
- Integrations:
- Deployment:

Business:
- Pricing:
- Analytics:
- Launch deadline:
```

## Expected implementation loop

After the intake is complete, the agent should:

1. Summarize the build brief and assumptions.
2. Inspect the repo and relevant framework docs.
3. Implement the work in focused steps.
4. Run lint, typecheck, tests, build, and browser checks where applicable.
5. Fix failures using the output as feedback.
6. Finish with a concise production handoff.

## Sync into other projects

This repo includes a PowerShell sync script so the loop-engineering protocol can be reused without manually copying files.

Sync into one existing project:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-loop-engineering.ps1 -Path C:\path\to\project
```

Find Git repositories under a folder and sync each one:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-loop-engineering.ps1 -Path C:\Users\HomePC\Desktop -DiscoverRepos
```

Install a reusable global command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-loop-engineering.ps1 -InstallGlobalCommand
```

After that, run this inside any Git repo:

```powershell
git loop-engineering
```

The script only syncs the reusable loop-engineering block in `AGENTS.md`. It preserves project-specific rules, such as framework warnings, and avoids copying this repo's Next.js-specific instructions into unrelated projects.

Note: Git templates are not used because they copy files into `.git`, not into the project root where `AGENTS.md` must live.
