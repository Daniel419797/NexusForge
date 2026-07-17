<!-- BEGIN:loop-engineering-agent-rules -->
# Loop Engineering Protocol

This repository should support one-prompt-to-production development. When the user gives a broad product, feature, redesign, automation, or "build X" request, run a loop-engineering workflow: ask detailed questions first, advise on options, then implement autonomously from start to finish.

## 1. Intake loop

Do not jump straight into implementation for broad or ambiguous work. First ask a structured set of questions that makes the user's vision buildable. Ask as many questions as needed, but group them so they are easy to answer.

For each major decision:

- Recommend a default choice.
- Explain briefly why that choice is better for this project than the main alternatives.
- Ask only for decisions that cannot be discovered from the repo, existing docs, or the user's prompt.
- Separate essential launch-blocking questions from optional polish questions.

Cover the relevant categories:

- Product goal, target users, job-to-be-done, and success metrics.
- MVP scope, v1 scope, future roadmap, and explicit non-goals.
- Brand, tone, visual direction, accessibility, responsive behavior, and content needs.
- User roles, authentication, authorization, onboarding, and account lifecycle.
- Data model, persistence, migrations, seed data, file storage, and backup expectations.
- Core workflows, edge cases, empty states, loading states, errors, and admin operations.
- Integrations, external APIs, webhooks, emails, payments, analytics, search, and notifications.
- Architecture, routing, rendering strategy, server/client boundaries, caching, background jobs, and realtime needs.
- Tooling and libraries, with advice on why one option fits better than others.
- Security, privacy, rate limits, abuse prevention, audit trails, and compliance constraints.
- Testing strategy, acceptance criteria, performance targets, observability, and deployment plan.
- Market-scale concerns: pricing, growth loops, SEO, onboarding funnels, instrumentation, support workflows, and operational handoff.

## 2. Decision brief

After the user answers, produce a concise decision brief before editing:

- What will be built.
- Assumptions and constraints.
- Recommended stack and library choices, with reasons.
- Architecture and data model.
- Milestones and implementation order.
- Acceptance criteria and verification plan.

Ask for confirmation only when scope is still unclear, the change is destructive, paid external services are required, or a decision would be expensive to reverse. Otherwise, proceed.

## 3. Build loop

Implement in evidence-driven loops:

1. Inspect the existing code, scripts, design system, and relevant docs.
2. For Next.js work, read the relevant guide in `node_modules/next/dist/docs/` before coding.
3. Make focused changes that match the repo's patterns.
4. Run the appropriate checks: lint, typecheck, tests, build, migrations, smoke tests, or browser verification.
5. Feed failures back into the next edit.
6. Repeat until the acceptance criteria pass or a real blocker is reached.

Prefer small reversible steps internally, but do not ask the user for every small choice once the build brief is accepted. Make conservative product and engineering decisions when details are missing, and document those assumptions.

## 4. Production handoff

For full-project or market-scale requests, finish with a production-oriented handoff:

- Files changed and key implementation details.
- Verification performed and any checks that could not be run.
- Required environment variables and deployment steps.
- Known risks, tradeoffs, and follow-up recommendations.
- A launch checklist covering analytics, monitoring, security, backups, performance, SEO, and support.

## 5. User communication

Keep progress updates concise while working. When asking intake questions, be thorough and advisory. When implementing, keep moving unless the user redirects, the work becomes unsafe, or a genuine blocker requires input.
<!-- END:loop-engineering-agent-rules -->
