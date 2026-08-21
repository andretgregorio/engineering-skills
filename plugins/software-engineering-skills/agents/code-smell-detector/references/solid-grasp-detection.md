# SOLID and GRASP Principle Violation Detection

## SOLID Violations

### S — Single Responsibility Principle (SRP)
**Indicators**: Large Class (>500 lines Java, >300 Python), Divergent Change, God Object, methods at mixed abstraction levels.
**Patterns**: Mixed concerns (UI + business + data), "and" in class names, imports from many domains.
```bash
find . -name "*.java" -exec wc -l {} + | awk '$1 > 500' | sort -nr
find . -name "*.py" -exec wc -l {} + | awk '$1 > 300' | sort -nr
```

### O — Open/Closed Principle (OCP)
**Indicators**: Switch statements on types, instanceof/typeof checks, hardcoded dependencies, modification needed for extension.
```bash
grep -r "switch\s*(" --include="*.java" --include="*.js" --include="*.ts"
grep -r "instanceof\|typeof" --include="*.java" --include="*.js"
```

### L — Liskov Substitution Principle (LSP)
**Indicators**: Refused Bequest, subclass throwing exceptions parent doesn't, empty/null override implementations.
```bash
grep -r "UnsupportedOperationException\|NotImplementedException" .
grep -r "throw.*not.*implement\|throw.*support" -i .
```

### I — Interface Segregation Principle (ISP)
**Indicators**: Fat interfaces (>10 methods), empty implementations, clients depending on unused methods.
```bash
grep -r "interface.*{" --include="*.ts" -A 30 | grep -c "("
```

### D — Dependency Inversion Principle (DIP)
**Indicators**: Direct instantiation of concrete classes, imports of implementations, DB/file calls in business logic.
```bash
grep -r "new [A-Z].*(" --include="*.java" --include="*.js" --include="*.ts"
grep -r "import.*\.impl\.\|import.*\.concrete\." .
```

## GRASP Violations

### Information Expert
**Violation**: Feature Envy, Data Class, Anemic Domain Model.
```bash
grep -r "\.get.*\.get.*\.get" .   # getter chains
```

### Creator
**Violation**: Objects creating instances they shouldn't; factory in wrong place.

### Controller
**Violation**: Bloated controllers with business logic; UI logic in controller layer.
```bash
find . -name "*Controller*" -exec wc -l {} + | awk '$1 > 200'
```

### Low Coupling
**Violation**: Message chains, intimate classes, global dependencies.
```bash
grep -r "\.[a-zA-Z]*\.[a-zA-Z]*\.[a-zA-Z]*\.[a-zA-Z]*" --include="*.ts" --include="*.java"
```

### High Cohesion
**Violation**: Classes with unrelated methods, utility classes, mixed abstraction levels.
```bash
grep -r "class.*Util\|class.*Helper" .
```

### Polymorphism
**Violation**: Type switching, instanceof checks, parallel inheritance hierarchies.
```bash
grep -r "if.*instanceof\|if.*typeof" .
grep -r "switch.*getClass\|switch.*type" .
```

### Pure Fabrication
**Violation**: Business logic in infrastructure (DAO/Repository/UI).

### Indirection / Protected Variations
**Violation**: Direct coupling between layers, missing interfaces, hardcoded algorithms.
```bash
grep -r "new File\|new Date\|new URL" .
grep -r "static.*=\|global " .
grep -r "singleton\|Singleton" -i .
```

## Severity Hierarchy

| Severity | Smells |
|----------|--------|
| **High (Architectural)** | Global Data, Shotgun Surgery, Base Class depends on Subclass, Feature Envy, Large Class, Combinatorial Explosion |
| **Moderate (Design)** | Clever Code, Duplicated Code, Magic Number, Primitive Obsession, Long Method, Callback Hell, Message Chain |
| **Low-Medium (Readability)** | Fallacious Comment, Boolean Blindness, Dead Code, Speculative Generality |
