# Observability Review Skill

Assesses **one codebase or service's** observability characteristics and returns a
prioritized, evidence-based report. Deliberately small — it dispatches a single read-only
agent and stops; it never changes code.

```
/observability-review [<path>] [--repo <path>]
```

## Purpose

Before an incident is the right time to find out whether you'd catch it — not during one.
This skill answers, with evidence rather than impression, whether a codebase can detect a
fault before a customer reports it, tell you where to look when a dependency fails, and let
you explain why once you've found it.

## What it does

1. **Resolve scope** — a file, directory, service, or the whole repository.
2. **Dispatch the [`observability-reviewer`](../../agents/observability-reviewer/README.md)
   agent** — it reads the plugin's
   [observability engineering knowledge base](../../knowledge-base/observability-engineering.md),
   inventories existing metrics/logs/traces/errors/profiling/alerting with file:line
   evidence, answers the four basic questions (fault detection, triage, root cause, trend
   detection), and ranks findings Critical / Moderate / Low.
3. **Present the report and stop** — executive summary and Critical findings inline, full
   report in `observability-assessment.md`. Nothing is fixed automatically.

## Boundaries

| It does | It never does |
|---|---|
| Reads and reports on existing instrumentation | Adds or edits metrics, logs, traces, or alerts |
| Cites `path:line` evidence for every claim | Assumes a pillar is missing without grepping for it |
| Ranks findings by risk (Critical/Moderate/Low) | Recommends a specific vendor unless one is already in use |
| Names what's already working | Reads as 100% criticism |
| Stops after the report | Acts on a finding without the human deciding to |

## Related

- [`observability-reviewer`](../../agents/observability-reviewer/README.md) — the agent this
  skill dispatches; can also be invoked directly.
- [`observability-engineering.md`](../../knowledge-base/observability-engineering.md) — the
  shared framework both use: what observability is, the three (plus one) basic questions,
  the pillars, SLIs/SLOs/alerting, and common anti-patterns.

Full definition: [`SKILL.md`](SKILL.md).
