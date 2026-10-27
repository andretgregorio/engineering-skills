# Database Test Patterns

Reference knowledge for agents and skills that write, review, or place tests that touch a
database — including tests of the migrations themselves. Tests that touch a real database are
the most common source of Erratic Tests, Test Run Wars, and Slow Tests, and the hardest to
make safe for a continuous-delivery pipeline. This file covers how to **isolate**, **tear
down**, and **avoid** database state so persistence tests stay independent and repeatable.
For how to **change** a schema safely see `database-change-management.md`.

Source: Gerard Meszaros, *xUnit Test Patterns* (xunitpatterns.com) — Ch. 13 *Testing with
Databases* and Ch. 25 *Database Patterns*. Language- and engine-agnostic. Adapted and
extended from `database-test-patterns.md` in
[bdfinst/agentic-dev-team](https://github.com/bdfinst/agentic-dev-team) (MIT, © 2025
Bryan Finster).

Core principle: **a database test must leave the world exactly as it found it, and must not
collide with any other test or test run.** State that leaks across tests creates
order-dependence (Interacting Tests); state shared across concurrent runs creates Test Run
Wars. The whole game is isolation + reliable teardown — or removing the database from the
test entirely.

## Vocabulary

The patterns below lean on a few xUnit terms:

- **SUT** — the system under test.
- **Fake Object** — a working, lightweight implementation of a dependency, e.g. an in-memory
  repository that stores entities in a map. Unlike a mock it has real behaviour; unlike the
  real thing it needs no setup outside the test.
- **Fresh Fixture** — each test builds the data it needs. **Shared Fixture** — tests reuse
  data built once; an *Immutable* Shared Fixture is one no test is allowed to modify.
- **Humble Transaction Controller** — the code that begins and commits transactions is
  pulled out of the logic under test, so a test can run that logic inside a transaction it
  owns and roll it back.
- **Automated Teardown** — the test infrastructure records what each test created and
  removes it, instead of each test cleaning up by hand.

## First question: does this test need a real database at all?

Most logic that *uses* data does not need to test the *database engine*. Push the decision
down:

```
What is actually under test?
├─ Business logic that happens to read/write data
│   └─ Replace persistence with a Fake (in-memory repository / In-Memory Database).
│      Fast, deterministic, pre-merge-gate safe. This is the default.
│
├─ The mapping/queries themselves (ORM config, SQL, schema constraints)
│   └─ A real database IS the SUT — use the isolation + teardown patterns below.
│
├─ The migrations (schema evolution, backfills)
│   └─ A real database IS the SUT — see "Testing the migrations themselves".
│
└─ Stored procedures / DB-side logic
    └─ Stored Procedure Test against a real engine, isolated per run.
```

A suite that spins up the whole database to test ordinary domain logic is the **Slow Tests**
smell with a side of fragility. Reserve real-DB tests for the cases where the persistence
layer itself is the thing being verified.

**When the database is the SUT, use the production engine.** An in-memory substitute of a
*different* engine (SQLite or H2 standing in for PostgreSQL or MySQL) is a Fake for the
repository layer, not for SQL: it differs on types, constraint enforcement, locking,
transaction isolation, `JSON` support, and dialect, so a green run proves the query works on
the wrong database. Real-engine tests run against the same engine and major version as
production, typically in an ephemeral container.

## Isolation: keep test runs from colliding

| Pattern | What it does | Trade-off |
|---------|-------------|-----------|
| **Database Sandbox** | Each developer / CI runner gets its **own** database, so no two runs share rows | The baseline. Without it, concurrent runs cause Test Run Wars |
| → *Dedicated Database Sandbox* | A separate lightweight DB instance per user/runner | Most flexible (schema changes allowed); needs a per-runner instance |
| → *DB Schema per Test Runner* | One engine, a separate **schema** per runner; an Immutable Shared Fixture can live in a common schema | Cheaper; users can't diverge the structure |

A Sandbox separates *runs* from each other; it does **not** make the tests *within* a run
independent — that still requires a Fresh Fixture per test plus the teardown below.

Modern realisations of a Dedicated Database Sandbox:

- **Ephemeral containers** (Testcontainers or a CI service container) give each run a
  disposable instance of the production engine. Start one per run, not per test — start-up
  cost dominates otherwise.
- **Parallel workers need their own sandbox too.** A test runner with N workers is N
  concurrent runs; give each worker its own database or schema, keyed on the worker ID.
- **Template databases** make per-worker databases cheap: migrate once into a template, then
  clone it per worker (PostgreSQL `CREATE DATABASE … TEMPLATE …`) instead of re-running
  every migration.

## Teardown: undo what the test did

Pick the cheapest teardown that fully restores state. Prefer rollback; fall back to
truncation.

| Pattern | How it cleans up | Use when | Caveats |
|---------|------------------|----------|---------|
| **Transaction Rollback Teardown** | Run the whole test in a transaction; roll back at the end so nothing commits | A Fresh-Fixture test on an engine with rollback; **fastest** and schema-change-proof | The SUT must **never commit** — it must run inside a transaction owned by a *Humble Transaction Controller*. A stray commit silently defeats it |
| **Table Truncation Teardown** | Delete/truncate the tables the test populated | The SUT commits, or rollback isn't usable | Must truncate in FK-safe order; more teardown code to maintain |
| **Delete-by-key / scoped cleanup** | Remove just the rows this test created (often via *Automated Teardown* tracking inserted keys) | Targeted cleanup in a shared schema | Easy to miss a table → leaked state |

Rule of thumb: **Transaction Rollback Teardown** when the design permits it (and design
*toward* permitting it via a Humble Transaction Controller); **Table Truncation Teardown**
when commits are unavoidable.

Rollback teardown also hides behaviour that only appears at commit time — deferred
constraints, commit triggers, and anything another connection is meant to see. A test of
those behaviours must commit, and therefore needs truncation or a fresh database.

## Building test data

- **Build the rows each test needs, in the test.** A Test Data Builder or factory with
  sensible defaults lets a test state only the fields that matter to it. A large shared seed
  file that every test depends on becomes a General Fixture: nobody can change it without
  breaking tests they did not know relied on it.
- **Make generated values unique per test** (sequence- or UUID-based emails, codes, and
  names), so a leaked row from one test cannot collide with another's `UNIQUE` constraint.
- **Reference data the schema needs** (lookup tables, enum tables) belongs in a migration or
  an Immutable Shared Fixture, not in each test.

## Testing the schema's own rules

Constraints are behaviour. When the database is the SUT, a `NOT NULL`, `UNIQUE`, `CHECK`, or
foreign key that protects an invariant deserves a test that tries to violate it and asserts
the database refuses — that is what proves the invariant holds no matter which code path
writes the row.

## Testing the migrations themselves

Migrations are code that runs exactly once per environment, against data nobody looked at
first. They deserve their own tests, run against the production engine:

- **Empty to current.** Every migration applies cleanly from an empty database. This is the
  path CI and new environments take.
- **Round trip.** `up` → `down` → `up` leaves the schema identical to a single `up`. Compare
  a schema dump, not a hand-picked list of columns.
- **Upgrade from the previous release.** Restore the schema at the last released version,
  load representative data — including the awkward rows: `NULL`s, duplicates the new
  constraint would reject, boundary values, rows in every enum state — then apply the new
  migrations and assert on the data, not only the structure.
- **Backfills are tested like any other function.** Given these rows before, these rows
  after; run it twice and assert the second run changes nothing (idempotency); interrupt it
  half-way and assert a resumed run finishes correctly.
- **Old code against the new schema.** For an expand step, run the *previous* release's
  persistence tests against the migrated schema. That is the direct check that the change is
  backward-compatible during a rolling deploy.
- **No drift.** Assert that the schema built from migrations matches the checked-in schema
  dump or the ORM's model definition.
- **Size and lock behaviour are a later-stage concern.** How long a migration locks a table
  of a hundred million rows is not something a unit-sized test can show; rehearse it against
  production-like volume in a pre-production stage (see `database-change-management.md`).

## Stored Procedure Test

When logic lives in the database (procedures, triggers, functions), it still deserves a test:
arrange inputs in tables/parameters, invoke the procedure, verify the returned result set or
the resulting table state, then tear down (rollback or truncation). Treat the procedure as
the SUT and apply the same isolation. Note that DB-side logic is harder to keep under the
pyramid's fast layers — prefer moving non-trivial logic *out* of the database where the
team's primary tooling can test it, so the testing effort stays commensurate with the risk.

## CD pipeline placement

- A real database makes a test roughly **an order of magnitude slower** than an in-memory
  equivalent — Meszaros cites ~50× for round-trips. That cost decides pipeline stage.
- **Pre-merge gate:** Fake/in-memory persistence (deterministic, no external config). This
  is where the bulk of data-touching tests belong.
- **Later stage:** the narrow band of real-DB tests that verify mapping/schema/procedures and
  migrations, running against a per-runner Sandbox with rollback or truncation teardown.
  Teams with a fast containerised engine often run this band pre-merge too; what decides
  the stage is determinism and speed, not the word "database".
- A database test that needs a human to seed data or reset state is the **Manual
  Intervention** smell and cannot gate a pipeline — automate the setup or it doesn't ship.

## Smells this file prevents — flag these in review

| Smell | Database-specific cause | Fix direction |
|---|---|---|
| **Erratic Test — Interacting Tests** | One test's rows are visible to the next; order-dependent results | Fresh Fixture + rollback or truncation teardown |
| **Erratic Test — Test Run War** | Concurrent runs or parallel workers share one database | A sandbox per run and per worker |
| **Slow Tests** | Real database used for logic that does not need one | A Fake repository for logic; real DB only where persistence is the SUT |
| **General Fixture** | Every test depends on one large seed dump | Builders/factories; per-test data |
| **Manual Intervention** | A human seeds or resets the database before a run | Automate setup and teardown |
| **Wrong-engine Fake** | SQLite/H2 standing in for the production engine in SQL tests | Same engine and major version, ephemeral |
| **Untested migration** | A migration with no apply, round-trip, or upgrade test | The checks under "Testing the migrations themselves" |
| **Commit inside the SUT under rollback teardown** | A stray commit escapes the test transaction and leaks state | Humble Transaction Controller; or switch to truncation |

## How this connects to the rest of the knowledge base

- **`database-change-management.md`** — how to *change* a schema safely; the migration
  tests above are how a change proves it is backward-compatible and reversible.
- **`database-design-patterns.md`** — the constraints and access patterns a design commits
  to are what the schema-rule and query tests verify.
- The plugin's `test-design-reviewer` agent judges any test against Dave Farley's properties
  (atomic, repeatable, fast, …); this file supplies the database-specific reasons a test
  fails those properties and the patterns that fix them.
