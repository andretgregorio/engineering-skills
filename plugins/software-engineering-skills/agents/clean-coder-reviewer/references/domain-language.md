# Domain Language Reference

Every review checks this, on every scope, however small. It is never skipped, and never folded into "Naming" as an afterthought.

Sources: Eric Evans — *Domain-Driven Design* (2003), the *Ubiquitous Language*; Robert C. Martin — *Clean Code* (2008), "Use Problem Domain Names".

---

## 1. The Rule

**Code is written in the language of the product, not the language of the machine.** A name says what something *means to the business* — not what the code technically does to it, how it is stored, or which data structure holds it.

| Technical language (flag) | Domain language (expected) |
|---|---|
| `processData(rows)` | `enrollStudents(applicants)` |
| `filteredList` | `openCourses` |
| `updateRecord(id, { status: 4 })` | `withdrawFromCourse(enrollment)` |
| `isValid` | `meetsPrerequisites` |
| `handleResponse(json)` | `recordPaymentConfirmation(confirmation)` |
| `flag` | `isLateRegistration` |
| `checkDate()` | `hasTermClosed()` |
| `test('returns 400 when repo returns null')` | `test('rejects enrollment once the term has closed')` |

```js
// Technical language — describes what the machine does
function processRows(rows) {
  const filtered = rows.filter((r) => r.status === 2 && r.dueDate < now);
  return updateRecords(filtered, { status: 5 });
}

// Domain language — states the business rule
function dropUnpaidEnrollments(enrollments) {
  const pastPaymentDeadline = enrollments.filter(
    (enrollment) => enrollment.isAwaitingPayment() && enrollment.paymentDeadline < now,
  );
  return pastPaymentDeadline.map((enrollment) => enrollment.drop());
}
```

Ask of every name: **could a product manager or domain expert read it aloud and recognise what it is about, without knowing how it is implemented?** In business code, the answer must be yes.

Why it matters:

- **The rule is visible.** `hasTermClosed()` states a business rule; `checkDate()` hides it. Code can only be compared to its spec when both use the same words.
- **The conversation works.** Product, QA, and engineering discuss the code and its tests in the words they already share — and a mismatch with the spec surfaces as a mismatched word.
- **Names stay true.** A technical name describes an implementation, so it lies the day the implementation changes (`userList` becomes a `Set`; `fetchFromDb` starts reading a cache). A domain name describes a meaning, which changes only when the business does.
- **Generic names attract unrelated code.** `processData`, `utils`, `manager` accept anything; `enrollStudents` only accepts enrollment.

---

## 2. Establish the Vocabulary First

Before judging a single name, collect the domain's own words. Read, in order of authority, whichever exist:

1. **The domain model** — `domain-model.md`, written by the `domain-modeler` agent and saved beside the spec. When it exists, it is the vocabulary: its **Code name** column is the name the code must use, and its **Avoid** column lists the names it must not. Use the sources below only for what it does not cover. Its `proposed` and `provisional` terms are still open questions, so a finding that rests on one is a Suggestion.
2. **The spec and plan for this change** — `feature-description.md`, the spec artifacts, the plan and its tasks, acceptance criteria and Gherkin scenarios. When the caller passes their paths, read them; when it does not, look for them (`docs/`, `specs/`, a plan named in the branch or the commits).
3. **The project's domain glossary** — a glossary, product-context, or ubiquitous-language document.
4. **The product's own surface** — UI copy, i18n and message files, API documentation, user-facing errors, help text. These are the words users actually see.
5. **The established model in the code** — entity and type names, enum values, database tables and columns, event names.
6. **The ticket, PR description, and commit messages** for the change.

**The scope under review is never a source.** Its names are what is being judged, so a scope that contradicts the spec is a finding, not a conflict.

Write the vocabulary down: term → meaning → source. Note every **conflict** between sources (the spec says *learner*, the UI says *student*, the model says *user*). A conflict is raised as a question for the domain owner — the reviewer never settles it by picking one.

If no source exists, infer the vocabulary from the product's surface and the model in the code, say so in the report, and recommend running the `domain-modeler` agent. An inferred vocabulary is weaker evidence: its findings are Suggestions unless a term is plainly wrong.

---

## 3. What to Check

Every name the scope **introduces or changes**. When the scope is a diff, those are the names the diff adds or renames. When it is whole files with no diff, they are every name those files define. Names defined outside the scope that it merely uses — a persisted column, another module's method — are notes, never findings (§6).

| Element | Domain language looks like |
|---|---|
| Modules, packages, files, folders | Organised by domain concept (`enrollment/`, `billing/`), not only by technical layer (`utils/`, `helpers/`, `misc/`) |
| Classes, types, interfaces | Domain nouns (`Enrollment`, `Term`, `TuitionInvoice`), not `DataObject`, `Info`, `Manager`, `Processor` |
| Functions and methods | The business action or question (`enroll`, `withdraw`, `waiveLateFee`, `hasTermClosed`), not the mechanics (`process`, `handle`, `update`, `execute`, `run`) |
| Variables and parameters | What the value *is* in the domain (`eligibleStudents`, `refundableAmount`), not its type or container (`list`, `arr`, `map`, `data`, `result`, `payload`, `tmp`) |
| Booleans and predicates | The business condition (`isLateRegistration`, `meetsPrerequisites`), not `flag`, `ok`, `valid`, `check` |
| Constants and enum values | The business meaning (`MAX_CREDITS_PER_TERM`, `WAITLISTED`), not a code (`LIMIT_1`, `STATUS_3`, `TYPE_B`) |
| Events, messages, endpoints, queues | Something that happened, or is asked for, in the domain (`StudentEnrolled`, `POST /enrollments`), not `DataUpdated`, `/process`, `record-changed` |
| Test names | The business scenario and its outcome (`rejects enrollment once the term has closed`), not the mechanism (`returns 400 when repo returns null`) |
| User-facing messages | The user's words — never internal jargon, exception class names, or status codes |
| Comments and log messages | The domain event or reason first; technical detail may follow as context |

Then check the names **against the vocabulary**:

- **One concept, one word.** The scope does not introduce a second name for a concept the domain already names (`customer` beside an existing `client` for the same party).
- **One word, one concept.** The scope does not reuse a domain word for something else (`order` meaning a sort order, where an Order is a purchase).
- **No invented terms.** No word the domain does not use, for a concept it already names.
- **New concepts get named, not guessed.** When the code needs a concept the vocabulary lacks, record an *unnamed domain concept* question for the domain owner, with the provisional name the code uses. The reviewer does not invent the official term.

---

## 4. Technical-Language Signals

In business code, these words usually mean a name describes the mechanism instead of the meaning. They are signals to inspect, not automatic findings — `calculateTuition` is fine; `calculate` alone is not.

| Signal family | Examples |
|---|---|
| Vague action verbs | `process`, `handle`, `manage`, `do`, `perform`, `execute`, `run`, `apply` — with no domain object |
| Generic CRUD where the business has a richer verb | `update`, `set`, `modify`, `change`, `delete` — when the domain says `withdraw`, `reschedule`, `cancel`, `archive` |
| Data-structure and container words | `list`, `array`, `arr`, `map`, `dict`, `set`, `collection`, `tuple`, `items`, `entries` |
| Shapeless data words | `data`, `info`, `obj`, `record`, `row`, `entity`, `dto`, `payload`, `json`, `value`, `result`, `res`, `response` |
| Storage and transport words | `db`, `table`, `query`, `fetch`, `insert`, `upsert`, `persist`, `cache`, `http`, `request`, `api` |
| Control-state words | `flag`, `mode`, `type`, `kind`, `status` (where the domain has named states), `check`, `valid`, `ok`, `tmp`, `temp` |
| Type encodings | `nameString`, `amountNumber`, `studentObj`, `idList` |
| Catch-all containers | `Manager`, `Helper`, `Util(s)`, `Common`, `Misc`, `Base`, `Processor`, `Handler`, a bare `Service` |

---

## 5. Where Technical Language Is Legitimate

The rule governs **business code**. Technical vocabulary is acceptable only where the code's own job is technical — and even there, the *subject* it works on keeps its domain name.

| Situation | Acceptable | Still flag |
|---|---|---|
| Infrastructure and adapters — repositories, HTTP clients, queue consumers, ORM mappings | The mechanism word on a domain noun: `EnrollmentRepository`, `PaymentGatewayClient`, `findOpenEnrollments` | A shapeless subject: `DataRepository`, `getRecords`, `ApiService` |
| Generic utilities with no domain meaning | `retry`, `debounce`, `chunk`, `formatIsoDate` | A "utility" that encodes a business rule (`utils.calcFee`) — it belongs in the domain, named as the rule |
| Framework- or protocol-mandated names | `componentDidMount`, `ngOnInit`, the exported `handler` a runtime requires, `toJSON` | What those names call — the body still delegates to domain-named code |
| An external system's vocabulary, mirrored verbatim at the boundary so it can be compared to what that system sends | Stripe's `requires_action`, an HL7 segment name | The external term leaking past the boundary into business code — translate it once, in the adapter |
| Tightly scoped throwaway locals | A loop index `i`; `(a, b) => a - b` in a one-line comparator | A lambda parameter in multi-line business logic: `items.filter((x) => x.s === 2 && x.d < now)` |
| Code whose domain *is* technical — a migration runner, a build tool, a caching layer | That technical domain's own vocabulary | The business concepts it touches, named technically: a migration adding `col_a` for what the domain calls the *enrollment deadline* |

When in doubt, apply the read-aloud test: if a line exists because of a business rule, its names state the rule.

---

## 6. Existing Code and Renames

- **An existing technical-named pattern is not a licence.** "Consistency beats perfection" (`pragmatic-considerations.md` §4) governs style; it never makes new technical names acceptable. New code uses the domain term even when its neighbours do not.
- **Names the scope did not touch are notes, never blockers.** Recommend renaming the whole pattern as follow-up work, not one occurrence in isolation.
- **Check whether a name is persisted or published before suggesting a rename.** A database column, a stored enum value, a published event name, a public API field, or a message key cannot be renamed with find-and-replace — it needs a migration, a versioned contract, or a deprecation path. Say so in the suggested fix. A name that lives only in code can be renamed freely.
- **Watch for a stored value and a domain name on the same line.** A blanket rename that sweeps both breaks the stored side silently.

---

## 7. Severity

| Severity | When |
|---|---|
| **Critical** | A name that **misstates the domain** — a domain word used with the wrong meaning, or a concept named with the term the domain reserves for another. Or a technical name on a **public surface of business code** — an exported function or type, an API endpoint or field, an event, a database column, a stored enum value — because it spreads to every caller, and renaming it later costs a migration. |
| **Warning** | An internal name in business code that describes the mechanism instead of the meaning (`processData`, `filteredList`, `flag`, `result`). A second name for a concept the domain already names. A test name that describes the mechanism instead of the business scenario. |
| **Suggestion** | A domain term is used, but the vocabulary has a more precise one (`student` where the rule applies only to an `enrolledStudent`). A finding that rests only on an inferred vocabulary. |

Conflicting sources and unnamed concepts are not severities — they are **questions for the domain owner**, listed in the report's Domain Language section.

---

## 8. Reporting

The report's **Domain Language** section is mandatory, even when there are no findings — it is the evidence that the check ran:

- the vocabulary sources read — or that none existed and the vocabulary was inferred, and from what;
- the domain terms the scope uses, each mapped to its names in the code;
- the questions for the domain owner — conflicting sources and unnamed concepts;
- the notes — technical names outside the scope that it uses, recommended for a later rename;
- one line of verdict: *the scope speaks the domain language*, or the IDs of the domain-language findings that say where it does not.

Each violation is an ordinary finding in the Findings section, with **Principle: Domain Language** and a before/after that uses the vocabulary's own term:

- **One finding per pattern, not per occurrence.** Five shapeless locals in one function are one finding listing all five, not five findings.
- **No term in the vocabulary? Use a provisional one.** Build the suggested name from the spec's own phrasing (`freeSeatForWaitlist`, from "frees the seat for the waitlist"), label it *provisional*, and raise the matching question. The fix stays concrete without the reviewer inventing the official term.
