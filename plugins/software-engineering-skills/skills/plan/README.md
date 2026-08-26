# Plan Skill

Phase 3 of the Spec Driven Development workflow. Turns **one approved spec into one implementation plan**: an ordered list of small tasks, each verifiable on its own, grouped into a stack of independently reviewable PRs.

```
/plan [--spec-file <spec_file>] [--ticket <ID>] [--headless]
```

## Purpose

Its readers are the engineer (human or agent) who builds the feature, the reviewer who receives the PRs, and the tester who validates them.

The plan is also **the implementation's memory**. Every task and criterion is a checkbox; the checked boxes are the record of what has actually landed, so a fresh session can pick the work up mid-flight without re-deriving it.

## When to use

A spec is approved and the work needs breaking down — "plan this", "break this down".

Not for: code, commits, or PRs; a second spec (a hole in the spec sends you back to `/specs`, it is never patched from inside the plan); or estimates and schedules. Order and dependencies, yes; story points and dates, no.

## Anatomy of a task

Nothing is optional — "none" is a valid value written out loud.

| Field | Content |
|---|---|
| ID + title | `E<n>` for Engineer tasks, `P<n>` for Product tasks, numbered once across the plan, never reused |
| Type | Engineer or Product |
| Why | One line — the user-visible outcome, or the task it unlocks |
| Spec refs | The criteria, technical notes, error rows, or monitoring rows it discharges |
| Files | `path` · new/modified/deleted · what changes — the function, endpoint, column, not "update the service" |
| Acceptance criteria | 1–3 checkboxes, observable, pass/fail. A fourth criterion means it is two tasks |
| Verification | The exact command or query per criterion, **with the expected result** |
| Automated tests | Test file · level · what it asserts · the command that runs just it, marking which goes red first |
| Test plan | Environment, preconditions, numbered steps, who runs it — or `none — covered by the tests above` |
| Notes | Ordering, flag state, reversibility |

**Product tasks additionally carry Gherkin scenarios** — written at the observable boundary, no framework, selector, or function name in the steps. On a **user-facing surface**, the set has a required shape: happy path, empty state (first-run and zero-results separately when the spec separates them), the error state per user-visible failure mode, and the keyboard-only path — or a Notes line citing where the spec marked the state not-handled.

### Engineer vs Product

The classification tells a reader what kind of proof to expect, and it is what stops product behavior from arriving hidden inside a refactor.

- **Product task** — changes what a user or calling client can observe, traces to spec criteria, gets scenarios, is what a tester validates.
- **Engineer task** — an enabler that changes no observable behavior: a seam-opening refactor, the flag before anything sits behind it, a migration, the metric the spec's monitoring requires, a characterization test. Its criteria are behavior-preserving claims and must still be verifiable. **An Engineer task that unlocks nothing is scope creep** — it belongs under `## Deferred`.

## The rules that carry the value

- **No file path you have not opened.** Every path exists (you read it) or is marked `new:`. An invented path is the single most expensive defect this document can carry.
- **Every task is verifiable by someone else** — without asking you a question. "Works correctly" and "tests pass" (which tests?) are not verifications.
- **Trace both ways.** Every spec criterion is covered by a Product task; every Product task cites its criteria; every Engineer task names what it unlocks.
- **Follow the codebase's conventions**, citing the nearest analogous feature by path.
- **The PR stack is stacked branches** — PR 2 off PR 1's head. Each PR is one theme, independently reviewable and verifiable, and safe to merge on its own. Keep it three or four deep at most; reviews land bottom-up, and reworking an early PR forces a restack of everything above it.
- **Two hard stops:** the four-part quality gate (spec conformance, files and changes, contradictions, verifiability) run by an independent read-only subagent, and human approval.

## UI features

The spec's `## UI/UX Specification` — and `ui-prototype.md` when it has one — is a **hard input**, read in step 1 alongside the acceptance criteria. It makes "the observable boundary" concrete: scenarios are written against the labels, states and controls the approved prototype shows, and a task's Files table names the components because the prototype named them.

For the *coverage* a UI scenario set owes, step 4 loads [`ux-web-patterns`](../ux-web-patterns/README.md) or [`ux-tui-patterns`](../ux-tui-patterns/README.md) and reads its acceptance-criteria template for the shape it implies — happy path, error state, empty state, keyboard accessibility. The template's Gherkin is never pasted, and it may not introduce a behavior the spec did not specify.

Two quality-gate items exist to catch what leaks here: a surface the spec specified appearing in **no** task, and a component named in the prototype appearing in no Files table.

## Using the plan during implementation

Tick a task's box only when its criteria are checked and their verification has actually been run — not when the code is written. One task is normally one commit. When reality contradicts the plan, **amend the plan and note what changed**; silent drift destroys its value as memory.

## Next

`/build`. The skill names it and stops.

Full definition: [`SKILL.md`](SKILL.md), including the document template. Running the phase by hand is described at the end of it.
