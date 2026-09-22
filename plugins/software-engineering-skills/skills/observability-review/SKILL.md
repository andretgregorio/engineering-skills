---
name: observability-review
description: Assesses a codebase's observability characteristics — fault detection, triage, and root-cause ability across metrics, logs, traces, errors, profiling, and alerting — and returns a prioritized, evidence-based report. Dispatches the observability-reviewer agent, which is read-only and never modifies code or configuration. Use when the user asks to "assess our observability", "review our monitoring/logging setup", "how observable is this codebase", "what telemetry are we missing", or invokes /observability-review.
role: helper
user-invocable: true
argument-hint: "[<path>] [--repo <path>]"
---

# Observability Review

You are producing **one assessment** of how observable a codebase is — not implementing any
change. The assessment answers whether the team would detect a fault before a customer
does, know where to look when it happens, and be able to explain why once found.

## What this skill does not do

**It never modifies code, configuration, or instrumentation.** It reads and reports. Adding
the metrics, logs, traces, or alerts it recommends is separate, human-approved follow-up
work — normal implementation, through `/plan` and `/build` if the change is non-trivial, or
directly if it's small.

## Steps

### 1. Resolve scope

- `<path>` — a file, directory, or service to assess. Optional; default is the whole
  repository at `--repo` (or the current working directory).
- `--repo <path>` — the repository root, when it differs from the current directory.

Say what scope you resolved before dispatching the agent, so the human can redirect early if
it's wrong (e.g., "the whole monorepo" when they meant one service).

### 2. Dispatch the `observability-reviewer` agent

Hand it the resolved scope and repository path. It is read-only, reads
`${CLAUDE_PLUGIN_ROOT}/knowledge-base/observability-engineering.md` as its framework, and
returns `observability-assessment.md` — an executive summary, the stack and existing
tooling it found, the four basic questions (fault detection, triage, root cause, trend
detection) answered with evidence, a pillar-by-pillar table, and prioritized findings.

Do not pre-filter or summarize the codebase for it — it does its own inventory via `Read`,
`Grep`, `Glob`, and `Bash`, and its findings are only as trustworthy as the evidence it
gathered itself.

### 3. Present the report and stop

Show the report's executive summary and the Critical findings in your reply; point to the
full `observability-assessment.md` for the rest. Do not act on any finding unasked — a
Critical finding is still the human's call on priority and timing, not an instruction to
start editing.

If the human wants to act on specific findings, that becomes normal work from there:
small, well-scoped fixes can be done directly; anything non-trivial goes through this
plugin's own `/plan` → `/build` pipeline like any other change.
