#!/usr/bin/env python3
"""Initialize an idempotent, project-local product agent team workspace."""

from __future__ import annotations

import argparse
from pathlib import Path


FILES = {
    ".ai-team/charter.md": """# Agent Team Charter

## Mission

Turn an initially incomplete product idea into an approved UI, a tested implementation, and a reviewable delivery.

## Team

- Orchestrator: owns sequencing, state, handoffs, and consolidated reporting.
- Product: clarifies the problem, scope, rules, and acceptance criteria.
- UI: designs user flows, screens, components, and all meaningful interface states.
- Developer: plans and implements the approved experience with proportionate tests.
- Tester: independently verifies behavior, regressions, and acceptance evidence.

## Human gates

1. Requirements approved
2. UI approved
3. Delivery approved

Agents may recommend decisions but never approve these gates for the user.
""",
    ".ai-team/state.md": """# Team State

- Phase: discovery
- Requirements gate: pending
- UI gate: pending
- Delivery gate: pending
- Current owner: product
- Last decision: none
- Next action: discuss the product idea and identify the first material ambiguity

## Open decisions

- None recorded yet.

## Risks

- None recorded yet.
""",
    ".ai-team/roles/product.md": """# Product Agent

Clarify before specifying. In each round, restate the current understanding, identify at most a few material ambiguities, and offer a recommendation where helpful. Own `docs/product/brief.md` and `docs/product/requirements.md`. Define users, problem, core journey, scope, exclusions, business rules, edge cases, success measures, and testable acceptance criteria. Do not invent features to make the document look complete.
""",
    ".ai-team/roles/ui.md": """# UI Agent

Translate approved requirements into a coherent user flow and inspectable interface. Own `docs/product/ui-spec.md`. Cover page inventory, navigation, responsive behavior, components, copy, accessibility, and default/loading/empty/success/error/disabled/permission states. Flag any design choice that changes product scope. Provide visual evidence suitable for user review before implementation begins.
""",
    ".ai-team/roles/developer.md": """# Developer Agent

Map approved requirements and UI to the smallest maintainable implementation. Own `docs/product/technical-plan.md`. Inspect the existing project first; preserve its conventions and unrelated changes. Document architecture, data and interface contracts, task boundaries, risks, migrations, rollback, and test strategy. Implement only approved scope and report verification evidence plus untested areas.
""",
    ".ai-team/roles/tester.md": """# Test Agent

Verify independently against requirements and UI evidence. Own the findings in `docs/product/acceptance.md`. Check core journeys, business rules, edge cases, important interface states, accessibility where relevant, and regression risk. Separate blocking failures from follow-up improvements. Never treat implementation claims as test evidence.
""",
    "docs/product/brief.md": """# Product Brief

## Idea

To be discussed.

## Target users

To be discussed.

## Problem and desired outcome

To be discussed.

## Constraints

To be discussed.
""",
    "docs/product/requirements.md": """# Product Requirements

Status: Draft

## Goal

## Users and core journey

## In scope

## Out of scope

## Rules and edge cases

## Acceptance criteria

## Open decisions

## Approval

- Requirements approved: No
""",
    "docs/product/ui-spec.md": """# UI Specification

Status: Not started

## User flow

## Screens and components

## Interface states

## Responsive and accessibility behavior

## Design evidence

## Approval

- UI approved: No
""",
    "docs/product/technical-plan.md": """# Technical Plan

Status: Not started

## Existing architecture

## Proposed changes

## Data and interface contracts

## Implementation tasks

## Test strategy

## Risks, migration, and rollback
""",
    "docs/product/acceptance.md": """# Delivery Acceptance

Status: Not started

## Acceptance evidence

## Product review

## UI review

## Test and regression review

## Known limitations

## Approval

- Delivery approved: No
""",
}

AGENTS_BLOCK = """
<!-- init-product-team:start -->
## Product agent team

This project uses the workflow in `.ai-team/charter.md`. Read `.ai-team/state.md` before product work and update it after material decisions or gates. Role briefs live in `.ai-team/roles/`; durable product artifacts live in `docs/product/`.

Do not pass the requirements, UI, or delivery gate without explicit user approval. Preserve existing project conventions and unrelated changes.
<!-- init-product-team:end -->
"""


def write_if_missing(path: Path, content: str, created: list[str], preserved: list[str]) -> None:
    if path.exists():
        preserved.append(str(path))
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    created.append(str(path))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_root", type=Path)
    args = parser.parse_args()
    root = args.project_root.expanduser().resolve()
    if not root.exists() or not root.is_dir():
        parser.error(f"project root is not a directory: {root}")

    created: list[str] = []
    preserved: list[str] = []
    for relative, content in FILES.items():
        write_if_missing(root / relative, content, created, preserved)

    agents = root / "AGENTS.md"
    if not agents.exists():
        agents.write_text("# Project Instructions\n" + AGENTS_BLOCK, encoding="utf-8")
        created.append(str(agents))
    else:
        existing = agents.read_text(encoding="utf-8")
        if "<!-- init-product-team:start -->" in existing:
            preserved.append(str(agents))
        else:
            separator = "" if existing.endswith("\n") else "\n"
            with agents.open("a", encoding="utf-8") as handle:
                handle.write(separator + AGENTS_BLOCK)
            created.append(str(agents) + " (team section appended)")

    print("Created:")
    print("\n".join(f"  {item}" for item in created) or "  none")
    print("Preserved:")
    print("\n".join(f"  {item}" for item in preserved) or "  none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
