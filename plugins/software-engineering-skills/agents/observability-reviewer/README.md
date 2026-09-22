# Observability Reviewer Agent

An AI agent that assesses a codebase's observability characteristics — its ability to
detect faults, triage failures, and root-cause issues — and produces prioritized,
evidence-based recommendations.

## Purpose

The agent evaluates a codebase against the framework in
[`knowledge-base/observability-engineering.md`](../../knowledge-base/observability-engineering.md):
the three (plus one) basic questions — fault detection, triage, root cause, and trend
detection — the observability pillars (metrics, logs, traces, errors/exceptions, profiling,
product analytics, security events), and known anti-patterns (unbounded cardinality,
cause-based alerting, missing correlation IDs, sensitive data leaking into logs).

It produces a single `observability-assessment.md` report ranking findings **Critical /
Moderate / Low**, each with file/line evidence and a concrete next step.

## When to Use

- Before an incident happens, to know what would (and wouldn't) be caught.
- After an incident that took too long to triage, to find the specific gap that slowed it
  down.
- When onboarding a new or legacy codebase, to understand its monitoring posture before
  changing it.
- Before scaling a service, to check whether existing metrics/alerts would still work at
  higher cardinality or throughput.

## What It Assesses

| Area | What it checks |
|------|-----------------|
| **Fault detection / triage / root cause / trend detection** | The knowledge base's four basic questions, answered Yes/Partial/No with evidence |
| **Metrics** | Presence, percentile vs. average usage, cardinality risk in labels |
| **Logs** | Structured vs. free-text, log-level discipline, correlation IDs |
| **Traces** | Presence, context propagation across services |
| **Errors/Exceptions** | Capture, stack traces, contextual data, sensitive-data risk |
| **Profiling** | Presence of continuous profiling for CPU/memory root-causing |
| **Product analytics / Security events** | Presence, where relevant to the scope |
| **Alerting** | Symptom-based vs. cause-based, SLO-backed or not |

## Knowledge Base

This agent does not carry its own catalogue — it reads the plugin-wide knowledge base at
`${CLAUDE_PLUGIN_ROOT}/knowledge-base/observability-engineering.md` at the start of every
run, so the framework stays in one place and improves for every agent that uses it.

## Output

- **`observability-assessment.md`** — executive summary, stack/tooling inventory, the four
  basic questions answered with evidence, a pillar-by-pillar table, prioritized findings,
  and a section naming what's already working.

## Boundaries

**CRITICAL: ASSESSMENT-ONLY ROLE.** This agent never modifies source code, configuration,
or instrumentation. It uses only `Read`, `Grep`, `Glob`, and `Bash`. Implementing its
recommendations is a separate, human-approved follow-up.

## Related

| Item | Relationship |
|------|-------------|
| [`observability-review`](../../skills/observability-review/README.md) skill | Dispatches this agent and is the normal way to invoke it |
| `platform-engineer` (from the `dev-team` plugin, if installed) | Owns *designing* observability (SLOs, alerting, dashboards) at implementation time; this agent *assesses* what already exists |

## Example Usage

```text
Use the observability-reviewer agent to assess the checkout service's observability
```

```text
@"observability-reviewer (agent)" what would we have missed if this incident happened again?
```
