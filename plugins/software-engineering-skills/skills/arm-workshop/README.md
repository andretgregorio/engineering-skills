# ARM Workshop Skill

A collaborative technical investigation run by a **team of specialist agents**, following Thoughtworks' Architectural Risk Management methodology. It explores solution alternatives, storms the risks, and documents the decision — **before anything is committed to**.

```
/arm-workshop [problem-description-or-feature-name]
```

## Purpose

To make an architectural decision the way a room full of engineers would: alternatives generated and argued rather than the first one taken, assumptions challenged out loud, risks scored and mitigated, and **both the chosen and the rejected paths written down with their reasoning**.

Unlike the rest of this plugin, it uses **agent teams, not subagents** — teammates message each other directly, disagree, and interrogate the human for context they cannot infer.

## When to use

- Exploring technical options for a new feature.
- Evaluating design trade-offs where the risks are architectural rather than local.
- Whenever `/specs` hits a technical note that requires weighing genuinely different designs — its output then becomes that spec's source, cited by path, rather than being re-litigated there.

## The team

| Role | Focus |
|---|---|
| Product Strategist | Product vision, mission, strategic goals, business drivers |
| Architect | Architectural characteristics, quality attributes, trade-offs |
| Domain Modeler | Domain modeling, bounded contexts, strategic design |
| Database Specialist | Data models, persistence, migrations, performance |
| API Designer | API contracts, HTTP semantics, resource modeling |
| Devil's Advocate | Challenges assumptions, tests arguments, surfaces hidden risks |

## The four ARM phases

1. **Product/Business Strategy** — vision, mission, and the top strategic goals. Architecture is not chosen before this is understood.
2. **Prioritize Architectural Characteristics** — map and rank the quality attributes that will actually decide the design.
3. **Architecture Design** — 2–3 alternatives per decision point, explored by all technical teammates; the chosen one gets a **C4 Container diagram**.
4. **Risk Storming** — every teammate identifies risks independently first, then the lead converges them and the human validates. Each risk is scored `probability × impact` (1–9): 6–9 red and must be addressed, 3–4 yellow, 1–2 monitored. Every high or medium risk needs a specific mitigation.

Then cross-cutting concerns, synthesis into the investigation document, review with the human, and team cleanup.

## What it produces

A technical investigation document — executive summary and key decisions, the four phases' outputs, the C4 diagram, the risk matrix with a risk acceptance log, technical decisions and suggested ADRs, recommended implementation order and blockers, and an appendix of participants, references, and a glossary.

## Anti-patterns it exists to prevent

Solution jumping. Circular rejection reasoning ("we rejected X because we chose Y"). Documenting only the chosen path. Deciding probability and impact without the human. Skipping phases — especially arriving at an architecture before the business strategy is understood. Identifying risks without mitigations.

## References

Loaded on demand from [`references/`](references/):

| File | Contents |
|---|---|
| [`arm-methodology.md`](references/arm-methodology.md) | The full ARM workshop guide |
| [`risk-storming.md`](references/risk-storming.md) | Step-by-step collaborative risk identification |
| [`c4-container-diagrams.md`](references/c4-container-diagrams.md) | Effective C4 Container diagrams |
| [`design-tradeoffs.md`](references/design-tradeoffs.md) | A catalog of trade-offs that recur in investigations |
| [`document-structure.md`](references/document-structure.md) | The investigation document template |

External: [Thoughtworks on ARM](https://www.thoughtworks.com/en-br/insights/blog/architecture/architectural-risk-management) · [Risk Storming](https://riskstorming.com/) · [C4 Model](https://c4model.com/) · [Agent teams](https://code.claude.com/docs/en/agent-teams).

Full definition, including the usage example and the complete document template: [`SKILL.md`](SKILL.md).
