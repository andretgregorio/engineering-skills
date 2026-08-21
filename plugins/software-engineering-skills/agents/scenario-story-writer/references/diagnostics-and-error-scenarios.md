# Diagnostics and Error Scenarios

Reference for the `scenario-story-writer` agent. Condensed from *Product Minded Engineer* guidance on diagnostics as a primary product interface.

## Why diagnostics matter

For many applications — forms, compilers, APIs, agents — **diagnostics are the primary interface**. Users (and autonomous agents) spend much of their time reading errors and progressing to the next fix. Marketing screenshots hide this; design must not.

Poor diagnostics cause:

- Panic and harmful recovery (refresh, duplicate submit, abandon)
- Slow, costly trial-and-error (especially for billed agents)
- Wrong-persona vocabulary ("PC Load Letter")

## Two lanes for every error

| Lane | Concerns |
|------|----------|
| **Human** | Message, tone, context, actionable next step, ontology of the persona |
| **Programmer** | Error class/code, metadata to pinpoint and automate recovery |

Always decide **who** you are talking to before drafting copy.

## Categories (pick one)

Use these to choose vocabulary and fix-time:

1. **Assertion / invariant** — unexpected state; not an end-user conversation; production sightings are emergencies
2. **Same-team developer** — internal tooling, build, tests; codebase ontology OK
3. **External developer / API consumer** — stable codes, documented metadata, no stack traces as UX
4. **End user (runtime)** — goal-oriented language; rescue path; never dump internals
5. **Admin / operator** — may get privileged next steps the end user should not

Same underlying fault can need **different messages** for admin vs end user (e.g., missing permission).

## Crafting checklist

1. **Understand the scenario** — persona + situation (write the narrative first)
2. **Provide context** — enough to know what failed relative to their goal
3. **Make it actionable** — suggest what to do; offer 1-click rescue when possible
4. **Choose codes/types carefully** — enable upstream catch-and-recover
5. **Raise at the right layer** — UI/API with intent context, not a bare syscall string
6. **Shift left** — fail early, before data loss, missed deadlines, or corruption

## Anti-patterns

| Anti-pattern | Prefer |
|--------------|--------|
| `Invalid file type` | Explain what was received, what is allowed, and how to fix (convert / re-upload) — before they refresh |
| `Error 500` / `Something went wrong` | Contextual explanation + safe next step; log internals server-side |
| Stack traces for end users | Stable code + human message; traces for operators/devs only |
| Speaking in engineer jargon to consumers | Persona ontology ("Reload tray B", not "PC Load Letter") |
| Late validation after irreversible side effects | Validate as soon as intent is known |

## Scenario writing tips for errors

- Show the **bad** product response inside the narrative ("If the system just says…") then the **good** rescue ("Instead, the system should…")
- Include **stakes** (midnight deadline, rain, money, trust) so severity is obvious
- Specify whether recovery must be **one-click**, **guided**, or **escalate-to-admin**
- For APIs, pair the human scenario with **code + metadata** so programmers can automate the same rescue
