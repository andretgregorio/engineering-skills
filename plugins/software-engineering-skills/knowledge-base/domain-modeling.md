# Domain Modeling

Reference knowledge for agents and skills that define a domain model from product documents
— feature descriptions, specs, plans, design docs, story maps — or review code against one.
It covers the ubiquitous language, how to discover the model in documents, the building
blocks and how to choose between them, bounded contexts, how domain terms become code names,
and the anti-patterns that show a model has leaked or rotted in the code.

The name-level check of a diff lives in the `clean-coder-reviewer` agent's
`references/domain-language.md`. It judges names against the model this file helps produce.
Sources are listed at the end.

The examples below — enrollments, terms, payment deadlines — illustrate shapes. They are
never vocabulary: a model takes its words only from its own sources.

---

## Why model the domain before the code

Every name in a plan becomes a name in the code: the files table names modules, the tasks name
functions and endpoints, the migrations name columns, the Gherkin names the states. Once those
names are persisted and published, they are expensive to change. So the cheapest place to fix
a word is the document, before anyone types it.

A model written down before implementation buys three things:

- **One vocabulary from spec to code.** Product, QA and engineering use the same word for the
  same thing. A mismatch between spec and code then shows up as a mismatched word, which a
  reviewer can see.
- **Rules with owners.** Each business rule in the spec is assigned to the aggregate or
  policy that enforces it, so it is implemented once, in one place, under its own name.
- **Questions surfaced while they are cheap.** Two words for one thing, one word for two
  things, or a concept the documents never named — each is a question for the domain owner,
  asked before it becomes a column.

---

## The ubiquitous language

Evans defines it as a language built around the domain model and used by everyone on the
team: in conversation, in documents, in code, and in tests. Its rules:

- **One term per concept, one concept per term**, within a bounded context.
- **The language comes from the domain.** It comes from the domain experts and the product's
  own documents. Engineers sharpen it; they never replace it with technical vocabulary.
- **A change in the language is a change in the model.** If people start using a new word,
  or stop using an old one, the model and the code follow.
- **Terms are defined, not just listed.** A definition says what the term is, what it is not
  (the nearest term it could be confused with), and the rules attached to it.
- **A term is unambiguous only inside its bounded context.** *Account* in billing (a ledger)
  and *account* in identity (a login) are two terms that happen to share a spelling.

A glossary entry carries:

| Field | Content |
|---|---|
| Term | The domain's word, as the business says it |
| Definition | What it is, what it is not, its rules — one or two sentences |
| Kind | Entity, aggregate root, value object, domain event, command, query, lifecycle state, policy, domain service, application service, rejection, role, collection, module or context, or concept owned by another context |
| Code name | The exact identifier the implementation uses, in the project's casing — with the existing name beside it when the code drifts (`Enrollment` (existing: `Registration`)), or `—` when the term has no code artifact |
| Avoid | Synonyms and technical stand-ins that must not appear for this concept |
| Status | `agreed` (the strong sources agree; a stray usage goes under Avoid) · `proposed` (strong sources conflict; awaiting the domain owner) · `provisional` (no source names it) |
| Source | Document path and section, or `path:line` in the code |

---

## Discovering the model in documents

Read in this order: the feature description, then the spec (intent, acceptance criteria,
error handling), the plan (task titles, Gherkin scenarios, files), the design docs and story
maps, the UI copy, and finally the model already in the code. The documents say what the
business means. The code says what has already been committed to.

| In the document | Suggests |
|---|---|
| A noun with an identity that persists and changes over time — "the enrollment", "a student's account" | Entity |
| A noun defined only by its attributes, where two equal ones are interchangeable — "an amount", "a date range", "an address" | Value object |
| A rule spanning several things that must hold at once — "a section cannot exceed its capacity" | Aggregate boundary and its invariant |
| A past-tense verb, or "when / once / after X" — "once the term closes", "after payment is received" | Domain event |
| An imperative verb the user or the system performs — "enroll", "drop", "waive the fee" | Command, and the method that carries it out |
| A condition with a name, or a multi-clause condition — "eligible for", "late registration" | Policy or specification |
| A list of states — "pending, active, dropped" | Lifecycle: the states and the transitions allowed between them |
| An operation across several aggregates with no natural owner — "transfer credit between institutions" | Domain service |
| A role someone plays — "the registrar", "an advisor" | Actor or role, often not an entity of its own |
| An external system's term — "the Stripe charge", "the SIS record" | Translation at the boundary (anti-corruption layer) |
| A term used but never defined | An open question |

**Gherkin maps directly onto the model.** *Given* describes state (entities, values and their
lifecycle states). *When* is a command. *Then* is an outcome, an event, or an invariant that
held.

**Rejections are invariants.** Each "is rejected when…" acceptance criterion and each
error-handling row names a rule. "Enrollment is rejected once the term has closed" becomes the
invariant *a term must be open to enroll*, owned by an aggregate. Its error is named after the
rule (`TermClosed`, or `TermClosedError` where the language or project suffixes exceptions),
never after the mechanism (`ValidationError 422`).

---

## Language problems in documents

| Problem | Example | Resolution |
|---|---|---|
| Synonyms | The spec says *learner*, the UI says *student*, the model says *user*, all for one party | Propose one term; list the others under Avoid; ask the domain owner |
| Homonyms | *Account* means a login in one section and a billing ledger in another | Split into two terms, or into two bounded contexts |
| Vague verbs | "process the request", "handle the record", "update the status" | Ask what the business calls the action |
| Technical terms in a product document | "insert a row", "set the flag", "the DTO" | Translate to the domain term; ask when there is none |
| Undefined terms | "the hold" is used but never explained | Open question |
| Implicit concepts | A rule described at length with no name — "students who registered after the deadline and have not paid" | Propose a provisional name built from the document's own words; ask |
| Codes instead of names | "status 5", "type B" | Name the state or kind |
| Drift between documents | The spec says *drop*; a plan task says *cancel* | Flag it — whichever document is right, the other one is wrong |
| Drift between documents and code | The spec says *enrollment*; the existing class is `Registration` | Flag it. A code-only name can be renamed inside the feature as an Engineer task, so new code never has to use the old word. A persisted or published name keeps its stored form and is renamed as follow-up, through a migration or a versioned contract. Which one is a scope call for the team |
| Behavior gaps disguised as words | "is skipped" against "is never dropped"; "give the seat" against "offer it with 48 hours to accept" | Not a language issue — a spec gap. Send it back to the human the way an unresolved spec ambiguity goes |

The business owns its words. A modeler decides structure, but never settles a language
conflict by picking one side: it proposes a term, marks it `proposed`, and asks.

**Weigh the sources before calling something a conflict.** Acceptance criteria, Gherkin, the
product's UI copy, and names already persisted outweigh intent prose and a single passing
mention. One stray word against a clear majority is a slip to list under Avoid, not a
question.

---

## Building blocks

Use these patterns where there are rules to protect. A plain create-read-update area with no
invariants needs no aggregates, factories or policies — modeling it as if it did is
speculative generality.

| Block | What it is | Rules in code |
|---|---|---|
| **Entity** | Has an identity and a lifecycle; it changes over time and stays the same thing | Equality by identity. State changes through intention-revealing methods (`enrollment.drop()`), never by setting fields from outside. Guards its own invariants. |
| **Value object** | Defined entirely by its attributes | Immutable; equality by value; operations are side-effect free and return new instances; validated on creation (`Money`, `DateRange`, `PaymentDeadline`). |
| **Aggregate** | A consistency boundary — a cluster changed as one unit, with one root | Outsiders hold a reference to the root only, and to other aggregates by identity only. Invariants inside hold after every transaction. Keep it small. |
| **Domain event** | Something that happened that the domain experts care about | Past tense (`EnrollmentDropped`); immutable; carries the facts its consumers need; the way one aggregate or context reacts to another. |
| **Domain service** | A domain operation that belongs to no single entity | Stateless; named as a domain verb or noun; holds business rules that span aggregates. |
| **Application service** | Orchestrates one use case | Loads aggregates, calls their behavior, persists, publishes events. Owns no business rule. |
| **Repository** | Collection-like access to one aggregate type | One per aggregate root. Methods are domain queries (`findAwaitingPaymentAfter(deadline)`). No rules beyond selection. |
| **Factory** | Builds a valid aggregate when construction is complex | One place for multi-step assembly; the result is valid when it is created. |
| **Policy / specification** | A named business rule as a first-class object or function | Named for the rule (`LatePaymentDropPolicy`, `isEligibleForTransferCredit`); reused wherever the rule applies. |
| **Module** | A grouping of the model | Organised by domain concept or bounded context, never by technical layer alone. |

**Entity or value object?** Ask whether the domain tracks this thing over time by identity,
or only cares about its value. Two $50 refunds to the same student are different refunds
(entities); two $50 amounts are the same amount (a value).

**Aggregate size** (Vernon's rules):

- Model true invariants inside a consistency boundary.
- Design small aggregates.
- Reference other aggregates by identity.
- Use eventual consistency outside the boundary, through domain events.

The aggregate is the smallest cluster whose invariants must hold in a single transaction.

---

## Bounded contexts

A bounded context is the boundary inside which one model, and its language, stays
consistent. Draw one when the same word means different things to different groups, when
two parts of the domain have different lifecycles or different owners, or when one model is
being stretched to serve two purposes.

| Relationship | Meaning |
|---|---|
| Shared kernel | Two contexts share a small part of the model, and change it together |
| Customer / supplier | The downstream context's needs shape the upstream one's plans |
| Conformist | The downstream context adopts the upstream model as it is |
| Anti-corruption layer | The downstream context translates the upstream model into its own language at the boundary |
| Open host service / published language | The upstream context offers a documented protocol for everyone |
| Separate ways | No integration; each solves the problem on its own |

In code: one module, package or service per context. Contexts talk through published
contracts or events, never by importing each other's entities. Translation happens once, at
the boundary. An external system's vocabulary always stays in its adapter.

Introducing a new context, or splitting an existing one, is an architecture decision. It
goes to the human and the architect, not into a feature's model by default.

---

## From domain terms to code names

The model decides the words; the codebase decides the casing and layout. Cite the project's
convention with an example path. Where the project has no precedent, follow its framework's
convention (Django `TextChoices`, a TypeScript string union) and say so.

| Domain concept | Code shape | Example |
|---|---|---|
| Entity / aggregate root | Singular noun | `Enrollment` |
| Value object | Noun | `TuitionAmount`, `PaymentDeadline` |
| Command / behavior | Domain verb, on the entity that owns it | `enrollment.drop()` |
| Query / predicate | Domain question | `enrollment.isAwaitingPayment()`, `term.hasClosed()` |
| Domain event | Past-tense noun phrase | `EnrollmentDropped` |
| Lifecycle state | The domain's word, in the project's enum convention. The code name and the stored value are separate decisions | `AWAITING_PAYMENT`, `DROPPED` |
| Policy / specification | The rule's name | `LatePaymentDropPolicy` |
| Domain service | Domain verb or noun | `transferCredit()`, `CreditTransfer` |
| Repository | Aggregate name + the project's suffix; methods are domain queries | `EnrollmentRepository.findAwaitingPaymentAfter(deadline)` |
| Rejection / error | The broken rule, with the language's or project's suffix convention | `TermClosed`, `PrerequisitesNotMetError` |
| Module / package | The context or concept | `enrollment/`, `billing/` |
| Endpoint | The domain resource or command | `POST /enrollments/{id}/drop` |
| Test name | The business scenario and its outcome | `drops an enrollment still awaiting payment after the deadline` |

**Persisted and published names are one-way doors.** A table, a column, a stored enum value,
an event published outside the process, an API field, a message key — once real data or a
real consumer depends on it, a rename needs a migration, a versioned contract or a
deprecation path. Decide the **words** of these names in the model, before the code, and
mark them as one-way doors. For a state, the stored value is the door, not the code name:
`DROPPED` can be renamed in code, but the `5` already written to the column cannot.

The words are the domain model's call. How they are stored — the table layout, column types,
whether a state is stored as an integer or as text — is the data model's, and the
`data-modeler` agent takes its names from the domain model.

---

## Exploring the model already in the code

Map what exists before proposing anything — the new language reconciles with it, not around
it.

### Where the model lives

| Glob pattern | What it finds |
|---|---|
| `**/domain/**`, `**/entities/**`, `**/models/**`, `**/aggregates/**` | Domain layer |
| `**/services/**`, `**/application/**`, `**/usecases/**`, `**/handlers/**` | Application layer |
| `**/repositories/**`, `**/dal/**`, `**/persistence/**`, `**/infrastructure/**` | Data access |
| `**/dto/**`, `**/dtos/**`, `**/responses/**`, `**/contracts/**`, `**/api/**`, `**/viewmodels/**` | Transfer objects |
| `**/migrations/**`, `**/schema*`, `**/*.sql`, `**/*.prisma` | Persisted names |
| `**/events/**`, `**/messages/**`, `**/*.avsc`, `**/*.proto`, `**/asyncapi*` | Published names |
| `**/i18n/**`, `**/locales/**`, `**/messages/**/*.json` | The words users see |
| `**/glossary*`, `**/ubiquitous-language*`, `**/domain-model*`, `**/product-context*` | Existing vocabulary |

### Persistence markers

| Language | Grep patterns |
|---|---|
| JS/TS | `@Entity`, `@Table`, `@Column`, `@Document`, `sequelize.define`, `mongoose.Schema`, `model ` in `schema.prisma` |
| Python | `models.Model`, `declarative_base`, `Mapped[`, `Column(`, `SQLModel` |
| Ruby | `< ApplicationRecord`, `create_table` |
| C# | `[Table]`, `[Key]`, `[Column]`, `DbContext`, `DbSet<` |
| Java / Kotlin | `@Entity`, `@Table`, `@MappedSuperclass`, `@Repository` |

### Boundary entry points

| Language | Grep patterns |
|---|---|
| JS/TS | `express`, `fastify`, `Router(`, `@Controller`, `Request, Response` |
| Python | `@app.route`, `APIRouter`, `@api_view`, `urlpatterns` |
| C# | `ControllerBase`, `[ApiController]`, `IActionResult` |
| Java / Kotlin | `@RestController`, `@Controller`, `@RequestMapping` |

### Application services

| Language | Signals |
|---|---|
| JS/TS | `@Injectable`, `@Service`, class names ending in `Service` |
| Python | Modules or classes named `*_service`, `*Service`, `use_cases` |
| C# | Class names ending in `Service`, `Handler`, `UseCase` |
| Java / Kotlin | `@Service`, `@Component`, class names ending in `Service`, `Handler` |

---

## Anti-patterns in code

Each of these shows the model has leaked out of the domain layer or rotted inside it. Flag
only what you can point to, with `path:line`.

### Business logic in the wrong place

| Wrong location | Signal |
|---|---|
| Controllers, routes, UI | Discount calculations, validation rules, authorization decisions in a handler or component |
| Repositories, data access | Business rules inside queries, computed columns, trigger-like logic |
| Application services | Rules that belong on an entity or a domain service — application services orchestrate; they do not decide |

A domain service that owns a rule spanning several aggregates is legitimate — do not flag it.

### Anemic domain model

Entities that are pure data holders while services hold all the behavior:

- An entity with many properties and no methods beyond accessors.
- Service methods that take an entity, inspect its state, and return a decision about it.
- Callers setting state directly (`enrollment.status = 'dropped'`) instead of calling an
  intention-revealing method (`enrollment.drop()`).

### Abstraction leaks

| Leak | Signal |
|---|---|
| Persistence in the domain | Domain objects carrying `@Column`, `[Table]`, or ORM base classes, where the project separates them |
| HTTP in the domain | Domain objects importing `Request`, `Response`, or status codes |
| Infrastructure in the domain | The domain layer importing database clients, queues, file I/O |

### Boundary violations

| Violation | Signal |
|---|---|
| Missing transfer objects | Domain entities returned directly from API endpoints |
| Cross-context coupling | One context importing another's entities instead of using its events or published contract |
| Aggregate bypass | Callers reaching into an aggregate's children directly, or changing two aggregates in one transaction to keep a rule true |

### Implicit concepts — a missing policy or specification

| Signal | What it implies |
|---|---|
| The same multi-clause condition (`if a && b && !c`) in two or more places | A rule the experts already have a name for — extract it as a policy or specification |
| A rule stated in a comment and enforced ad hoc | The concept exists in the language but not in the model |
| A boolean method on a service that inspects another object's fields | Tell-don't-ask, and a candidate specification owned by the domain |

One local condition is not a missing specification.

### Missing value objects

Domain values passed around as primitives: money as a float, a deadline as a bare string,
a state as an integer code, an email as an unchecked string. The rules for that value end up
scattered around the code, or missing altogether.

### Construction without invariants — a missing factory

| Signal | What it implies |
|---|---|
| A public constructor or object literal that lets a caller build an invalid aggregate — a required field unset, two fields that must agree set independently | The construction invariant is unenforced |
| The same multi-step assembly repeated across call sites | Creation belongs in one factory |

Do not flag simple objects that are valid by plain construction.

### Supple design smells (domain types only)

| Smell | Signal | Fix direction |
|---|---|---|
| Not intention-revealing | A domain method named for *how*, not *what* (`recalc`, `doProcess`), or a boolean flag that switches behavior (`price(true)`) | Rename to the domain verb; split the two behaviors |
| Side effect in a query | A method on an entity or value object that both mutates and returns | Separate the command from the query |
| Mutable value object | A value type with setters or in-place mutation | Make it immutable; return new instances |
| Unenforced invariant | Callers assert the rule instead of the entity guarding it | Move the invariant into the type |

### Language drift

- One concept with different names across modules — `Enrollment`, `Registration`, `Signup`.
- Code names that contradict the model's code names, or appear in its Avoid column.
- Generic names (`process`, `handle`, `data`, `info`, `manager`) where the model has a term.

Judge terminology against the model or the documents. Without either, flag only
inconsistency you can observe in the code. Never call a term wrong based on business language
you assume.

---

## Severity

| Severity | When |
|---|---|
| **Critical** | Something that breaks the model's guarantees or is expensive to undo. Examples: an invariant that callers can break from outside the aggregate; a context importing another's entities; a domain entity exposed directly on a public API; a persisted or published name that contradicts the model; a domain term used with the wrong meaning. |
| **Warning** | Misplaced logic or a missing abstraction that adds friction. Examples: an anemic entity; a rule duplicated instead of named; language drift inside one context; a missing value object for a value with rules. |
| **Suggestion** | A modeling improvement with no immediate harm. |

Every finding also carries a confidence:

- **High** — mechanical: rename to the model's term, add the missing transfer object.
- **Medium** — the direction is clear, but splitting work between an entity and a service has
  trade-offs.
- **Needs a human** — aggregate boundaries and bounded contexts.

---

## Sources

- Eric Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software* (2003),
  and *Domain-Driven Design Reference* (2015).
- Vaughn Vernon, *Implementing Domain-Driven Design* (2013), and *Effective Aggregate Design*
  (2011).
- Martin Fowler, bliki: *UbiquitousLanguage*, *BoundedContext*, *AnemicDomainModel*,
  *ValueObject*, *DDD_Aggregate*.
- Alberto Brandolini, *Introducing EventStorming* — discovering domain events from the
  business's own past-tense language.
- Adapted in part from Bryan Finster's *agentic-dev-team* (MIT): `knowledge/domain-modeling.md`
  and `agents/domain-review.md` — the exploration patterns, the code anti-patterns, and the
  severity and confidence scheme.
