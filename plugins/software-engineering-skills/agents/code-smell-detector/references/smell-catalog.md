# Complete Code Smell Catalog (50+ Smells)

## Structural & Size Smells (Bloaters)

- **Large Class (God Object)**: Too many responsibilities, violates SRP
- **Long Method**: Too many lines, hard to reason about. >20 lines (Python), >50 lines (JS/TS)
- **Long Parameter List**: 3+ parameters indicate SRP violation
- **Lazy Element**: Doesn't contribute enough value to justify its complexity
- **Middle Man**: Class primarily delegates to other classes
- **Dead Code**: Never executed (commented-out, unreachable conditions), violates YAGNI
- **Null Check**: Excessive null checking throughout code

## Data & Primitive Smells (Data Dealers)

- **Primitive Obsession**: Simple types for complex concepts (string for date vs Date object)
- **Data Clump**: Related variables repeatedly passed separately instead of as an object
- **Magic Number**: Unexplained numeric literals lacking context
- **Global Data**: Data in global scope, hard to test, violates encapsulation
- **Mutable Data**: Structures that can be modified → unpredictable side effects
- **Temporary Field**: Variable only used in specific situations
- **Status Variable**: Variables controlling flow instead of proper control structures

## Method & Behavior Smells (Change Preventers / Couplers)

- **Feature Envy**: Method uses more features of another class than its own → tight coupling
- **Side Effects**: Methods modifying state in unexpected ways
- **Hidden Dependencies**: Methods silently resolving dependencies
- **Duplicated Code**: Identical/similar code blocks repeated. "Redundant code is one of the worst smells."
- **Shotgun Surgery**: Single change requires modifying multiple classes
- **Divergent Change**: Single class has multiple unrelated responsibilities

## Naming & Communication Smells (Lexical Abusers)

- **Uncommunicative Name**: Names don't express purpose or intent
- **Inconsistent Names**: Method/class names lack standardization across project
- **Fallacious Method Name**: Name doesn't accurately describe what method does
- **Type Embedded in Name**: Including type information redundantly in variable names
- **Binary Operator in Name**: Using "and"/"or" in names inappropriately
- **Fallacious Comment**: Misleading or mismatched comments
- **Boolean Blindness**: `Bool` loses contextual meaning; replace with descriptive types
- **Magic Number**: Hardcoded values not in named constants

## Object-Oriented Design Smells (OO Abusers)

- **Refused Bequest**: Subclass inherits but uses only subset of methods → LSP violation
- **Base Class Depends on Subclass**: Parent classes knowing about children
- **Inappropriate Static**: Static methods/variables used inappropriately
- **Alternative Classes with Different Interfaces**: Similar functionality, different interfaces → DRY violation
- **Incomplete Library Class**: Library classes not providing all needed functionality

## Control Flow & Logic Smells (Obfuscators)

- **Conditional Complexity**: Overly complex conditional statements
- **Complicated Boolean Expression**: Boolean logic hard to understand
- **Complicated Regex Expression**: Regex hard to read and maintain
- **Callback Hell**: Deeply nested callbacks; >3 levels in JS/TS
- **Flag Argument**: Boolean parameters controlling method behavior

## Coupling & Dependency Smells (Couplers)

- **Message Chain**: Object traverses multiple intermediate objects (`self._location.field.is_frontline()`)
- **Insider Trading**: Classes accessing internal details of other classes
- **Tramp Data**: Data passed through multiple methods without being used
- **Parallel Inheritance Hierarchies**: Creating a subclass requires subclasses in related hierarchies

## Code Organization Smells (Dispensables)

- **Speculative Generality**: Anticipating future needs that never materialize → YAGNI violation
- **Dubious Abstraction**: Abstractions that don't add value
- **Indecent Exposure**: Making internal implementation details public
- **Oddball Solution**: Solving the same problem differently in different places

## Implementation & Style Smells

- **Clever Code**: Complexity that prioritizes showing off over clarity
- **Imperative Loops**: Traditional loops instead of expressive functional approaches
- **Inconsistent Style**: Different coding styles used inconsistently
- **Obscured Intent**: Purpose not clear from reading the code

## Testing & Maintenance Smells

- **Required Setup or Teardown Code**: Tests requiring complex setup/cleanup
- **Afraid to Fail**: Unnecessary status checks and complex error handling, violating fail-fast
- **Special Case**: Code handling special cases instead of generalizing

## Design Pattern & Architecture Smells

- **Combinatorial Explosion**: Exponential growth in classes or methods
- **Fate Over Action**: Passive objects that have things done to them
- **What Comment**: Comments explaining WHAT instead of WHY

## Category Summary

| Category | Smells |
|----------|--------|
| **BLOATERS** | Large Class, Long Method, Long Parameter List, Data Clump, Null Check |
| **CHANGE PREVENTERS** | Shotgun Surgery, Divergent Change, Callback Hell |
| **COUPLERS** | Feature Envy, Message Chain, Insider Trading, Tramp Data, Parallel Inheritance |
| **DATA DEALERS** | Global Data, Mutable Data, Temporary Field, Status Variable |
| **DISPENSABLES** | Dead Code, Speculative Generality, Duplicated Code, Lazy Element |
| **FUNCTIONAL ABUSERS** | Combinatorial Explosion, Side Effects, Hidden Dependencies |
| **LEXICAL ABUSERS** | Fallacious Method Name, Boolean Blindness, Magic Number, Uncommunicative Name, etc. |
| **OO ABUSERS** | Alternative Classes, Base Class Depends on Subclass, Refused Bequest, Inappropriate Static |
| **OBFUSCATORS** | Clever Code, Obscured Intent, Complicated Boolean/Regex, Conditional Complexity |
| **OTHER** | Middle Man, Primitive Obsession, Flag Argument, Special Case, etc. |

## Historical Sources

- Martin Fowler (1999/2018): "Refactoring: Improving the Design of Existing Code"
- William C. Wake (2004): "Refactoring Workbook"
- Robert C. Martin (2008): "Clean Code"
- Marcel Jerzyk (2022): "Code Smells: A Comprehensive Online Catalog and Taxonomy" — https://github.com/Luzkan/smells

## Primary Refactoring Techniques

Extract Method, Extract Class, Move Method/Field, Rename Method, Replace with Object, Introduce Null Object, Hide Delegate, Inline Function/Class, Collapse Hierarchy, Pull Up Method, Push Down Method, Form Template Method, Replace Delegation with Inheritance
