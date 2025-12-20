# CodeQL Query Guide for Mahjong Project

This document provides guidance on using CodeQL queries for deep code analysis beyond what ESLint, Prettier, Knip, or MarkdownLint can detect.

## Quick Start

### Database Management

```bash
# Refresh/recreate the database (after code changes)
codeql database create codeql-db --language=javascript --source-root=. --overwrite

# Upgrade database schema (if needed)
codeql database upgrade codeql-db
```

## Recommended Query Suites

### 1. javascript-security-and-quality.qls (RECOMMENDED - Best overall value)

This is the most comprehensive suite, covering both security vulnerabilities AND code quality issues that linters miss.

```bash
codeql database analyze codeql-db \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-security-and-quality.qls \
  --format=sarif-latest \
  --output=results.sarif
```

### 2. javascript-code-quality-extended.qls (For deeper quality analysis)

Additional code quality checks beyond the standard suite.

```bash
codeql database analyze codeql-db \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-code-quality-extended.qls \
  --format=sarif-latest \
  --output=results-quality.sarif
```

## High-Value Individual Query Categories

### Security Queries (What linters CAN'T find)

#### Critical for this game (user-facing web app)

- **XSS Vulnerabilities**
  - `Security/CWE-079/Xss.ql` - XSS vulnerabilities
  - `Security/CWE-079/XssThroughDom.ql` - DOM-based XSS
  - `Security/CWE-079/ReflectedXss.ql` - Reflected XSS
  - `Security/CWE-079/StoredXss.ql` - Stored XSS

- **Data Storage & Privacy**
  - `Security/CWE-312/CleartextStorage.ql` - Sensitive data in localStorage
  - `Security/CWE-312/CleartextLogging.ql` - Logging sensitive data
  - `Security/CWE-798/HardcodedCredentials.ql` - Hard-coded secrets

- **Code Injection**
  - `Security/CWE-094/CodeInjection.ql` - Code injection risks
  - `Security/CWE-094/UnsafeCodeConstruction.ql` - Unsafe eval/Function usage
  - `Security/CWE-094/ImproperCodeSanitization.ql` - Improper sanitization

- **Prototype Pollution**
  - `Security/CWE-915/PrototypePollutingAssignment.ql` - Prototype pollution vulnerabilities
  - `Security/CWE-915/PrototypePollutingFunction.ql` - Functions that pollute prototypes
  - `Security/CWE-915/PrototypePollutingMergeCall.ql` - Merge operations that pollute

- **Cryptography & Randomness**
  - `Security/CWE-338/InsecureRandomness.ql` - Using Math.random() for security-sensitive operations
  - `Security/CWE-327/BrokenCryptoAlgorithm.ql` - Weak cryptographic algorithms
  - `Security/CWE-326/InsufficientKeySize.ql` - Insufficient key sizes

#### RegExp Security (Performance DoS)

- `Performance/PolynomialReDoS.ql` - Catastrophic backtracking patterns
- `Performance/ReDoS.ql` - Regular expression denial of service
- `Security/CWE-730/RegExpInjection.ql` - RegExp injection attacks

### Code Quality (Beyond what ESLint catches)

#### Dead Code & Data Flow Analysis

- `Declarations/DeadStoreOfLocal.ql` - Unused assignments (more sophisticated than ESLint)
- `Declarations/DeadStoreOfProperty.ql` - Property assignments that are never read
- `Declarations/UnusedVariable.ql` - Variables that are truly unused (deeper analysis)
- `Declarations/UnusedParameter.ql` - Function parameters never used
- `Declarations/UnusedProperty.ql` - Object properties never accessed

#### Logic Errors

- `Expressions/ComparisonWithNaN.ql` - Incorrect NaN comparisons (x === NaN)
- `Expressions/UselessComparison.ql` - Comparisons that always return true/false
- `Statements/UnreachableStatement.ql` - Code that can never execute
- `Statements/TrivialConditional.ql` - Conditions always true/false
- `Statements/LoopIterationSkippedDueToShifting.ql` - Loop bugs from array modification
- `Statements/InconsistentLoopDirection.ql` - Loop counter going wrong direction
- `Expressions/RedundantAssignment.ql` - Assignments immediately overwritten

#### Event-Driven Code Issues (VERY relevant for event system)

- `Expressions/UnboundEventHandlerReceiver.ql` - Event handlers losing `this` context
- `Expressions/UseOfReturnlessFunction.ql` - Using return value of void functions

#### Async/Promise Issues

- `Expressions/MissingAwait.ql` - Promises not awaited
- `Quality/UnhandledErrorInStreamPipeline.ql` - Missing error handlers in streams

#### Type Confusion & Runtime Errors

- `Expressions/ComparisonBetweenIncompatibleTypes.ql` - Comparing incompatible types
- `Expressions/PropertyAccessOnNonObject.ql` - Accessing properties on null/undefined
- `Expressions/CallToNonCallable.ql` - Calling non-function values
- `Expressions/ImplicitOperandConversion.ql` - Implicit type conversions
- `Expressions/UselessTypeTest.ql` - Type checks that always succeed/fail

#### Variable & Declaration Issues

- `Declarations/DuplicateVarDecl.ql` - Duplicate variable declarations
- `Declarations/MissingVarDecl.ql` - Missing var/let/const
- `Declarations/TemporalDeadZone.ql` - Variable use before declaration
- `Declarations/MissingThisQualifier.ql` - Missing this qualifier
- `Declarations/ConflictingFunctions.ql` - Functions with same name in scope

### Performance Issues

- `Performance/NonLocalForIn.ql` - for-in loop performance issues
- `Performance/ReassignParameterAndUseArguments.ql` - V8 optimization killers
- `Performance/PolynomialReDoS.ql` - Regex with catastrophic backtracking
- `Performance/ReDoS.ql` - Regular expression denial of service

### Module/Dependency Analysis (Complements Knip)

- `NodeJS/CyclicImport.ql` - Circular dependencies
- `NodeJS/UnstableCyclicImport.ql` - Problematic circular imports
- `Declarations/UnstableCyclicImport.ql` - Import cycle stability issues
- `NodeJS/UnresolvableImport.ql` - Imports that can't be resolved
- `NodeJS/DubiousImport.ql` - Suspicious import patterns
- `NodeJS/MissingExports.ql` - Missing module exports

### DOM & HTML Issues

- `DOM/MalformedIdAttribute.ql` - Invalid HTML ID attributes
- `DOM/DuplicateAttributes.ql` - Duplicate HTML attributes
- `DOM/AmbiguousIdAttribute.ql` - Ambiguous ID usage
- `DOM/ConflictingAttributes.ql` - Conflicting HTML attributes

## Recommended Execution Plan

### Phase 1: Quick Win (Run first)

Test the most impactful queries to find critical issues fast:

```bash
codeql database analyze codeql-db \
  --format=sarif-latest \
  --output=results-quick.sarif \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Security/CWE-079/Xss.ql \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Performance/PolynomialReDoS.ql \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Expressions/ComparisonWithNaN.ql \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Expressions/MissingAwait.ql \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Expressions/PropertyAccessOnNonObject.ql \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Security/CWE-915/PrototypePollutingAssignment.ql
```

### Phase 2: Comprehensive Analysis

Run the full security and quality suite:

```bash
codeql database analyze codeql-db \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-security-and-quality.qls \
  --format=sarif-latest \
  --output=results-full.sarif
```

### Phase 3: View Results

#### Generate HTML Report

```bash
codeql database analyze codeql-db \
  c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-security-and-quality.qls \
  --format=csv \
  --output=results.csv
```

#### Generate SARIF for IDE Integration

SARIF files can be viewed in VS Code with the CodeQL extension or uploaded to GitHub Security.

```bash
# Already in SARIF format from Phase 2
# View with: code --install-extension ms-vscode.sarif-viewer
```

## Why CodeQL vs Linters

| Tool                | What it finds                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ESLint/Prettier** | Syntax, style, simple patterns (single file)                                                                     |
| **Knip**            | Unused exports/dependencies (static file analysis)                                                               |
| **CodeQL**          | Data flow, control flow, taint analysis, security vulnerabilities, complex logic errors (whole-program analysis) |

### CodeQL Advantages

CodeQL performs **semantic analysis** - it understands what your code _does_, not just how it's written.

Examples:

1. **Cross-Function Data Flow**: Traces user input through multiple function calls to find XSS vulnerabilities
2. **Dead Store Detection**: Detects when you assign to a variable but never read it, even across functions
3. **RegExp Analysis**: Finds regex patterns that cause exponential runtime (ReDoS)
4. **Context Analysis**: Identifies event handlers that will lose `this` context when invoked
5. **Taint Tracking**: Follows untrusted data through your application to find injection points
6. **Control Flow Analysis**: Finds unreachable code and logic errors that only manifest at runtime

## Output Formats

### SARIF (Recommended for automation)

```bash
--format=sarif-latest --output=results.sarif
```

### CSV (Human-readable spreadsheet)

```bash
--format=csv --output=results.csv
```

### HTML (Not directly supported, convert from SARIF)

```bash
# Use sarif-viewer or upload to GitHub
```

## Integration with CI/CD

Add to GitHub Actions or local pre-commit:

```yaml
# .github/workflows/codeql.yml
- name: Analyze with CodeQL
  run: |
    codeql database create codeql-db --language=javascript --source-root=.
    codeql database analyze codeql-db \
      codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls \
      --format=sarif-latest \
      --output=results.sarif
```

## Tips

1. **Start with security-and-quality suite** - Best ROI
2. **Run incrementally** - Use Phase 1 queries during development, full suite before commits
3. **Fix high-severity first** - CodeQL ranks issues by severity
4. **Refresh database after changes** - Database is a snapshot
5. **Use SARIF format** - Best for tooling integration
6. **Combine with existing tools** - CodeQL complements, doesn't replace linters

## Common Issues

### Database out of sync

```bash
# Solution: Recreate database
codeql database create codeql-db --language=javascript --source-root=. --overwrite
```

### Query takes too long

```bash
# Solution: Run fewer queries at once or use --threads
codeql database analyze codeql-db query.ql --threads=4
```

### Can't find queries

```bash
# Solution: Use absolute paths
c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/Security/...
```
