---
name: init-product-team
description: Initialize or resume a reusable product-development agent team inside the current project. Use when starting a project, setting up product/UI/development/testing agents, or continuing the staged workflow from requirements discussion through UI approval, implementation, testing, and delivery.
---

# Initialize Product Team

Create a project-local collaboration environment, then run the product workflow from its saved state.

## Initialize

1. Resolve the project root from the user's explicit path; otherwise use the current working directory. Never initialize a parent directory merely because it contains the project.
2. Inspect existing `AGENTS.md` and `.ai-team/` before writing.
3. Run `python3 scripts/init_team.py <project-root>`.
4. Report created and preserved files. Do not overwrite project content unless the user explicitly requests a reset.
5. Read `.ai-team/state.md`, `.ai-team/charter.md`, and the role files relevant to the current phase.

If `.ai-team/` already exists, treat this as resume rather than initialization. Preserve decisions and continue from the first incomplete gate.

## Operate the Team

The root agent is the orchestrator. Create specialist subagents only when the current phase has independent work for them. Use the role briefs under `.ai-team/roles/` as their task context. Do not create all specialists merely to keep them idle.

The normal sequence is:

1. Product conversation: the product agent discusses the idea with the user, summarizes its current understanding, and asks only questions that materially affect direction.
2. Requirements gate: save the agreed scope and testable acceptance criteria in `docs/product/requirements.md`. Stop for user confirmation before freezing the requirement.
3. UI exploration: the UI agent produces the user flow, page/state inventory, and an inspectable UI or prototype. It must not add unapproved product scope.
4. UI gate: capture approval or requested revisions. Do not begin full implementation before approval, except for explicitly authorized technical spikes.
5. Technical plan: the developer maps the approved requirement and UI to architecture, tasks, risks, and a test strategy in `docs/product/technical-plan.md`.
6. Build and test: the developer implements; the tester independently checks acceptance criteria, regression risk, and important UI states.
7. Delivery gate: product, UI, and testing findings are summarized in `docs/product/acceptance.md`; the user makes the final acceptance decision.

Update `.ai-team/state.md` after every gate or material decision. Keep detailed product truth in documents, not only in chat history.

## Gates and Boundaries

- The three human gates are `requirements_approved`, `ui_approved`, and `delivery_approved`.
- A specialist may recommend a gate result but may not approve its own work on the user's behalf.
- Parallelize only work without unresolved dependencies. Product definition precedes committed UI; approved UI precedes full implementation.
- Ask the user only about decisions that change scope, experience, cost, risk, or irreversible external state.
- Local inspection, documentation, implementation, and non-destructive tests are allowed when they are part of the requested phase.
- Do not deploy, publish, purchase, delete material data, or write to external systems without matching user authorization.
- When an existing project has its own conventions, adapt the templates to it rather than replacing those conventions.

## User-Facing Status

At each handoff, state the current phase and gate, completed evidence, open decisions or risks, and the next recommended action.
