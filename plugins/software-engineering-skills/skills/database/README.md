# Database Skill

The **single entry point** for database work. It reads the request, decides which of the three
database skills handles it, hands over, and stops.

```
/database [<request in plain words | schema-design.md | migration-plan.md | migration file | PR number | branch>] [--repo <path>] [--ticket <ID>] [--store <engine>] [--consumers <path,path>] [--headless]
```

## The three skills it routes to

| Skill | Handles | Produces |
|---|---|---|
| [`schema-design`](../schema-design/README.md) | Data with no schema yet — new entities, a new solution, which model or datastore fits | `schema-design.md`, approved by the human |
| [`schema-migration`](../schema-migration/README.md) | A change to a schema that already exists — and implementing an approved design | Migrations, one release phase at a time |
| [`schema-review`](../schema-review/README.md) | A change or proposal someone has already made | `approve` / `revise` / `block`, with findings |

None of the three is a slash command, which keeps the interface to one. Claude still reaches
them directly when a conversation calls for one — a new implementation that stores data, a
change to an existing table, migrations about to be committed — without going through this
router.

## How it decides

Input document first, then whether the named structures already exist, then intent:

| Signals | Route |
|---|---|
| `migration-plan.md` | schema-migration — next phase |
| `schema-design.md`, `Status: approved` | schema-migration — implement it |
| `schema-design.md`, draft, "review it" / "rework it" | schema-review / schema-design |
| A feature description or spec introducing data with no schema yet | schema-design |
| PR, branch, range, or migration file to check | schema-review |
| A change to tables, columns, indexes, or values that already exist | schema-migration |
| Data or entities that don't exist yet | schema-design |
| No argument | migration changes in the working tree → schema-review; otherwise it asks |

It **greps the schema** before deciding — "add subscriptions to accounts" is a migration if it
is one column, and a design if it is a new entity. A request that needs both goes to
schema-design first, whose Evolution section schema-migration then implements.

## Boundaries

| It does | It never does |
|---|---|
| Names the evidence for its route | Route on a keyword alone |
| Asks one question when two routes are plausible | Break a tie itself |
| Passes flags through — `--store` only to design, `--consumers` only to review | Drop an unsupported flag silently |
| Invokes exactly one skill, once | Design, migrate, or review anything itself |

Full definition: [`SKILL.md`](SKILL.md).
