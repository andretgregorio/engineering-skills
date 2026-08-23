# User Story Mapping Workshop Skill

Story maps that organize user stories spatially by activity and priority, then slice releases by **outcome** rather than by feature.

```
/user-story-mapping-workshop
```

Reference: Jeff Patton, *User Story Mapping* (2014), with outcome-based prioritization from Gothelf/Seiden and riskiest-assumption-first from Maurya.

## Purpose

To decide what ships first — and to make each release a coherent slice that moves a named metric, instead of a pile of finished features nobody can use end to end yet.

Its output is also the **slice boundary for `/specs`**: where a story map exists, one spec resolves exactly one rib. A request that spans several ribs is sent back here rather than specced as one document.

## When to use

- A feature is bigger than one vertical slice and needs breaking into releases.
- `/specs` stopped at its scope check and proposed a map.
- The backlog needs prioritizing against outcomes rather than effort.

## Anatomy

| Element | Position | Purpose |
|---|---|---|
| **Backbone** | Top row, left to right | User activities in chronological order — the spine of the journey. Aim for 4–8 |
| **Ribs** | Columns under each activity | Tasks, ordered vertically: most critical at top |
| **Walking Skeleton** | A line across all activities | The thinnest end-to-end working flow. **Not an MVP** — the minimum slice that connects *all* activities |
| **Release Slices** | Bands below the skeleton | Coherent groups, each tied to a specific outcome KPI |

Built by a team of three agents — Product Owner, Lead Product Designer, Acceptance Designer — in six steps: frame the journey (one map per persona-goal pair), map the backbone, fill the ribs, prioritize vertically, draw the skeleton, then slice into releases named by the outcome they achieve rather than the features they contain.

## Prioritization

**Value × Urgency ÷ Effort**, each on a 1–5 scale — value as outcome impact, urgency as time-sensitivity, effort as complexity. Ties break: walking skeleton first, then riskiest assumption, then highest value.

Riskiest-assumption-first, from *Running Lean*: validate what could kill the product before optimizing what improves it. So the order is skeleton, then the release targeting the riskiest assumption, then the highest-value outcome, then the rest by score.

Every slice maps to the logic-model chain: **release → output (features built) → outcome (behavior change: who does what, by how much) → impact (business KPI moved)**.

## What it produces

- `story-map.md` — persona, goal, backbone table, the walking skeleton, and the release slices with their KPIs and rationale.
- `prioritization.md` — release priority table and backlog suggestions with outcome links and dependencies.

## Anti-patterns it exists to prevent

Feature-first slicing (Release 1 = all of Feature A) — slice *across* features instead. No skeleton, or a fat one crammed with extras. Effort-based priority, which delivers easy-but-low-value work early. Orphan stories with no outcome link. Activity gaps that break end-to-end coherence.

Full definition, including both templates: [`SKILL.md`](SKILL.md).
