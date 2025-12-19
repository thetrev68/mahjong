# CodeQL Setup Guide for This Repository

## Current Status

✅ CodeQL CLI installed globally at: `C:\Tools\codeql`
✅ CodeQL version: 2.23.8
✅ Local database directory removed from repo
✅ `.gitignore` configured to exclude CodeQL artifacts
❌ CodeQL not added to system PATH (optional)
❌ VSCode extension not configured to use global CLI

## What's Configured

### Global Installation
- **Location**: `C:\Tools\codeql\`
- **Executable**: `C:\Tools\codeql\codeql.exe`
- **Languages Available**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Ruby, Rust, Swift, and more

### Repository Configuration
Your `.gitignore` already excludes:
- `/tools/codeql/` - Any locally downloaded CLI
- `codeql-db` - Local database files
- `.vscode/settings.json` - Machine-specific settings (won't be committed)

## Next Steps

### 1. Configure VSCode CodeQL Extension

You need to tell the VSCode extension to use your global CodeQL installation instead of downloading its own copy.

**Option A: Via VSCode UI** (Recommended)
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Find "CodeQL" extension and click the gear icon
4. Select "Extension Settings"
5. Search for "executable path"
6. Set `CodeQL › Cli: Executable Path` to: `C:\Tools\codeql\codeql.exe`

**Option B: Via Settings JSON**
1. Create `.vscode/settings.json` in this repo (already in `.gitignore`)
2. Add this content (or use the file created below):
```json
{
  "codeQL.cli.executablePath": "C:\\Tools\\codeql\\codeql.exe"
}
```

### 2. (Optional) Add CodeQL to System PATH

This allows you to run `codeql` commands from any terminal:

1. Open System Properties → Environment Variables
2. Edit the "Path" variable (User or System)
3. Add new entry: `C:\Tools\codeql`
4. Restart terminals/VSCode to pick up the change

**Verify it worked:**
```bash
codeql version
```

### 3. Create a CodeQL Database for This Repository

Once the extension is configured, you can create a database to analyze your code:

**Option A: Via VSCode Extension**
1. Open Command Palette (Ctrl+Shift+P)
2. Type "CodeQL: Create Database"
3. Select your workspace folder
4. Choose language: JavaScript/TypeScript
5. Wait for database creation to complete

**Option B: Via Command Line** (if CodeQL is in PATH)
```bash
codeql database create codeql-db --language=javascript
```

**Important:** The database will be created at `codeql-db/` and is already in `.gitignore`, so it won't be committed.

### 4. Where to Store Databases

**Recommended approach:**
- Store databases locally in each repository as `codeql-db/` (already ignored)
- This keeps databases isolated per project
- Databases can be large (80+ MB), so keeping them local is fine

**Alternative approach:**
- Create a global databases folder like `C:\CodeQL\Databases\`
- Store databases as `C:\CodeQL\Databases\mahjong\`
- Configure extension setting `CodeQL › Cli: Database Path` to point there

For your use case (analyzing multiple repos), I recommend the **local approach** - each repo gets its own `codeql-db/` folder that's git-ignored.

## Using CodeQL in Other Repositories

To use CodeQL in your other local repositories:

1. **Copy `.gitignore` entries** to each repo:
   ```gitignore
   # CodeQL artifacts
   codeql-db
   .vscode/settings.json
   ```

2. **Create `.vscode/settings.json`** in each repo:
   ```json
   {
     "codeQL.cli.executablePath": "C:\\Tools\\codeql\\codeql.exe"
   }
   ```

3. **Create database** for each repo (see Step 3 above)

## Running Queries

Once you have a database:

1. Open Command Palette (Ctrl+Shift+P)
2. Type "CodeQL: Run Query on Selected Database"
3. Or explore the CodeQL extension's query packs in the sidebar

### Useful Query Packs
- `codeql/javascript-queries` - Standard JavaScript/TypeScript security queries
- `codeql/javascript-all` - All available JavaScript queries

## Troubleshooting

### Extension Not Finding CLI
- Check the CodeQL output panel in VSCode (View → Output → CodeQL)
- Verify the executable path is correct
- Try absolute path with escaped backslashes: `C:\\Tools\\codeql\\codeql.exe`

### Database Creation Fails
- Ensure your project has a valid package.json (already exists ✓)
- Check that Node.js dependencies are installed: `npm install`
- Look at CodeQL logs for specific errors

### Database Too Large
- CodeQL databases can be 50-100MB or larger
- They include extracted code representations for analysis
- This is normal and expected

## Resources

- [Installing CodeQL for VS Code](https://docs.github.com/en/code-security/codeql-for-vs-code/getting-started-with-codeql-for-vs-code/installing-codeql-for-vs-code)
- [Configuring Access to CodeQL CLI](https://docs.github.com/en/code-security/codeql-for-vs-code/using-the-advanced-functionality-of-the-codeql-for-vs-code-extension/configuring-access-to-the-codeql-cli)
- [Customizing Settings](https://docs.github.com/code-security/codeql-for-vs-code/customizing-settings/)
- [CodeQL Extension on VS Marketplace](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql)

## What Copilot Did (Summary)

Based on the state of your repository:

1. ✅ **Installed CodeQL CLI** at `C:\Tools\codeql` (global location - correct!)
2. ✅ **Added `.gitignore` entries** to exclude CodeQL artifacts (correct!)
3. ❌ **Created local database** in repo (`codeql-db/`) - I deleted this since it's not needed until you're ready to analyze
4. ❓ **May not have configured VSCode extension** - You need to do this manually (see Step 1 above)

## Bottom Line

Your setup is actually in good shape! The main thing you need to do is:

1. Create `.vscode/settings.json` with the CLI path (see below)
2. Create a database when you're ready to analyze your code
3. Start running queries

Everything else is already configured correctly.
