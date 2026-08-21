# Scenario Template

Use this template for every scenario. Scenarios are storytelling narratives — NEVER "As a… I want… so that…".

---

## SC-XXX: [Short title — names the moment, not the feature]

**Type**: `happy-path` | `stress` | `diagnostic`

**Audience** (diagnostic only): `end-user` | `admin` | `same-team-dev` | `api-consumer` | `assertion`

**Persona**: [Named person + one-line situation]

---

### Narrative

> [One or two paragraphs. Include: named person, setting, constraints (time/device/network/emotion), intent, friction or failure, and what good product behavior looks like. Match the Sarah / Marcus voice.]

---

### Observable outcome

- **If success:** [What the person sees/feels/accomplishes]
- **If rescue:** [How the product catches the mistake and lets them continue]
- **Must not happen:** [Panic refresh, silent data loss, opaque Error 500, etc.]

---

### Design implications

Tie each bullet to a detail from the narrative:

- [e.g., raining + cold fingers → biometric-first, large targets, minimal typing]
- [e.g., deadline in 5 minutes → preserve draft/progress across validation errors]
- [e.g., flaky parking-lot network → short timeouts, clear offline/retry, no false "wrong password"]

---

### Diagnostics (required for `diagnostic`; recommended whenever failure is central)

- **User-facing message (draft):** [Plain language in the persona's ontology; actionable]
- **Why this message:** [What misunderstanding or panic it prevents]
- **Error class/code:** [Stable identifier for programmers / API consumers, if any]
- **Metadata for recovery:** [Fields upstream needs to automate a response]
- **Raise at:** `UI` | `API` | `both` — with full context of the user's intent
- **Shift-left opportunity:** [Validate earlier to prevent irreversible harm]

---

### Optional acceptance inspiration

If useful for downstream ATDD, suggest 1–2 observable checks in plain language (not mandatory Gherkin):

- When [situation], the product [behavior]
- When [mistake], the product [rescue] instead of [harmful default]
