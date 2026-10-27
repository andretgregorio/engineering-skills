# Database Design Patterns

Reference knowledge for agents and skills that design a data model or review one. It covers
the modeling patterns — what each is for, when it fits, the rules that make it work, and the
mistakes that break it — and how to choose between them. For **changing** an existing schema
safely see `database-change-management.md`; for **testing** against a database see
`database-test-patterns.md`.

Numbers below (size limits, partition targets, default thresholds) are quoted from the
vendor's documentation at the time of writing. They change between versions: **verify a
number against the documentation for the version in use before a design depends on it.**
Sources are listed at the end.

---

## Start from the workload, not the technology

A data model is an answer to a workload. Settle these before choosing a pattern — the first
question with a clear answer usually decides:

1. **Is this a system of record taking transactional writes, or a store for analysis?**
   Transactional → relational (or an aggregate store, below). Analytical → dimensional,
   columnar, possibly with data vault underneath.
2. **Are the access patterns known, enumerable, and stable?** Key-value and wide-column
   designs need the queries up front — AWS: *"you shouldn't start designing your schema for
   DynamoDB until you know the questions it will need to answer."* Unknown or fast-changing
   queries favour relational, or a document store with secondary indexes.
3. **Is there a natural aggregate** — a unit that is read and written together, bounded in
   size, with few invariants spanning units? Yes → document or key-value fit. Many-to-many
   relationships everywhere → relational, or graph if traversal depth is variable.
4. **What must be consistent with what?** Multi-entity ACID invariants → relational.
   Single-aggregate atomicity → document or key-value. Eventual consistency acceptable →
   wide-column.
5. **What is the read/write shape?** Write-heavy, append-only, time-ordered → wide-column or
   time-series. Point lookups → key-value or document. Scans and aggregates over few columns
   of many rows → columnar. Variable-depth paths → graph.
6. **Does the past need to be queryable as it was?** → temporal tables, SCD2, satellites, or
   event sourcing, depending on where and why.
7. **What does the team already run?** Every additional datastore is a cost in operations,
   skills, and consistency between copies.

**Default: a well-indexed, normalized relational database.** With recursive CTEs, native
partitioning, `jsonb`, and materialized views it serves most workloads. Adopt another pattern
when there is a **named access pattern or requirement it serves that the relational design
measurably fails** — not because the domain sounds like a graph, or the data "is JSON".

**Key ordering points in opposite directions in different families.** In distributed
key-value and wide-column stores the key decides *which node* holds the data, and it must
spread the **current** writes across many values. How that fails depends on the partitioning
scheme:

- **Hash-partitioned** (DynamoDB, Cassandra, ScyllaDB): the whole partition key is hashed, so a
  sequential ID spreads evenly. The hazard is a key whose *current* writes share few values —
  a status, today's date, a coarse time bucket on its own.
- **Range-ordered** (Bigtable, HBase): rows are stored in key order, so a key that *leads*
  with a timestamp or sequence sends every new write to the last node. Lead with a
  high-cardinality entity ID; put time after it.

In columnar analytical stores (ClickHouse, Snowflake, Redshift) the sort key decides
*compression and block skipping* inside a table: order key columns from **low to high**
cardinality. Mixing these rules up is a common, expensive mistake.

| Pattern | Choose when | Avoid when |
|---|---|---|
| Relational (normalized) | System of record; multi-entity invariants; queries not all known | Analytics over long history; BI-facing schema |
| Dimensional | BI and analysts over known business processes | OLTP writes; integrating dozens of volatile sources |
| Data vault | Many changing sources, auditability, long-lived programme, automation | Few stable sources; short projects; querying it directly |
| Document | Aggregates read and written whole; variable shapes | Heavy many-to-many; cross-aggregate analytics; multi-document invariants |
| Key-value / single-table | Known, stable key and range lookups at large scale | Unknown or changing access patterns; ad-hoc queries |
| Wide-column | Very high write throughput; known per-key range reads; multi-DC | Ad-hoc queries, joins, delete-heavy queues |
| Columnar analytical | Scans and aggregates over billions of rows | Point updates; high-rate single-row lookups |
| Time-series | High-ingest, time-ranged reads, retention horizon | A few thousand rows a day — an indexed table suffices |
| Graph | Variable-depth traversal and path finding, online | Bulk aggregation; fixed-depth hierarchies; single-entity CRUD |
| Event sourcing | Audit/replay/temporal reconstruction is a business requirement for an aggregate | Plain CRUD; MVPs; teams new to event-driven design |

---

## Relational modeling (normalized OLTP)

Entities and relationships go into normalized tables so each fact is stored once, and
invariants are declared as constraints so the database enforces them for every writer —
including the one nobody has written yet.

### Normal forms, in practice

| Form | Rule | Anomaly it prevents |
|---|---|---|
| 1NF | One value per column; no repeating groups (`phone1..3`, CSV in a column) | Cannot constrain, index, or join on the parts |
| 2NF | No non-key column depends on only *part* of a composite key | Update (copies drift), insert (cannot record the independent fact), delete (losing the last row loses the fact) |
| 3NF | No non-key column depends on another non-key column | The same three — every non-key column is a fact about "the whole key, and nothing but the key" (Kent) |
| BCNF | Every determinant is a candidate key | Differs from 3NF only with overlapping candidate keys; a BCNF decomposition can lose a dependency, so 3NF plus an explicit constraint is acceptable |

**Design OLTP to 3NF/BCNF by default.** Denormalize only when all three hold: a named read
path, a measured problem, and a mechanism that keeps the copy consistent. Prefer, in order:
a covering or composite index → a generated column → a materialized view → a
trigger-maintained summary → a copy maintained by application code. Storing
`order_line.unit_price` at purchase time is **not** denormalization — it is a different fact:
the price as it was then.

### Keys

- **Surrogate primary key plus a `UNIQUE NOT NULL` natural key** is the default. Natural keys
  change and carry business rules. They are fine as the primary key for stable standard codes
  (ISO currency, country) and for junction tables (`PRIMARY KEY (a_id, b_id)`).
- PostgreSQL: `bigint GENERATED ALWAYS AS IDENTITY`, not `serial`.
- **UUIDv7** (RFC 9562; `uuidv7()` native in PostgreSQL 18) when IDs are minted outside the
  database, merged across shards, or exposed publicly. Its time ordering gives index locality
  that random UUIDv4 lacks. Store it in the native 128-bit type, never as text. It embeds its
  creation time — use v4 where that leaks something sensitive. ULIDs have the same layout and
  also belong in a `uuid` column.
- Tenant-scoped tables key on `(tenant_id, id)` (see multi-tenancy).

### Constraints are the schema's job

- `NOT NULL` unless absence is meaningful. A `CHECK` passes when its expression is `NULL`, so
  pair them. A `CHECK` cannot reference other rows or tables.
- `UNIQUE` treats `NULL`s as distinct by default (`NULLS NOT DISTINCT` in PostgreSQL 15+).
- Every foreign key gets an explicit `ON DELETE`. **PostgreSQL does not index the referencing
  column** — index it.
- "No overlap" rules are exclusion constraints:
  `EXCLUDE USING gist (room_id WITH =, during WITH &&)` (PostgreSQL needs the `btree_gist`
  extension for the scalar `room_id`).
- An invariant enforced only in application code holds only until the second writer arrives.

### Indexes follow access patterns

List the hot queries with their `WHERE`, `JOIN`, and `ORDER BY` first. In a composite index,
put equality columns before range columns; the leftmost prefix is what makes it usable, so
reorder one index rather than adding a near-duplicate. Every index taxes every write. Partial
indexes serve hot subsets; GIN serves `jsonb` containment.

### Naming and types

Unquoted `lower_snake_case`; singular or plural tables, consistently; foreign keys
`<entity>_id`; timestamps `*_at` as `timestamptz`; booleans `is_*`/`has_*`; constraints named
explicitly so migrations can refer to them. Money as `numeric` or integer minor units, never
floating point or PostgreSQL's `money`. `text` with a `CHECK` rather than `varchar(n)`.

```sql
CREATE TABLE customer_order (
  order_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer ON DELETE RESTRICT,
  status      text   NOT NULL CHECK (status IN ('PLACED','PAID','SHIPPED')),
  placed_at   timestamptz NOT NULL,
  total_cents bigint NOT NULL CHECK (total_cents >= 0)
);
CREATE INDEX customer_order_customer_placed_idx
  ON customer_order (customer_id, placed_at);   -- FK index + "a customer's orders by date"
```

### Relational sub-patterns

**Hierarchies.**

| Design | Children | Subtree | Move subtree | Referential integrity |
|---|---|---|---|---|
| Adjacency list (`parent_id`) + `WITH RECURSIVE` | Easy | Easy with a recursive CTE | Easy | Yes |
| Closure table `(ancestor, descendant, depth)` | Easy | Easy | Rewrite the subtree's paths | Yes |
| Materialized path (PostgreSQL `ltree`) | Hard | Easy | Rewrite every descendant | No |
| Nested sets (`lft`/`rgt`) | Hard | Easy | Hard | No |

Default to the adjacency list with a recursive CTE bounded by depth and protected against
cycles (`CYCLE … SET … USING` in PostgreSQL 14+). A closure table when ancestor/descendant
queries are hot and trees deep; `ltree` for read-mostly taxonomies; nested sets only for
near-static trees.

**Temporal data.** Distinguish **application (valid) time** — when a fact was true in the
world — from **system (transaction) time** — when the database recorded it. SQL:2011 defines
both (SQL Server, MariaDB, Db2, Oracle implement system versioning). PostgreSQL 18 supports
application time natively — `PRIMARY KEY (id, valid_at WITHOUT OVERLAPS)` and temporal
foreign keys, with the `btree_gist` extension for the non-range key columns — and emulates
system time with triggers into a history table. Use one range
column with half-open intervals `[from, to)`, not two nullable dates with no overlap
constraint. **Bitemporal** (both times) only where retroactive corrections are unavoidable
and what was *known* at a time matters — payroll, tax, compliance (Fowler, *Bitemporal
History*); it is costly to build, query, and explain.

**Audit and history.** An entity history table (`<table>_history` with a validity range,
trigger-maintained) for as-of queries; a generic audit log (table, operation, key, old/new
`jsonb`, actor, transaction) for "who changed what". Audit tables can be tampered with by the
table owner — the application should not run as the owner. `updated_by`/`updated_at` columns
are not an audit trail; they keep only the last change.

**Soft delete** (`deleted_at`). Every query must remember the filter; foreign keys still pass
and cascades do not fire, so children of a "deleted" parent stay live; unique constraints
collide with deleted rows; it conflicts with retention and erasure rules. Prefer hard delete
plus an archive table (`DELETE … RETURNING` into it), or a real status when "archived" is a
business state. If soft delete is required: a partial unique index `WHERE deleted_at IS NULL`,
a view of live rows, and a defined rule for children.

**Polymorphic associations** (`commentable_type`, `commentable_id`) cannot have a foreign key,
so integrity lives only in code. Alternatives: an **exclusive arc** (one nullable FK per parent
plus `CHECK (num_nonnulls(a_id, b_id) = 1)`); one join table per parent type; or a common
supertype table both parents extend. Not PostgreSQL `INHERITS`.

**Entity–attribute–value** (`entity_id, attr_name, value text`) loses types, `NOT NULL`,
foreign keys, and costs a join per attribute. Use real columns or subtype tables; for genuinely
open-ended attributes, a `jsonb` column with a GIN index and `CHECK`s on required keys — and
promote anything you filter, join, or constrain on to a real column. Keep documents small: an
update rewrites and locks the whole row.

**Multi-tenancy.**

| Model | Isolation | Cost per tenant | Operations |
|---|---|---|---|
| Shared schema, `tenant_id` + row-level security ("pool") | Logical; noisy neighbours | Lowest | One schema; restoring one tenant is hard |
| Schema per tenant ("bridge") | Namespace | Low | Migrations run N times; catalog growth |
| Database per tenant ("silo") | Strongest; per-tenant restore and tuning | Highest | Needs fleet automation |

In the shared model: `tenant_id NOT NULL` on every tenant-owned table and **leading** every
primary key, unique constraint, and index; composite foreign keys `(tenant_id, parent_id)` so
a cross-tenant reference is impossible; per-tenant uniqueness `UNIQUE (tenant_id, email)`. With
PostgreSQL row-level security, `ENABLE` **and** `FORCE` it (owners bypass it otherwise), run as
a role without `BYPASSRLS`, and set the tenant transaction-locally
(`set_config('app.tenant_id', $1, true)`) so pooled connections cannot leak it. A hybrid —
shared by default, large tenants moved to their own database — is common.

**Enumerations.** A lookup table with a foreign key when values carry attributes (label,
order, active flag) or are managed as data. `text` + `CHECK (x IN …)` for small sets owned by
code. A PostgreSQL `ENUM` only for sets that never shrink — values can be added and renamed,
never removed or reordered without recreating the type. **A value stored in rows is persisted
data**: renaming it is a data migration (see `database-change-management.md`).

**Anti-patterns:** repeating groups and CSV columns; floating-point money; `timestamp` without
time zone for instants; unindexed foreign keys; polymorphic associations; EAV; invariants only
in application code; soft delete by reflex; `SELECT`-driven denormalization with no
consistency mechanism.

---

## Dimensional modeling (Kimball)

Each business process becomes a **fact table** of measurements at one declared grain,
surrounded by denormalized **dimension tables** giving context — who, what, where, when, why.
Processes integrate through **conformed dimensions**. It is the presentation layer for BI and
analysts, not an OLTP model and not the integration layer for dozens of volatile sources.

**The four-step design process:** (1) select the business process; (2) **declare the grain**;
(3) identify the dimensions; (4) identify the facts. The grain is "a binding contract on the
design": start at the atomic grain (the lowest level at which data is captured), make every
dimension and fact consistent with it, and **never mix grains in one fact table**.

| Fact table | One row per | Behaviour |
|---|---|---|
| Transaction | Measurement event | Insert-only; sparse |
| Periodic snapshot | Entity per period (day, month) | A row even with no activity |
| Accumulating snapshot | Process instance (order line, claim) | One date key per milestone plus lag measures; **rows are updated** as the process advances |
| Factless | Event or coverage with no measure | Attendance, eligibility; coverage minus activity shows what did not happen |

**Additivity.** Additive facts sum across every dimension; semi-additive ones (balances,
inventory) across everything except time; non-additive ones (ratios) are stored as their
additive components and computed after summing.

**Dimensions.**
- **Surrogate keys** — meaningless integers, not source natural keys — with the source key kept
  as an attribute. The date dimension may use `yyyymmdd`.
- **No null foreign keys in facts**: point them at an "Unknown" or "Not applicable" row. Null
  measures are fine.
- **Star, not snowflake**: flatten hierarchies into the dimension; snowflaking adds joins and no
  information.
- **Degenerate** dimension: an identifier with no attributes (invoice number) kept on the fact.
  **Junk** dimension: low-cardinality flags bundled, holding only the combinations that occur.
  **Role-playing**: one dimension used several times (order date, ship date) through named
  views. **Bridge** tables for multivalued dimensions (not the data-vault bridge).
- **Conformed dimensions** have the same columns and values wherever used — that is what makes
  drill-across work. The **bus matrix** (processes × dimensions) shows where each must conform;
  build it one row at a time.

**Slowly changing dimensions.**

| Type | Mechanism | Use |
|---|---|---|
| 0 | Keep the original value | Fixed attributes |
| 1 | Overwrite; no history | Very common |
| 2 | New row per change, with effective/expiry dates and a current flag | The workhorse (dbt snapshots implement it) |
| 3 | A "prior value" column | Rare |
| 4 | Kimball: a **mini-dimension** for rapidly changing attributes, both keys on the fact. (Many vendors use "Type 4" for a history table instead — say which you mean) | Situational |
| 5 | 4 + a Type 1 pointer to the current mini-dimension row | Rare |
| 6 | Type 2 rows plus Type 1 `current_*` columns | Moderately common |
| 7 | The fact carries both the per-version surrogate key (as-was) and the durable key (as-is) | Situational |

For Types 2, 6, and 7 keep a **durable key** that never changes alongside the per-version
surrogate key.

**One Big Table.** In cloud warehouses a wide, pre-joined table can outperform a star for
dashboard queries (one vendor benchmark, 2022), at the cost of storage and of freezing one
history perspective. Keep conformed facts and dimensions as the source of truth and publish
wide tables as **derived marts**.

```sql
CREATE TABLE fact_sales_line (                       -- GRAIN: one row per order line
  date_key     int    NOT NULL REFERENCES dim_date,      -- yyyymmdd
  customer_key bigint NOT NULL REFERENCES dim_customer,  -- 'Unknown' row, never NULL
  product_key  bigint NOT NULL REFERENCES dim_product,
  order_number text   NOT NULL,                          -- degenerate dimension
  quantity     int    NOT NULL,
  net_amount   numeric(14,2) NOT NULL                    -- additive
);
```

**Anti-patterns:** undeclared or mixed grain; centipede facts (a key per hierarchy level);
null foreign keys; stored ratios; source natural keys as dimension keys; snowflaking by reflex;
non-conformed copies of the same dimension.

---

## Data vault (2.0)

An insert-only **integration** model that separates business keys (**hubs**), relationships
(**links**), and descriptive history (**satellites**), stamping every row with when it was
loaded and where it came from. A new source or a source change adds tables instead of
reworking existing ones. It is not a presentation layer: marts — usually dimensional — sit on
top.

| Table | Holds | Rules |
|---|---|---|
| Hub | Distinct business keys of one concept, hash key, `load_dts`, `record_source` | No descriptive attributes; insert-only |
| Link | A distinct relationship between two or more hub keys, its own hash key, `load_dts`, `record_source` | No descriptive attributes; many-to-many by default |
| Satellite | Parent hash key, `load_dts`, `hash_diff`, descriptive payload, `record_source` | Exactly one parent (hub or link); a row is inserted only when `hash_diff` changes; split by source, rate of change, or subject |

- `load_dts` is when the row **arrived in the platform**, not when the business event happened.
- **Hash keys** let hubs, links, and satellites load in parallel. Normalize before hashing
  (cast, trim, upper-case, fixed delimiter and column order, a placeholder for `NULL`), store
  the hash as binary, salt hashes of personal data, and choose the algorithm once — changing it
  is a full reload.
- **Raw vault** holds source data as delivered (hard rules only); the optional **business
  vault** holds derived and cleansed values (soft rules) in the same structures.
- **Point-in-time (PIT)** and **bridge** tables are disposable query helpers that make marts
  cheap to build — rebuilt, never audited.

**Pays off with** many sources (dozens), frequent source change, several generations of
systems, a hard requirement to reproduce exactly what was loaded when, and automation tooling
(dbt packages, WhereScape, VaultSpeed). **Overkill** for simple, stable systems, short
projects, or teams without automation — the table count and join depth swamp them.

**Anti-patterns:** business rules in the raw vault; satellites with mixed sources or two
parents; attributes on links; BI tools querying the vault directly; inconsistent hash
normalization between loaders; updating satellite rows.

**Related:** *Anchor modeling* (6NF — one table per attribute, evolution by adding tables only).
The *medallion* architecture places these models: bronze (raw, source-shaped) → silver
(cleaned and integrated; 3NF or data vault) → gold (dimensional stars, wide tables, aggregates).

---

## Document modeling

Each document is a self-contained aggregate — nested objects and arrays — stored and fetched as
one unit, and a write to one document is atomic. Relationships are either **embedded** (copied
into the parent) or **referenced** (an ID resolved by `$lookup` or the application). Fowler's
term for this family is *aggregate-oriented*: it works well when access aligns with the
aggregates and costs more when queries cut across them.

**Embed or reference.**

| Signal | Choose |
|---|---|
| Contains/has-a; read together, updated together, archived together | Embed |
| The child side is large or unbounded; written at different times; exists without its parent; duplicated data would be hard to keep consistent | Reference |

Cardinality heuristics (MongoDB): one-to-few → embed; one-to-many → an array of references in
the parent; one-to-squillions → a parent reference in each child. More than a couple of hundred
children: do not embed; more than a few thousand: do not keep an array of references.
Denormalize only fields with a high read-to-write ratio — an update to denormalized copies is
not atomic.

**Limits** (MongoDB): 16 MiB per document; 100 levels of nesting; 64 indexes per collection.

**Named patterns** (MongoDB catalogue):

| Pattern | Use when |
|---|---|
| Attribute — sparse fields as an array of `{k, v}` with one index | Many optional fields, each in few documents, that you filter on |
| Bucket — many small records grouped per time span, with pre-aggregates | Event streams (prefer native time-series collections where available) |
| Computed — derived values stored at write time | Read-heavy recomputation |
| Extended reference — copy a few stable fields of the referenced document | Frequent "joins" for a few fields |
| Outlier — flag rare oversized cases and handle them separately | A few exceptions would otherwise dictate the design |
| Polymorphic — different shapes, one purpose, one collection | Varied documents queried together |
| Schema versioning — a `schema_version` field; readers per version | Effectively always |
| Subset — the hot part of a large relationship embedded, the rest referenced | The working set exceeds memory |
| Tree — parent, child, ancestor-array, or materialized-path references | Hierarchies |
| Archive — move cold data elsewhere | Retained but rarely read |

**Schema evolution without migrations** means the schema lives in the readers: version each
document, write the newest shape, keep a reader per version, and update old documents all at
once, lazily on access, or never. "Schemaless" still has a schema — an implicit one, in code.
`$jsonSchema` validators (`validationLevel: moderate` to skip existing invalid documents)
make the important parts explicit.

```json
{ "_id": "book_42", "schema_version": 2, "title": "Dune",
  "author": { "_id": "auth_7", "name": "F. Herbert" },
  "top_reviews": [ { "user": "u1", "stars": 5 } ],
  "review_count": 18234 }
```
(all reviews live in a `reviews` collection keyed by `book_id` — subset + extended reference)

**Anti-patterns:** unbounded arrays; a collection per day/tenant; unnecessary indexes; bloated
documents; heavy `$lookup` (data accessed together has been split); multi-document transactions
as a substitute for schema design.

---

## Key-value and single-table design (DynamoDB-style)

Every item is addressed by a **partition key** (hashed to choose a physical partition) and an
optional **sort key**. Items sharing a partition key form an **item collection**, stored
together and sorted by sort key. The efficient operations are a get by full key and a query on
one partition key with a range or prefix condition on the sort key; everything else needs a
secondary index or a scan. **Single-table design** stores several entity types in one table so
one query returns related items — a join done at write time.

**Workflow:** list every access pattern (from user stories, or from query logs for an existing
system) → size each one → design partition and sort keys so each pattern is one get or one
query on the table or an index → add global secondary indexes (GSIs) only for what remains.

**Rules.**
- **Overloaded keys**: generic `PK`/`SK` attributes with type prefixes (`CUSTOMER#123`,
  `ORDER#2026-10-01#9`) so entities share a table and sort hierarchically. GSIs can be
  overloaded the same way. Newer GSIs accept multi-attribute keys (up to four attributes each,
  since Nov 2025) — prefer them to concatenated synthetic keys.
- **Sparse indexes**: an item appears in a GSI only if it has the key attribute — set
  `open_since` while an order is open and remove it on shipment to index only open orders.
- **Adjacency list** for many-to-many: an edge is an item in the source's partition whose sort
  key is the target; a GSI on the sort key gives the reverse lookup. Multi-hop traversal belongs
  in a graph store.
- **Limits** (DynamoDB): 400 KB per item — compress, split across items, or keep the payload in
  object storage with a pointer; per partition, 3,000 read and 1,000 write units per second;
  with any local secondary index, an item collection is capped at 10 GB — prefer GSIs for
  collections that can grow.
- **Hot keys**: never a partition key whose current writes concentrate on few values — a
  status, a creation date rounded to the day. (A sequential ID is fine: the key is hashed.)
  Spread a hot key's writes with a calculated suffix (`hash(order_id) % N`), which keeps point
  reads possible; a random suffix forces N reads.

**When single-table design is the wrong call.** The guidance has softened: AWS now presents
multiple tables as "good and sufficient" when entities are not queried together, and single
tables trade away per-entity backups, streams, and encryption settings and add a steep learning
curve. Rule: **one table for entities read together; otherwise one table per aggregate.**

```
PK            SK                    attributes       GSI1PK          GSI1SK
CUSTOMER#123  PROFILE               name, email      EMAIL#a@b.com   CUSTOMER#123
CUSTOMER#123  ORDER#2026-10-01#9    total, status    ORDER#9         ORDER#9
ORDER#9       ITEM#sku-77           qty, price
```

**Anti-patterns:** tables designed before access patterns are listed; scans with filters as a
query mechanism; hot or sequential partition keys; large items rewritten for small updates;
using it as a relational database.

---

## Wide-column modeling (Cassandra, ScyllaDB, HBase, Bigtable)

A partitioned, sorted, sparse map: **partition key → clustering key → columns**. The partition
key decides placement; clustering columns decide on-disk order within a partition. There are no
joins and no cross-partition transactions: **one table per query**, denormalization by design.

**Method** (Cassandra): conceptual model → application workflow (access patterns) → logical
model with **one table per query**, named `<entity>_by_<key>` and drawn as Chebotko diagrams →
physical model → refine by **sizing partitions**. Sort order is fixed at table creation.

**Rules.**
- **Bound every partition.** Hard limit 2 billion cells; a widely used target is under 100 MB
  and 100,000 values per partition (DataStax guidance; current Apache docs give no number and
  ScyllaDB warns only at 1 GB — treat 100 MB as the conservative design target). Add a time
  bucket to the partition key — `(sensor_id, day)` — so nothing grows without bound.
- **Deletes write tombstones**, kept for `gc_grace_seconds` (10 days by default); reads warn at
  1,000 tombstones and fail at 100,000. Queue tables and "latest state" tables with frequent
  deletes are the classic failure. Prefer TTLs on time-bucketed partitions that expire whole.
- **Secondary indexes and materialized views**: use indexes only together with a partition-key
  restriction or on low-volume tables; Cassandra materialized views are experimental and off by
  default. Prefer a second query table.
- **Lightweight transactions** (compare-and-set) cost several round trips — reserve them for
  real races such as unique usernames.
- **HBase/Bigtable row keys**: never lead with a timestamp or sequence; put the entity ID first
  and time after it; salt (`hash(key) mod N` prefix) to spread a hotspot at the cost of N-way
  scans; reverse timestamps (`MAX - ts`) for newest-first. Bigtable: rows under 100 MB, cells
  under 10 MB, row keys 4 KB or less; HBase: as few column families as possible.

```sql
CREATE TABLE readings_by_sensor_day (
  sensor_id uuid, day date, ts timestamp, value double,
  PRIMARY KEY ((sensor_id, day), ts)
) WITH CLUSTERING ORDER BY (ts DESC) AND default_time_to_live = 7776000;
-- Bigtable/HBase equivalent row key: sensor#<id>#<MAX - ts>
```

**Anti-patterns:** designing tables from entities instead of queries; unbounded partitions;
delete-heavy queues; relying on secondary indexes or materialized views for primary access;
timestamp- or sequence-leading row keys in HBase/Bigtable; a bare time bucket as a Cassandra
partition key.

---

## Columnar analytical stores (ClickHouse, Redshift, BigQuery, Snowflake, Parquet, DuckDB)

**"Wide-column" and "columnar" are different things.** Cassandra, HBase, and Bigtable are
*wide-column* stores: a sparse distributed map, row-oriented within a column family, built for
key lookups and high update rates. *Columnar* (column-oriented) stores lay each column out
contiguously as bare values, built for scanning and aggregating a few columns over billions of
rows, and are poor at updates. Never recommend Cassandra for analytics because it "is a column
store", and never recommend a warehouse for key lookups.

Column orientation reads only the referenced columns, compresses same-typed sorted values very
well, and skips whole blocks using per-block min/max metadata. So:

- **Sort/ORDER BY key**: the columns most filtered on, ordered **low to high cardinality**
  (ClickHouse, Snowflake); a timestamp first when recent data dominates (Redshift). The sort key
  is the main index — ClickHouse keeps one sparse mark per 8,192-row granule. Do not lead with
  UUIDs or hashes.
- **Partitioning is mainly data management**, not query speed: a low-cardinality key (fewer than
  100–1,000 values, typically month) so retention is "drop the partition". BigQuery: partition
  only when partitions average 10 GB or more, otherwise cluster (up to four columns).
  Snowflake: clustering keys only for multi-terabyte tables, three or four columns.
- **Wide denormalized tables** beat joins for latency-sensitive queries; denormalize the
  attributes queried often.
- **Write in batches**, not rows: ClickHouse recommends 10,000–100,000 rows per insert; avoid
  frequent mutations (use replacing/collapsing engines or partition drops); compact small files
  in lake tables (Parquet row groups of 512 MB–1 GB).
- **Materialized views and projections** for other sort orders and pre-aggregates, at the cost
  of a second write.

```sql
CREATE TABLE events (
  event_date Date, tenant LowCardinality(String), event_type LowCardinality(String),
  user_id UInt64, ts DateTime64(3), props String)
ENGINE = MergeTree
PARTITION BY toStartOfMonth(event_date)        -- lifecycle
ORDER BY (tenant, event_type, user_id, ts);    -- low → high cardinality
```

**Anti-patterns:** row-at-a-time inserts or updates; high-cardinality partition keys; a sort key
that ignores the filters; using it for transactional lookups.

---

## Time-series modeling

Append-mostly data keyed by **(series identity, timestamp)**, read by time range, aggregated
over windows, expired by age. Every engine's answer is the same: partition or bucket by time,
keep the series identity at the front of the key, roll old data up, and drop it whole.

- **Time-partitioned tables**: TimescaleDB hypertables (default chunk 7 days; size chunks so the
  indexes of the chunks being written fit in about 25% of memory) or native partitioning
  (PostgreSQL handles a few thousand partitions well when queries prune — more is not better).
- **Retention by dropping partitions, never bulk `DELETE`** — dropping is far faster and avoids
  vacuum and tombstone cost.
- **Downsampling**: rollups or continuous aggregates (hourly → daily → monthly). The retention
  window of the raw data must be longer than the aggregate's refresh window, or the refresh
  deletes aggregates for data that is gone.
- **Tags vs fields** (InfluxDB 1.x/2.x): tags are indexed and form the series key; fields are
  not. Values shared across many points are tags; unique or fast-changing values (IDs, hashes,
  messages) are fields — a high-cardinality tag explodes the series count. InfluxDB 3 lifts the
  cardinality limit but fixes column order at first write; check the version before applying
  either rule.
- **Layout**: *narrow* (one table per metric), *wide* (a column per metric, known up front), or
  *medium* (a column per data type plus `metric_name`, for dynamic metrics).
- **Bucketing elsewhere**: MongoDB time-series collections or the bucket pattern; Cassandra
  `(id, day)` partitions; Bigtable rows per entity per hour or day.

**Anti-patterns:** write-concentrating keys in distributed stores (a leading timestamp in a
range-ordered store, a bare time bucket as a hashed partition key); high-cardinality tags; row
deletes for retention; tiny chunks; one indexed document per reading.

---

## Graph modeling

Entities are **nodes**, connections are stored **relationships**, and queries walk them instead
of computing joins. Two families: the **labeled property graph** (Neo4j, TinkerPop/Gremlin,
openCypher, ISO GQL — labeled nodes, typed directed relationships, properties on both) and
**RDF** triple stores (subject–predicate–object with global IRIs and shared vocabularies,
queried with SPARQL). Choose a property graph for application-owned graphs where relationships
carry properties and paths matter; RDF for shared vocabularies, linked data, federation, and
inference. The choice is hard to undo.

**Use a graph store when** the core queries traverse a variable or unknown number of hops or
find paths — recommendations, fraud rings, access-control and dependency graphs, knowledge
graphs, impact analysis — online, at a depth or fan-out where a recursive CTE misses the latency
target (measure it). Fixed-depth hierarchies and one- or two-hop lookups stay relational; SQL
recursive CTEs and SQL:2023's property-graph queries close more of the gap every year.

**Rules.**
1. **Query-driven**: write the questions first, then the path patterns that answer them.
2. **Nouns become labels and nodes; verbs become relationship types.** Watch for verbs that hide
   an entity: "Ian emailed Jim" contains an `Email` node.
3. **Facts with more than two participants are intermediate nodes** (a `Job` linking Person,
   Company, Role, with start and end dates). A relationship has exactly two ends; refactoring an
   entity out of one later is a breaking change.
4. **Specific relationship types over generic ones** — `DELIVERY_ADDRESS`, not
   `ADDRESS {type:'delivery'}` — because the type is how traversals prune. Keep open-ended values
   (weights, scores) as relationship properties.
5. **One relationship per fact**; ignore direction in queries for symmetric relationships rather
   than storing two.
6. **Property or node?** Promote a value to a node when it is shared and traversed or grouped
   by; keep it a property when only read from its owner. A low-cardinality category promoted to a
   node (Country, Status) becomes a dense node — use a label or indexed property if you only
   filter on it.
7. **Sequences** as `NEXT` linked lists with a head pointer. For time, use a temporal property
   with a range index — Neo4j now treats the older "time tree" pattern as obsolete.
8. **Constraints and indexes before loading**, on stable deterministic IDs.

**Dense nodes (supernodes)** — thousands of relationships where most nodes have tens — slow every
traversal through them. Mitigate with specific relationship types and direction, starting
traversals from the low-degree side, not traversing *through* hubs, intermediate nodes per event,
and labels instead of hub nodes for categories.

```cypher
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
MATCH (a:Account {id:$id})-[:USED_DEVICE|LOGGED_IN_FROM*1..4]-(b:Account)  // bounded depth
WHERE a <> b RETURN DISTINCT b.id;
```

**Anti-patterns:** generic `RELATED_TO` relationships; one `:Node` label with a `type` property;
unbounded variable-length patterns; duplicated bidirectional relationships; graph-wide analytics
on an operational graph; over-specific types (`ACTED_IN_1995`). Note that Cypher's
`shortestPath` is an *unweighted* breadth-first search — weighted paths need an algorithms
library.

---

## Event sourcing

State changes are stored as an append-only, immutable sequence of domain events per entity — a
**stream** — and the event store is the system of record. Current state is rebuilt by replaying
the stream; read models are **projections** of it.

**Use it selectively**, for an aggregate where audit, replay, or temporal reconstruction is a
business requirement (ledgers, order pipelines) — not for a whole system, plain CRUD, MVPs, or
views that must be strongly consistent. An audit table, history table, or change-data-capture
feed often meets the requirement more cheaply. It is costly to migrate into or out of.

**Rules.**
- **Events record intent in the past tense** — `SeatsReserved`, not `RemainingSeatsChanged`.
- **Optimistic concurrency on stream version**: read at version N, append expecting N; on
  conflict reload, re-decide, retry. In a relational store: `UNIQUE (stream_id, stream_version)`.
- **Never update or delete events**; correct with compensating events.
- **Schema evolution**, in order of preference: tolerant readers for additive changes → a version
  in the event type or metadata → upcasters on read → rewriting stored events, as a last resort.
- **Snapshots** are an optimization, always regenerable from the stream.
- **Projections are idempotent** and checkpoint their position; delivery is at-least-once.
  A global sequence can have gaps and commit out of order under concurrency — read it with a
  safe high-water mark.
- **Personal data** stays outside the events (referenced by ID) or is encrypted per subject so it
  can be crypto-shredded.
- Replays must not re-trigger external side effects.
- A message broker is not an event store — it lacks per-stream reads and optimistic concurrency.

```sql
CREATE TABLE events (
  global_position bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        uuid  UNIQUE NOT NULL,
  stream_id       text  NOT NULL,
  stream_version  int   NOT NULL,
  event_type      text  NOT NULL,
  schema_version  int   NOT NULL,
  payload         jsonb NOT NULL,
  metadata        jsonb NOT NULL,          -- actor, correlation and causation ids
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stream_id, stream_version)       -- optimistic concurrency
);
```

---

## CQRS, read models, and derived structures

**CQRS** separates the model that handles commands (writes, with domain logic) from the model
that answers queries. It suits collaborative domains with task-based commands and strongly
asymmetric read/write load — for specific bounded contexts; across a whole system it "adds risky
complexity" (Fowler). It does not require event sourcing. Try lighter options first: a
**reporting database**, a read replica, or a materialized view.

When stores are separate, publish changes through a **transactional outbox** (never a dual
write: update the database, then publish separately), make consumers idempotent, and design the
interface for staleness.

**Materialized view**: a precomputed, read-only projection shaped for a query, entirely
rebuildable from its sources. Decide the acceptable staleness before choosing the refresh
mechanism; monitor its age; apply the sources' access-control and retention rules to it.
PostgreSQL `REFRESH MATERIALIZED VIEW` recomputes the whole view (`CONCURRENTLY` needs a unique
index and does not block readers).

**Index table**: a hand-maintained secondary index for stores without adequate native indexing
(key-value, wide-column, sharded data) — fully denormalized, keys only, or the hot fields.
Maintain it from a durable change feed, idempotently, applying an update only if its source
version is newer.

**The rule for all three: derived data is disposable.** It can be rebuilt from the system of
record, it is never written by its consumers, and it is never the only copy.

---

## Search and vector indexes

Both are **derived data**: projections of the system of record, fed by an outbox, change data
capture, or an indexer, versioned so stale updates are dropped, and rebuilt side by side behind
an alias.

**Search documents** are denormalized to **one document per result** — what the user sees in a
result list — so that search-time work is cheap. Arrays of objects are flattened (fields of one
object lose their link); `nested` restores it at a large query cost, parent-child at a larger
one. Shape fields for the queries: identifiers as `keyword`, buckets precomputed at index time,
only the needed fields searchable or facetable. Prevent **mapping explosion** (Elasticsearch
defaults: 1,000 fields, depth 20) with strict or disabled dynamic mapping, or a flattened type for
arbitrary keys — mappings cannot shrink without a reindex.

**Vectors** are stored **with** their filter metadata and provenance: tenant, source document,
chunk number, embedding model and version, content hash — the model will change and everything
will be re-embedded. Start with pgvector beside the source rows (transactions, joins, backups);
know that with approximate indexes it **filters after the index scan**, so selective filters
return too few results unless handled (iterative scans, partial indexes, partitioning per tenant,
or exact search on small filtered sets). A dedicated vector database earns its place at very
large scale or for heavily filtered approximate search.

---

## Data ownership, polyglot persistence, and sharding

**Application database, not integration database.** A database owned by one application can
evolve freely; a database shared as the integration point between applications couples them all
to one schema and turns every change into a negotiation (Fowler). Each table has **one owning
service that writes it**; others read through APIs, events, or replicated read models. Across
services, use sagas for transactions and API composition or read models for queries — never a
distributed two-phase commit and never a cross-schema join.

**Polyglot persistence** — choosing each store by how its data is used — is for strategic needs;
Fowler expects most projects to stay relational. Each store added brings operations, skills, and
consistency costs, so it must be justified by a named access pattern.

**Sharding** is the last scaling step — after vertical scaling, replicas, caching, and native
partitioning — for write volume, size, residency, or isolation. The **shard key is the most
expensive decision to change**: immutable, high-cardinality, evenly loaded, and aligned with the
dominant queries so most requests hit one shard; never a boolean or small enum, and never a
timestamp or auto-increment value under range sharding (every new write lands on the last
shard). Hash for even spread (with consistent hashing or virtual shards so adding nodes does
not reshuffle everything), range for range scans (hot spots on sequential keys), lookup/directory
for control. Co-locate data read together (a customer with its orders); replicate small reference
data to every shard; serve secondary lookups with an index table or search index.

---

## Review signals — flag these in a proposal or a change

| Signal | Risk | Fix direction |
|---|---|---|
| An access pattern with no key or index serving it | Full scans or an unservable query | Add the key/index, or change the model |
| An index or denormalized copy no access pattern needs | Write cost, drift | Remove it |
| Invariant enforced only in application code | Broken by the next writer | Constraint, or a stated reason it cannot be one |
| Foreign key without an index on the referencing column | Slow joins; locking on parent deletes | Index it |
| Floating-point money; `timestamp` without time zone for instants | Rounding errors; ambiguous times | `numeric`/minor units; `timestamptz` |
| Polymorphic association or EAV | No referential integrity or types | Exclusive arc, supertype, real columns, `jsonb` with checks |
| Shared-schema tenancy without `tenant_id` leading keys, or RLS not forced | Cross-tenant leaks | Composite keys; `ENABLE` + `FORCE` RLS |
| Fact table with undeclared or mixed grain | Wrong totals | Declare one grain per fact table |
| Null foreign keys in a fact table | Rows vanish from inner joins | "Unknown" dimension row |
| Unbounded array, item collection, or partition | Size limits, hot partitions, slow reads | Reference, subset, or time bucket |
| Write-concentrating key: a leading timestamp or sequence in a range-ordered store (Bigtable, HBase), or a hashed partition key whose current writes share few values (a date, a status) | Write hotspot | High-cardinality entity first; time after it, or as part of a composite key |
| Delete-heavy table in a wide-column store | Tombstone pile-up, failing reads | TTL + time buckets; different store |
| Row-at-a-time writes or high-cardinality partitioning in a columnar store | Small parts, slow merges | Batch; low-cardinality partition key |
| Dense node or generic relationship types in a graph | Slow traversals | Specific types; intermediate nodes |
| A new datastore with no access pattern the current one fails | Operational cost without benefit | Justify with a named pattern, or stay |
| Shard, partition, or primary-key type chosen without justification | Expensive one-way door | Record why, and what would change it |
| A second application writing another's tables | Integration-database coupling | One owner; API, events, or read model |
| Derived data (view, index, search, vector) treated as a source of truth | Unrecoverable on rebuild | Keep a system of record; make it rebuildable |

---

## How this connects to the rest of the knowledge base

- **`database-change-management.md`** — how a design is introduced into an existing database
  and evolved afterwards: expand/contract, reversibility, lock-aware DDL.
- **`database-test-patterns.md`** — how the constraints and access patterns a design commits to
  are tested.

## Sources

Primary and vendor documentation, consulted for this file:

- Relational: PostgreSQL 18/19 documentation (constraints, `CREATE TABLE`, row security,
  enum types, UUID functions, identity columns, `WITH` queries, `ltree`, JSON types, partial
  indexes, temporal tables); PostgreSQL wiki *Don't Do This* and *Audit trigger*;
  RFC 9562 (UUIDs); William Kent, *A Simple Guide to Five Normal Forms*; Markus Winand,
  *Use The Index, Luke*; Bill Karwin, *SQL Antipatterns* and *Models for Hierarchical Data*;
  Martin Fowler, *Bitemporal History*; Microsoft Learn, *Multitenant SaaS database tenancy
  patterns*; AWS Prescriptive Guidance, multi-tenant PostgreSQL and RLS; Citus multi-tenant
  docs; Brandur Leach, *Soft deletion probably isn't worth it* (practitioner view).
- Dimensional: Kimball Group, *Dimensional Modeling Techniques* and Design Tip #152; dbt,
  *Guide to dimensional modeling* and snapshots; Fivetran, *Star schema vs OBT* (2022 vendor
  benchmark).
- Data vault: Scalefree, *Data Vault Glossary*; dbt Labs, *Data Vault 2.0 with dbt Cloud*;
  AutomateDV hashing guidance; Roelant Vos on Data Vault 2.0; Snowflake, *PIT constructs and join
  trees*; Databricks, *Medallion architecture*; Anchor Modeling.
- Document and key-value: MongoDB manual (embedding vs references, design patterns,
  anti-patterns, limits, schema validation, schema versioning, time-series best practices) and
  the *Building with Patterns* and *6 Rules of Thumb* posts; AWS DynamoDB developer guide (NoSQL
  design, data modeling foundations, partition key design, write sharding, burst and adaptive
  capacity, GSI overloading, sparse indexes, adjacency lists, large items, LSIs, quotas); Alex
  DeBrie on single-table design (including the 2022 AWS post on single- vs multi-table).
- Wide-column and columnar: Apache Cassandra documentation (data modeling, tombstones,
  `cassandra.yaml`, SAI); DataStax partition-size and lightweight-transaction guidance (dated);
  Apache HBase reference guide (row key design); Google Cloud Bigtable schema design;
  Daniel Abadi, *Distinguishing Two Major Types of Column-Stores*; ClickHouse best practices;
  Amazon Redshift sort and distribution keys; BigQuery partitioning and clustering; Snowflake
  micro-partitions and clustering; Apache Parquet configuration; DuckDB indexing; Apache Iceberg
  maintenance.
- Time-series: TimescaleDB (Tiger Data) hypertables, chunk sizing, data lifecycle, table
  layouts; InfluxDB 2 and 3 schema design; PostgreSQL partitioning.
- Graph and cross-cutting: Neo4j data-modeling guides and Cypher manual; Robinson, Webber &
  Eifrem, *Graph Databases* (2nd ed.); W3C RDF 1.1 Primer and RDF 1.2 Concepts; Apache
  TinkerPop; AWS Neptune Well-Architected; Azure Architecture Center patterns (Event Sourcing,
  CQRS, Materialized View, Index Table, Sharding); Martin Fowler on Event Sourcing, CQRS,
  Polyglot Persistence, Application/Integration/Reporting Database, Aggregate-Oriented Database,
  and *Evolutionary Database Design* (with Sadalage); microservices.io, *Database per service*;
  Elasticsearch mapping and search-speed guidance; pgvector; Qdrant indexing.

On the two resources suggested when this file was commissioned:
**martinfowler.com/tags/database** is authoritative for architecture-level data thinking —
*Evolutionary Database Design*, *Integration Database*, *Polyglot Persistence*, *Aggregate
Oriented Database*, and *Reporting Database* are drawn on above — though several entries are
dated (*Database Thaw*, *In Memory Test Database*). The Medium series *Database Design
Patterns* (Artem Khrenov, 2025) is a topic checklist rather than a reference: it gives no rules
or sources and contains technical errors (for example, that Cypher's `shortestPath` uses
Dijkstra), so nothing here relies on it.
