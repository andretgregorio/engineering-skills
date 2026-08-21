# Scenario Story Writer Agent

A Claude Code subagent that writes **storytelling user scenarios** — rich, situated narratives that build empathy, inform technical design, and treat diagnostics as a first-class product interface.

Inspired by *Product Minded Engineer*.

## Purpose

Classic user stories (`As a… I want… so that…`) often strip away the conditions that actually dictate design: cold fingers, midnight deadlines, flaky networks, wrong file types, panic refreshes.

This agent writes scenarios like:

> Sarah is sitting in her car in a noisy parking lot… She just wants to tap her thumb, feel a quick vibration, and see her account balance immediately so she can get out of the rain.

> Marcus… accidentally drags his raw Apple Pages file into the upload box… If the system just says "Invalid file type," Marcus will panic… Instead, the system should gently catch his mistake…

## What It Produces

- **Happy-path scenarios** under realistic constraints
- **Stress / edge scenarios** (time pressure, partial knowledge, permissions, offline)
- **Diagnostic scenarios** with audience, contextual copy, codes/metadata, and shift-left notes
- **Design implications** explicitly tied to details in each narrative
- An **error taxonomy** summary for the feature

## What It Does Not Produce

- Classic `As a… I want… so that…` stories (use `user-story-writer` for that)
- Implementation code or ATDD test suites (use `atdd-developer`)

## When to Use

- You want engineers to feel friction and design for real conditions
- You are designing error, validation, or empty/failure states
- Classic stories feel too abstract for the risk or UX involved
- You need API/UI diagnostics aimed at the right persona (user vs admin vs API consumer)

## Usage

```
Task tool with:
  subagent_type: scenario-story-writer
  prompt: "Write storytelling scenarios for [feature].
           Include happy-path, stress, and diagnostic/error scenarios.
           Context: [PRD / design doc / constraints]"
```

## Templates & References

- `templates/scenario.template.md` — per-scenario structure
- `references/diagnostics-and-error-scenarios.md` — error audience categories and crafting checklist

## Related Agents

| Agent | Role |
|-------|------|
| `problem-analyst` | Clarify the problem space first |
| `scenario-story-writer` (this) | Empathy + diagnostics narratives |
| `user-story-writer` | INVEST / Gherkin vertical slices for the backlog |
| `atdd-developer` | Implement from acceptance criteria |

Typical flow: **problem-analyst** → **scenario-story-writer** (design empathy & errors) → **user-story-writer** (implementation backlog) → **atdd-developer**.

## Agent Definition

`scenario-story-writer.md` in this folder.
