# CodeQL Setup - Complete

CodeQL is now configured for your Mahjong project with proper exclusions.

## Quick Reference

### Run Analysis

```powershell
.\run-codeql.ps1           # Full security & quality scan
.\run-codeql.ps1 -QuickScan  # Fast security-only scan
```

### View Results

```powershell
.\view-results.ps1
```

That's it! Two simple commands.

## What Gets Analyzed

✅ **Included:**

- `core/` - Game logic
- `desktop/` - Desktop implementation
- `mobile/` - Mobile implementation
- `shared/` - Shared utilities
- `tests/` - Test files

❌ **Excluded:**

- `dist/` - Build artifacts
- `node_modules/` - Dependencies
- `playwright-report/` - Test reports
- `.archive/` - Legacy code
- All `*.min.js` and `*.bundle.js` files

## What CodeQL Finds

CodeQL performs **semantic analysis** beyond ESLint/Prettier/Knip:

- **Security:** XSS, injection, prototype pollution, ReDoS, etc.
- **Logic Errors:** Unreachable code, dead stores, useless conditionals
- **Data Flow:** Cross-function analysis, taint tracking
- **Performance:** RegExp performance issues, V8 optimization killers

## Files Overview

| File                        | Purpose                              |
| --------------------------- | ------------------------------------ |
| `run-codeql.ps1`            | Main analysis script                 |
| `view-results.ps1`          | Readable results viewer              |
| `.codeql/codeql-config.yml` | Analysis configuration               |
| `codeql-results/`           | Output directory (timestamped files) |
| `codeql-db/`                | Analysis database (auto-refreshed)   |

## Example Workflow

```powershell
# Before committing code
.\run-codeql.ps1 -QuickScan
.\view-results.ps1

# Weekly deep scan
.\run-codeql.ps1
.\view-results.ps1
```

## Documentation

- [CODEQL_QUICKSTART.md](CODEQL_QUICKSTART.md) - Detailed guide
- [CODEQL_QUERIES.md](CODEQL_QUERIES.md) - Query reference
- Results are saved to `codeql-results/` with timestamps

## Notes

- The database is rebuilt each time you run the script
- Results are filtered to show only source code issues
- Build artifacts (dist/) are automatically excluded
- All queries run the official GitHub CodeQL security suite
