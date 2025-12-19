# CodeQL Quick Start

## TL;DR - What You Need to Do Now

Your setup is **already 90% complete**! Here's what's left:

### ✅ Already Done

- CodeQL CLI installed at `C:\Tools\codeql` (global, not in repo)
- `.gitignore` configured to exclude CodeQL artifacts
- Local VSCode settings created (`.vscode/settings.json`)
- Local database cleaned up from repo

### 🔧 Do This Now

**Important**: The VSCode CodeQL extension is for **writing queries**, not analyzing your code. To analyze your mahjong codebase for security issues, use the **CLI workflow** below.

#### Simple CLI Workflow (Recommended)

1. **Create Database for This Repo**:

   Open a terminal in this repo and run:

   ```bash
   C:\Tools\codeql\codeql.exe database create codeql-db --language=javascript --source-root=.
   ```

   This will create a `codeql-db/` folder (already in `.gitignore`).
   Database creation takes 1-2 minutes and analyzes your entire codebase.

2. **Run Standard Security Queries**:

   First, download the query pack (one time only):

   ```bash
   C:\Tools\codeql\codeql.exe pack install codeql/javascript-queries
   ```

   Then run the analysis:

   ```bash
   C:\Tools\codeql\codeql.exe database analyze codeql-db codeql/javascript-queries --format=sarif-latest --output=results.sarif
   ```

   Or download and run in one step with config file (recommended):

   ```bash
   C:\Tools\codeql\codeql.exe database analyze codeql-db codeql/javascript-queries --download --format=sarif-latest --output=results.sarif --sarif-category=javascript
   ```

   **Using the config file** (excludes dist/, node_modules/, etc.):
   The `codeql-config.yml` file automatically excludes build folders and dependencies from analysis.
   The database creation already respects .gitignore, but the config provides explicit exclusions.

   This runs all the standard JavaScript security queries and saves results to `results.sarif`.

   **Note about VSCode UI**:
   - The VSCode extension is designed for **writing CodeQL queries**, not analyzing your own code
   - For analyzing your code, the CLI approach above is the standard workflow
   - The [vscode-codeql-starter](https://github.com/github/vscode-codeql-starter) is only needed if you want to write custom queries

3. **View Results**:

   After running queries, you can view results in several ways:
   - **HTML Report**: Open `codeql-report.html` in your browser (auto-generated)
   - **Command Line**: Run `node parse-sarif.cjs` for a text summary
   - **SARIF Viewer Extension**: Install "SARIF Viewer" extension to view `results.sarif` in VSCode
   - **Terminal Output**: Check the terminal for a summary during analysis

---

## Using CodeQL in Other Repos

For each repo you want to analyze:

1. Copy these files from this repo:
   - `.vscode/settings.json` (points to global CLI)
   - Add to `.gitignore`: `codeql-db` and `.vscode/settings.json`

2. Create database in that repo:

   ```bash
   cd /path/to/other/repo
   C:\Tools\codeql\codeql.exe database create codeql-db --language=javascript
   ```

## What Won't Upload to GitHub

These are all in `.gitignore`:

- `codeql-db/` - Your analysis database (large, local-only)
- `/tools/codeql/` - Any downloaded CLI (you have global install)
- `.vscode/settings.json` - Your machine-specific paths

## Troubleshooting

### CodeQL Panel Not Showing

**Problem**: Can't find the CodeQL sidebar panel

**Solutions**:

1. **Restart VSCode** completely (close all windows, reopen)
2. **Look for the CodeQL icon** in the Activity Bar (left sidebar):
   - It looks like a magnifying glass or QL logo
   - Click it to open the CodeQL panel
3. **Check extension is enabled**:
   - Extensions view (Ctrl+Shift+X)
   - Search for "CodeQL"
   - Make sure it's enabled (not disabled)
4. **Check Output panel** for errors:
   - View → Output (Ctrl+Shift+U)
   - Select "CodeQL Extension" or "CodeQL Language Server" from dropdown
   - Look for CLI initialization messages or errors
5. **Verify settings.json**:
   - Open `.vscode/settings.json`
   - Should have: `"codeQL.cli.executablePath": "C:\\Tools\\codeql\\codeql.exe"`
   - Note the double backslashes

### Extension Says CLI Not Found

**Problem**: Extension can't find the CodeQL CLI

**Solutions**:

1. Check the path in settings uses **double backslashes**: `C:\\Tools\\codeql\\codeql.exe`
2. Verify the file exists: Open terminal and run `dir C:\Tools\codeql\codeql.exe`
3. Try the absolute path without escaping in settings (VSCode usually handles this)

### Can't Create Database

**Problem**: Database creation fails

**Solutions**:

1. Make sure dependencies are installed: `npm install`
2. Check you have enough disk space (databases can be 50-100MB)
3. Try creating via command line first to see detailed errors:

   ```bash
   C:\Tools\codeql\codeql.exe database create codeql-db --language=javascript --source-root=.
   ```

## Getting Help

- Full setup details: See [CODEQL_SETUP.md](CODEQL_SETUP.md)
- Official docs: <https://docs.github.com/en/code-security/codeql-for-vs-code>
- Extension page: <https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql>

## Common Commands

```bash
# Check CodeQL version
C:\Tools\codeql\codeql.exe version

# List available languages
C:\Tools\codeql\codeql.exe resolve languages

# Create database
C:\Tools\codeql\codeql.exe database create codeql-db --language=javascript

# Analyze database with a specific query
C:\Tools\codeql\codeql.exe database analyze codeql-db --format=sarif-latest --output=results.sarif
```

## Optional: Add to PATH

If you want to type just `codeql` instead of the full path:

1. System Properties → Environment Variables
2. Edit "Path" variable
3. Add: `C:\Tools\codeql`
4. Restart terminals

Then you can use:

```bash
codeql version
codeql database create codeql-db --language=javascript
```
