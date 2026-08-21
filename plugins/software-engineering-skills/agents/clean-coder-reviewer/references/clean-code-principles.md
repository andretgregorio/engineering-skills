# Clean Code Principles Reference

Source: Robert C. Martin — *Clean Code: A Handbook of Agile Software Craftsmanship* (2008)

---

## 1. Meaningful Names

### Rules
- **Reveal intent**: the name should tell you why it exists, what it does, and how it is used. If a name requires a comment, the name is not revealing intent.
- **Avoid disinformation**: avoid names that convey false meanings (e.g., `accountList` when it is not a `List`).
- **Make meaningful distinctions**: `a1`, `a2` or `ProductInfo` vs `ProductData` communicate nothing distinctive.
- **Use pronounceable names**: `genymdhms` vs `generationTimestamp`.
- **Use searchable names**: single-letter names and magic numbers are hard to grep; prefer named constants.
- **Avoid encodings**: Hungarian notation, member prefixes (`m_`), interface prefixes (`IFoo`) pollute names.
- **Avoid mental mapping**: a reader should not have to mentally translate your name into what it means.
- **Class names are nouns**: `Customer`, `Account`, `WikiPage`. Avoid `Manager`, `Processor`, `Data`, `Info` — they are vague.
- **Method names are verbs**: `postPayment`, `deletePage`, `save`. Accessors/mutators/predicates follow `get`/`set`/`is` conventions.
- **One word per concept**: don't use `fetch`, `retrieve`, and `get` interchangeably for the same operation across the codebase.
- **Don't pun**: using the same word to mean two different things (e.g., `add` for both collection-append and arithmetic) is a pun.
- **Solution domain names are acceptable**: `AccountVisitor`, `JobQueue` — readers are programmers and understand CS terms.
- **Problem domain names**: when no programming term exists, use the domain language.
- **Add meaningful context**: `firstName`, `lastName`, `street`, `city`, `state` form an address — prefix if needed: `addrState`.
- **Avoid gratuitous context**: don't prefix every class in a project with the project acronym.

---

## 2. Functions

### Rules
- **Do one thing**: a function should do one thing, do it well, and do it only.
- **One level of abstraction per function**: mixing high-level and low-level operations in the same function is confusing.
- **Read top-down (The Stepdown Rule)**: each function is followed by those at the next level of abstraction so the code reads like a top-down narrative.
- **Descriptive names**: a long descriptive name is better than a short enigmatic one. A long descriptive name is better than a long descriptive comment.
- **Minimise arguments**: zero is ideal; one or two is fine; three requires justification; more than three should be refactored into an argument object.
- **Avoid flag arguments**: passing a boolean to a function is a smell — it implies the function does more than one thing.
- **No side effects**: a function that is named `checkPassword` should not initialise a session as a side effect.
- **Command-Query Separation**: a function should either *do something* or *answer something*, never both.
- **Prefer exceptions to error codes**: returning error codes leads to deeply nested structures; exceptions allow clean separation.
- **Don't repeat yourself (DRY)**: duplication may be the root of all evil in software; every piece of knowledge must have a single, unambiguous representation.
- **Structured programming**: one entry, one exit per block (Dijkstra). In small functions this is rarely an issue.

> **Size — see `pragmatic-considerations.md`**: The "small" rule is a principle, not a law. Cohesion and a single level of abstraction are the real targets. A well-written function of 30–50 lines can be cleaner than six poorly-named 5-line helpers scattered across files.

---

## 3. Comments

### Good Comments
- **Legal comments**: copyright, licence headers.
- **Informative comments**: when the code cannot express the intent clearly (e.g., a regex pattern).
- **Explanation of intent**: why a decision was made, not what the code does.
- **Clarification**: translating the meaning of an obscure argument or return value.
- **Warning of consequences**: `// Don't run this in parallel — not thread-safe`.
- **TODO comments**: short-lived notes for known future work. Remove when done.
- **Amplification**: calling out something that seems unimportant but is not.
- **Public API docs** (Javadoc, JSDoc, docstrings): valuable for library/public interfaces.

### Bad Comments
- **Mumbling**: comments written hastily with no clear message.
- **Redundant comments**: `i++; // increment i` — the comment says nothing the code doesn't.
- **Misleading comments**: comments that are subtly wrong.
- **Mandated comments**: a rule that every function must have a Javadoc comment produces noise.
- **Journal comments**: changelog entries in the source file — that's what VCS is for.
- **Noise comments**: `// Default constructor` on a default constructor.
- **Position markers**: `// ///////// Actions /////////` — use code structure instead.
- **Closing brace comments**: `} // end of if` — shorten the function instead.
- **Attributions and bylines**: VCS tracks authorship.
- **Commented-out code**: delete it. VCS remembers it.
- **HTML in comments**: unreadable in the editor.
- **Non-local information**: a comment that describes something far away from where it appears.
- **Inobvious connection**: the comment and the code it describes should be obviously related.

---

## 4. Formatting

### Vertical Formatting
- **Vertical openness between concepts**: blank lines separate logically distinct blocks.
- **Vertical density**: lines closely related should be vertically close.
- **Vertical distance**: concepts closely related should be near each other in the file.
  - Variables declared close to their use.
  - Instance variables declared at the top of a class (Java/C++) or consistently grouped.
  - Dependent functions near each other.
  - Conceptual affinity: similar operations grouped together.
- **Vertical ordering**: caller above callee — the source reads top-down.

### Horizontal Formatting
- **Line length**: aim for ≤120 characters; never exceed 160.
- **Horizontal openness**: spaces around operators clarify precedence.
- **Horizontal alignment**: don't align variable declarations in columns — it draws the eye to the wrong thing.
- **Indentation**: reveals structure. Never collapse blocks to a single line to save space.

### Team Rules
- The team decides on a coding standard and everyone adheres to it. Consistency beats individual preference.

---

## 5. Objects and Data Structures

### Data Abstraction
- Expose *behaviour*, not *data*. A class should hide its data behind abstractions.
- Don't reflexively add getters and setters to every field.

### The Law of Demeter
- A method `f` of class `C` should only call methods of: `C` itself, objects passed as arguments to `f`, objects `f` creates, and direct component objects of `C`.
- **Train wrecks** (`a.getB().getC().doSomething()`) violate Demeter.

### Data Transfer Objects (DTOs)
- Pure data structures (structs / DTOs) with no behaviour are fine. Don't mix behaviour into them.
- **Active Record anti-pattern**: business logic in a DTO/record is a design smell.

---

## 6. Error Handling

- **Use exceptions, not return codes**: return codes clutter callers with checks.
- **Write Try-Catch-Finally first**: establish the exception contract before the happy path.
- **Use unchecked exceptions** (in Java): checked exceptions break encapsulation across layers.
- **Provide context in exceptions**: include enough information to diagnose the problem.
- **Define exception classes by caller needs**: one wrapper class per external library is often enough.
- **Use the Special Case pattern**: return a special-case object instead of returning null or throwing.
- **Don't return null**: returning null forces callers to null-check; throw or use Optional/Maybe.
- **Don't pass null**: passing null into functions is worse than returning it; guard at the boundary.

---

## 7. Boundaries

- **Wrap third-party APIs**: limit the surface area of external dependencies. Isolates from library changes.
- **Learning tests**: write tests against a new library to understand it and detect breaking updates.
- **Clean boundaries**: keep the code that knows about third-party tools from spreading across the codebase.

---

## 8. Unit Tests

### The Three Laws of TDD
1. You may not write production code until you have a failing unit test.
2. You may not write more of a unit test than is sufficient to fail.
3. You may not write more production code than is sufficient to pass the failing test.

### Test Quality
- **Tests enable change**: dirty tests are worse than no tests because they prevent change.
- **One concept per test**: tests should test one thing, not a dozen.
- **FIRST**:
  - **Fast** — tests that run slowly won't be run.
  - **Independent** — tests must not depend on each other.
  - **Repeatable** — tests should run in any environment.
  - **Self-validating** — pass or fail, no manual inspection.
  - **Timely** — write tests just before the production code that makes them pass.
- **Readable test names**: test names serve as documentation; they should read like a specification.

---

## 9. Classes

- **Small** (but measured by *responsibilities*, not line count): a class should have one reason to change.
- **Single Responsibility Principle (SRP)**: the most important class-level principle.
- **High cohesion**: the instance variables of a class should be used by most of its methods.
- **Low coupling**: classes should know as little as possible about each other.
- **Organise for change**: the Open/Closed Principle — easy to extend, hard to modify.
- **Dependency inversion**: depend on abstractions, not concretions.

---

## 10. SOLID Principles

| Principle | Statement | Violation Signal |
|-----------|-----------|-----------------|
| **Single Responsibility (SRP)** | A class should have only one reason to change | Large classes doing many things; "Manager", "Helper" classes |
| **Open/Closed (OCP)** | Open for extension, closed for modification | Switch statements on type tags; if-else chains that grow with new types |
| **Liskov Substitution (LSP)** | Subtypes must be substitutable for their base types | Subclass throws exceptions the base class doesn't; overrides that weaken contracts |
| **Interface Segregation (ISP)** | Clients should not be forced to depend on interfaces they don't use | Fat interfaces with many unrelated methods; implementors that leave methods empty or throw |
| **Dependency Inversion (DIP)** | Depend on abstractions, not concretions | `new` inside business logic; hard-coded infrastructure dependencies |

---

## 11. Systems

- **Separate construction from use**: the startup process of building objects is distinct from their use.
- **Use Dependency Injection**: move construction responsibility to `main` or a DI container.
- **Scaling up**: systems grow; design for change, not for the imagined final state.
- **Optimise decision making**: postpone decisions to the last responsible moment.
- **Use standards wisely**: standards add value when they reduce friction, not when they add ceremony.
- **Domain Specific Languages (DSLs)**: well-written code reads like a DSL for the problem domain.

---

## 12. Emergence (Kent Beck's Simple Design Rules)

A design is simple if it:
1. Runs all the tests.
2. Contains no duplication.
3. Expresses the intent of the programmer.
4. Minimises the number of classes and methods.

These rules are ordered by priority. Rule 1 is non-negotiable. Rules 2–4 guide all refactoring.
