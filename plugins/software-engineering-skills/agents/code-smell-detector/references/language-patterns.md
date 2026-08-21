# Language-Specific Detection Patterns

## Python
- Long Method: >20 lines (Pythonic threshold)
- Magic Number: Hardcoded values not in `CONSTANTS`
- Global Data: module-level variables, excessive use of `global`
- Primitive Obsession: strings for dates instead of `datetime` objects

## JavaScript / TypeScript
- Callback Hell: >3 levels of nested callbacks
- Feature Envy: excessive use of other object's properties
- Magic Number: hardcoded numbers not in `const` declarations
- Dead Code: unreachable code after `return` statements

## Java
- Large Class: >500 lines or >20 methods
- Long Parameter List: >3 parameters (considering overloading)
- Refused Bequest: `@Override` that throws `UnsupportedOperationException`
- Primitive Obsession: String/int where custom types would be better

## Go
- Long Method: >50 lines (Go idiom allows longer functions)
- Global Data: package-level variables without clear necessity
- Error handling: ignored errors or excessive error checking

## Rust
- Primitive Obsession: using basic types instead of newtype patterns
- Clone abuse: unnecessary `.clone()` calls
- Unwrap overuse: `.unwrap()` instead of proper error handling

## General Discovery Commands

```bash
# Find large files
find . -name "*.py" -exec wc -l {} + | sort -nr | head -10
find . -name "*.ts" -exec wc -l {} + | sort -nr | head -10

# Find duplicate patterns
grep -r "TODO\|FIXME\|XXX" .

# Find import patterns
grep -r "import.*from" --include="*.ts" | sort | uniq -c | sort -nr | head -20

# Find class definitions
grep -r "class " --include="*.ts" --include="*.js" --include="*.py" -l

# Find switch statements (OCP violations)
grep -rn "switch\s*(" --include="*.ts" --include="*.js"

# Find getter chains (Feature Envy / Law of Demeter)
grep -rn "\.[a-zA-Z]*\.[a-zA-Z]*\.[a-zA-Z]*\." --include="*.ts"
```
