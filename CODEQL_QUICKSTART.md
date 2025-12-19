# CodeQL Quick Start

## TL;DR - What You Need to Do Now

Your setup is **already 90% complete**! Here's what's left:

### ✅ Already Done
- CodeQL CLI installed at `C:\Tools\codeql` (global, not in repo)
- `.gitignore` configured to exclude CodeQL artifacts
- Local VSCode settings created (`.vscode/settings.json`)
- Local database cleaned up from repo

### 🔧 Do This Now

1. **Restart VSCode** to pick up the new settings

2. **Verify Extension Configuration**:
   - Open Command Palette (Ctrl+Shift+P)
   - Type: `CodeQL: View Output`
   - You should see it using: `C:\Tools\codeql\codeql.exe`

3. **Create Database for This Repo** (when ready to analyze):
   ```bash
   # Open terminal in this repo
   C:\Tools\codeql\codeql.exe database create codeql-db --language=javascript
   ```

   Or use VSCode:
   - Command Palette → `CodeQL: Create Database`
   - Select this workspace
   - Choose "JavaScript/TypeScript"

4. **Run Your First Query**:
   - Command Palette → `CodeQL: Set Current Database`
   - Select the database you just created
   - Command Palette → `CodeQL: Run Query on Selected Database`
   - Pick a query from `codeql/javascript-queries`

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

## Getting Help

- Full setup details: See [CODEQL_SETUP.md](CODEQL_SETUP.md)
- Official docs: https://docs.github.com/en/code-security/codeql-for-vs-code
- Extension page: https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql

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
