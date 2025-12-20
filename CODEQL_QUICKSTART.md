# CodeQL Quick Start Guide

## ⚡ RECOMMENDED: Use VS Code GUI (Beautiful Formatted Results)

**This is the only way to get the formatted, clickable results you want!**

### One-Time Setup (2 minutes)

1. **Install CodeQL extension**:

   ```bash
   code --install-extension github.vscode-codeql
   ```

2. **Refresh database**:

   ```powershell
   .\run-codeql-gui.ps1
   ```

3. **Load database in VS Code**:
   - Press `Ctrl+Shift+P`
   - Type: "CodeQL: Choose Database from Folder"
   - Select: `codeql-db` folder

### Run Analysis (Every Time)

1. Look for **"CodeQL Databases"** panel in VS Code sidebar
2. Right-click on `codeql-db`
3. Select **"Run Queries in Suite"**
4. Choose: `javascript-security-and-quality`
5. Wait for analysis to complete
6. View beautiful formatted results in **"CodeQL Query Results"** panel! ✨

**You get:**

- ✅ Grouped by severity and type
- ✅ Click to jump to code
- ✅ Expandable descriptions
- ✅ Data flow visualization
- ✅ No CSV/SARIF headaches!

---

## Alternative: CLI (For CI/CD or quick checks)

**Note:** CLI output is CSV only - use GUI for readable results!

```powershell
# Full analysis (generates CSV)
.\run-codeql.ps1

# Quick security scan (faster)
.\run-codeql.ps1 -QuickScan

# Results in: codeql-results/*.csv
```

## When Code Changes

### Before running queries again

**Option A: Use GUI script** (recommended):

```powershell
.\run-codeql-gui.ps1
```

Then follow GUI steps above.

**Option B: Manual refresh**:

```powershell
codeql database create codeql-db --language=javascript --source-root=. --overwrite
```

Then run queries from GUI.

**Option C: VS Code Task**:

- `Ctrl+Shift+P` → "Tasks: Run Task" → "CodeQL: Refresh Database"

## Files Created

- `.codeql/codeql-config.yml` - Excludes dist/, test reports, node_modules from analysis
- `.codeqlignore` - Additional exclusion patterns
- `run-codeql.ps1` - Main analysis script (generates CSV & SARIF)
- `view-results.ps1` - Readable results viewer
- `run-codeql-gui.ps1` - GUI setup script (opens VS Code)
- `codeql-results/` - Analysis results (timestamped CSV/SARIF files)
- `codeql-db/` - Database for analysis
- `.vscode/tasks.json` - VS Code task for database refresh

## Excluded from Analysis

These folders are ignored (see `.codeqlignore`):

- `dist/` - Build artifacts
- `node_modules/` - Dependencies
- `playwright-report/` - Test reports
- `.archive/` - Legacy code

## Troubleshooting

### "SARIF file won't display properly"

**Solution:** Don't use CLI SARIF! Use the **CodeQL extension GUI** instead (see above).
CLI SARIF doesn't format properly in VS Code - you need the extension's database-linked results.

### "Database out of sync"

**Solution:** Run `.\run-codeql-gui.ps1` again to refresh.

### "Can't find CodeQL Databases panel"

**Solution:**

1. Check that CodeQL extension is installed: `code --list-extensions | grep codeql`
2. View → Command Palette → "CodeQL: Focus on CodeQL Databases"

### "Queries run but no results appear"

**Solution:** Check the **"CodeQL Query Results"** panel (not Problems panel, not SARIF viewer).

## What Gets Analyzed

CodeQL finds issues that ESLint/Prettier/Knip miss:

- Dead code across functions
- Logic errors (unreachable code, always-true conditions)
- Security vulnerabilities (XSS, injection, prototype pollution)
- Performance issues (ReDoS, optimization killers)
- Data flow bugs (uninitialized variables, type confusion)

See [CODEQL_QUERIES.md](CODEQL_QUERIES.md) for full details.

## Pro Tips

1. **Pin the CodeQL panels**: Drag "CodeQL Databases" and "CodeQL Query Results" to sidebar for easy access
2. **Filter results**: Use the filter box in Query Results panel to search
3. **Save queries**: Create `.ql` files to run custom queries
4. **Compare runs**: Results persist in panel until you clear them
