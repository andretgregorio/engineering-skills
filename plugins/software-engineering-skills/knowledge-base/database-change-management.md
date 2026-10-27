# Database Change Management

Reference knowledge for agents and skills that plan, write, or review changes to a database
schema. This file is about **changing** a database safely while it keeps serving traffic;
for **testing** against a database see `database-test-patterns.md`, and for **choosing the
shape** of a schema in the first place see `database-design-patterns.md`.

Sources: *Continuous Delivery* (Humble & Farley), Ch. 12 *Managing Data*; *Refactoring
Databases* (Ambler & Sadalage); "Evolutionary Database Design" (Sadalage & Fowler,
martinfowler.com/articles/evodb.html); the PostgreSQL and MySQL reference manuals for the
lock behaviour below. Adapted and extended from `database-change-management.md` in
[bdfinst/agentic-dev-team](https://github.com/bdfinst/agentic-dev-team) (MIT, © 2025
Bryan Finster).

The governing rule: **a schema change must never block a deploy or a rollback.** The
application and the database evolve on independent clocks, so any single change must work
with both the old and the new application version — because during a rolling deploy, both
are running against it at the same moment.

## Everything is a versioned, scripted migration

- The database has a **version** (a row in a `schema_version` / `migrations` table). A
  migration tool (Flyway, Liquibase, `dbmate`, Atlas, Rails/Alembic/Django/EF/Prisma/Knex
  migrations) computes which scripts move the database from its current version to the
  target and runs them at deploy time.
- Every change is a **script in version control** — initialization and each migration. No
  manual SQL against any environment, including production. The scripts provision any
  database in the pipeline from empty to current.
- Each forward (roll-forward) script has a matching **roll-back script**. Test both:
  applying then reverting a migration must return the schema to its prior shape. A
  roll-back that cannot restore *data* (a `down` that re-creates a dropped column empty) is
  not a roll-back — destructive changes get their reversibility from expand/contract and
  archive tables (below), not from a `down` script.
- **An applied migration is immutable.** Once a migration has run in any shared environment,
  fix mistakes with a new migration; never edit the old one. Tools that checksum applied
  scripts (Flyway, Liquibase) fail the deploy on an edited file, and tools that don't will
  silently leave environments in different states.
- **One logical change per migration.** A migration that adds a column, backfills it, and
  adds an index is three changes with three different lock and failure profiles; bundling
  them makes the failure half-applied and the roll-back ambiguous. Engines without
  transactional DDL (MySQL, Oracle) cannot roll a half-applied migration back at all.
- **Ordering must survive parallel branches.** Sequential numbering (`V42__…`) collides when
  two branches each add migration 42; timestamped versions avoid the collision but can
  apply out of order relative to the code that needs them. Whichever the repo uses, a
  merge that lands two migrations must be checked for an order dependency between them.
- **Declarative (state-based) tools** — Atlas, SSDT, Skeema, Prisma `db push` — diff a
  desired schema against the live one and generate the change. The generated script is
  still a migration and still gets reviewed: a diff tool will happily express a rename as
  `DROP` + `ADD` and lose the column's data.
- **Detect drift.** A CI step that builds the schema from migrations and compares it to the
  checked-in schema dump or ORM model catches the hot-fix someone applied by hand.

## Expand / contract (the parallel-change pattern)

A change that would break the running application if applied in one step is split into
backward-compatible phases. This is the core technique for zero-downtime change; *Refactoring
Databases* calls the overlap the **transition period**, during which old and new structures
coexist and are kept in sync.

| Phase | What happens | Compatibility |
|-------|--------------|---------------|
| **Expand** | Add the new structure (new column/table/index) without removing the old. New and old code both work. | Deploy independently of the app |
| **Migrate** | Ship app code that writes to both old and new. Once every running version writes both, backfill; switch reads to the new structure once the backfill is verified. | Old code still works |
| **Contract** | Once no running app version references the old structure, drop it in a later release. | Only after the app no longer needs it |

Example — rename `qty` → `quantity`: add `quantity` (expand) → dual-write and backfill →
switch reads → drop `qty` in a subsequent release (contract). The rename is never a single
`ALTER ... RENAME` that breaks the deployed app.

**Count the releases with the roll-back test.** Every release must survive a roll-back to the
release before it, and a migration that runs ahead of a rollout must survive the previous
version still running. Applied to the rename of a `NOT NULL` column, the fully safe sequence
is four releases:

1. **Expand.** Migration: add `quantity`, nullable. App: write both columns, keep reading
   `qty`.
2. **Migrate.** Data migration: backfill `quantity` from `qty` — it runs only now, because
   every running version writes both and no row can be missed. Once the backfill is verified
   complete, enforce `NOT NULL` on `quantity` (the `NOT VALID` check route below) and flip a
   flag that switches reads to `quantity`; keep writing both. A roll-back to release 1 finds
   `qty` current.
3. **Contract, part one.** Migration: make `qty` nullable (or give it a default), so inserts
   that omit it succeed. App: stop writing `qty`, and tell the ORM to ignore the column if it
   caches column lists (Rails `ignored_columns`). A roll-back to release 2 is safe: release 2
   reads `quantity` and still writes `qty`, which is now merely optional.
4. **Contract, part two.** Migration: drop `qty`, after archiving it if the plan requires.
   No running or roll-back version touches it.

Each step exists because skipping it breaks a roll-back: dropping `qty` in the release that
stops writing it — even as a post-deployment migration — leaves the previous release, which
still writes `qty`, unable to insert. Collapsing two steps into one release gives up the
roll-back between them; that is a decision for a human, recorded in the plan — never a
default.

The same shape covers most breaking changes:

| Change | Expand | Migrate | Contract |
|---|---|---|---|
| Rename a column | Add new column | Dual-write, backfill, switch reads | Stop writing and relax the old column; drop it a release later |
| Change a column's type | Add a column of the new type | Dual-write with conversion, backfill, switch reads | Stop writing and relax the old column; drop it a release later |
| Add a `NOT NULL` column | Add it nullable (or with a constant default) | Write it everywhere, backfill old rows | Enforce `NOT NULL` |
| Split a table / move a column | Create the new table | Dual-write, backfill, switch reads | Stop writing the old column/table; drop it a release later |
| Rename a table | Create the new table, or a view with the old name over it | Move writers, then readers | Drop the old name |
| Rename an enum / status value stored in rows | Add the new value; accept both | Write the new value, convert existing rows | Remove the old value |

Dual-writing can live in application code, a trigger, or (for reads) a view; application
code is easiest to test and reason about, triggers are the fallback when several writers
share the table and cannot all be changed together. A feature flag around the read switch
lets the switch be reverted without a deploy.

**The contract step is a separate release, not a separate commit.** It ships only once every
running version of every consumer has stopped reading the old structure — including the
version you might roll back *to*.

## Make changes reversible without data loss

| Change | Reversible approach |
|--------|---------------------|
| Drop column/table | Copy data to a temp/archive table first (preserve keys + constraints); the roll-back restores from it. Never drop in the same release that stops using it. |
| Narrow a type / add NOT NULL | Add nullable, backfill, enforce in a later release once data is clean |
| Add a constraint | Validate existing data first; add as `NOT VALID` then validate, so the lock is short |
| Destructive data fix | Snapshot affected rows before the change so the roll-back script can replay them |

For zero-downtime where transactions are in flight, prefer **cache-and-replay** or a
blue-green database (backup/restore on the standby) over an in-place destructive change.

## Lock- and load-aware DDL

A migration that is logically backward-compatible can still take production down if it
holds a heavy lock on a hot table, rewrites a large table, or saturates I/O. Before writing
DDL against a table of real size, know what lock the statement takes and whether it scans
or rewrites. The engine's documentation for that statement is the authority — behaviour
differs between engines and between versions of the same engine.

**Lock queues are the hidden hazard.** A DDL statement waiting for an exclusive lock queues
behind any long-running transaction — and every query that arrives after it queues behind
*it*. A one-millisecond `ALTER` waiting on a five-minute report blocks the table for five
minutes. Set a short lock timeout for migration sessions (PostgreSQL `lock_timeout`, MySQL
`lock_wait_timeout`) and retry, rather than queueing indefinitely.

PostgreSQL specifics worth knowing (verify against the version in use):

| Operation | Hazard | Safer form |
|---|---|---|
| `CREATE INDEX` | Blocks writes for the whole build | `CREATE INDEX CONCURRENTLY` — cannot run inside a transaction block; a failed build leaves an `INVALID` index that must be dropped and retried |
| `ADD COLUMN … DEFAULT <volatile>` (e.g. `random()`, `clock_timestamp()`) | Full table rewrite | Add without the default, backfill in batches. A non-volatile default is metadata-only since PG 11 |
| `ALTER COLUMN … TYPE` | Usually a full rewrite under an exclusive lock (binary-compatible widenings such as `varchar(n)`→`text` excepted) | Expand/contract with a new column |
| `ADD CONSTRAINT` (FK or `CHECK`) | Scans the table while holding the lock | `ADD CONSTRAINT … NOT VALID`, then `VALIDATE CONSTRAINT` in a separate statement (weaker lock) |
| `SET NOT NULL` | Scans the table under an exclusive lock | Add `CHECK (col IS NOT NULL) NOT VALID`, validate it, then `SET NOT NULL` — PG 12+ skips the scan when a valid check proves it |
| Adding a foreign key | The referencing column is not indexed automatically | Index the referencing column (concurrently) unless deletes/updates on the parent are known to be rare |

MySQL/InnoDB: prefer `ALGORITHM=INSTANT` where the operation supports it — a metadata-only
change. `INPLACE` avoids blocking writes but often still rebuilds the table, and replicas
apply the DDL serially, lagging for as long as it runs. State the algorithm and lock
explicitly (`ALGORITHM=INSTANT`, or `ALGORITHM=INPLACE, LOCK=NONE`) so the statement fails
instead of silently falling back to a blocking table copy. For large tables with replicas, or
operations that are not online, use an online schema-change tool (`gh-ost`,
`pt-online-schema-change`).

## Data migrations are not schema migrations

- **Separate them.** Schema changes are fast and transactional where the engine allows;
  backfills touch every row and are neither. A backfill inside the DDL migration holds its
  locks for the length of the backfill.
- **Batch, throttle, and make it resumable.** Update in bounded batches keyed on the primary
  key, commit per batch, and pause between batches so replicas keep up. The job must be
  safe to stop and restart — idempotent per row (`WHERE new_col IS NULL`), not "run once".
- **Large backfills belong in a background job** the release can start and monitor, not in a
  migration the deploy waits on.
- **Don't import application models into migrations.** A migration runs against the schema
  *as it was at that version*; the model reflects the schema as it is today. Use plain SQL
  or the framework's historical-model facility (Django's `apps.get_model`, a model class
  defined inside the Rails migration).

## Decouple database change from application change

- Design the app so the database can migrate **independently** of the app upgrade — the
  schema is at a version the current *and* next app version both accept.
- Let the data owner (DBA or the owning team) evolve the schema incrementally; the app does
  not assume the two deploy atomically.
- **Run migrations as their own deploy step**, before the new application version rolls out
  (for expand changes) — not at application start-up, where several replicas race to apply
  them and a slow migration fails health checks.
- For shared or orchestrated databases, rehearse the change in a production-like (SIT)
  environment before production, and rehearse it against production-like **volume** — a
  migration's lock and run time on 1,000 rows says nothing about 100 million.
- A database shared by several applications is an integration point: every consumer is
  part of the compatibility window, and the contract step waits for the slowest of them.
  Prefer one owning service per schema; where sharing is unavoidable, expose a view or API
  as the contract rather than the tables.

## Detection — flag these in review

| Signal | Risk | Fix direction |
|--------|------|---------------|
| A migration that `DROP`s or `RENAME`s a column/table referenced by the same release's app code | Breaks running app during rollout; blocks rollback | Split into expand/contract across releases |
| A roll-forward script with no roll-back script | Cannot roll back the release | Author the paired reversal; test it |
| `NOT NULL` / new constraint added without a backfill step | Migration fails or locks on real data | Add nullable → backfill → enforce later |
| App code and schema assumed to deploy atomically (read of a column added in the same deploy) | Old app instances error mid-rollout | Make the change backward-compatible (expand first) |
| Manual SQL in a runbook instead of a versioned script | No audit trail, not reproducible, drifts across environments | Move into a migration script in version control |
| An edited migration that has already been applied somewhere | Environments diverge; checksum failures at deploy | Revert the edit; add a new migration |
| Index built without the engine's online option on a large table | Writes blocked for the build | PostgreSQL `CONCURRENTLY`; MySQL online DDL with an explicit algorithm and lock, or `gh-ost`/`pt-online-schema-change` where replicas would lag |
| A column dropped in the same release that stops writing it | The previous release, still writing it, fails on roll-back | Stop writing and relax the column first; drop it a release later |
| Column type change or volatile default on a large table | Full rewrite under an exclusive lock | Expand/contract with a new column |
| No lock timeout on DDL against a hot table | Lock queue stalls all traffic behind a long transaction | Set a short lock timeout; retry |
| Backfill in the same transaction as DDL, or unbatched `UPDATE` over a large table | Long locks, replication lag, bloated undo/WAL | Separate, batched, resumable data migration |
| Migration imports current application models | Breaks when replayed against an older schema | Plain SQL or historical models |
| A persisted enum/status value renamed in code only | Existing rows no longer match; silent mis-routing | Expand/contract the value, convert rows in a data migration |
| Migrations run on application start-up across replicas | Concurrent attempts, failed health checks | A dedicated migration step in the pipeline |

## How this connects to the rest of the knowledge base

- **`database-test-patterns.md`** — how to *test* against a database, including how to test
  the migrations themselves (round-trip, upgrade-from-previous-release, drift).
- **`database-design-patterns.md`** — what a good target schema looks like; this file is
  how to get from the current schema to that one without an outage.
- Expand/contract is the data-tier counterpart of decoupling deploy from release: blue-green
  and canary deployments assume the schema is compatible with every version running side by
  side, and feature flags are how the read switch in the migrate phase is made reversible.
