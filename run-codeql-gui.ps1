#!/usr/bin/env pwsh
# Run CodeQL and open results in VS Code properly

param(
    [switch]$QuickScan
)

Write-Host "🔍 CodeQL Analysis (GUI-compatible)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Refresh database
Write-Host "📦 Refreshing database..." -ForegroundColor Yellow
codeql database create codeql-db --language=javascript --source-root=. --overwrite

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database creation failed" -ForegroundColor Red
    exit 1
}

# Step 2: Open database in VS Code CodeQL extension
Write-Host "✓ Database refreshed" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Opening database in VS Code..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. In VS Code, press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type: 'CodeQL: Choose Database from Folder'" -ForegroundColor White  
Write-Host "  3. Select the 'codeql-db' folder" -ForegroundColor White
Write-Host "  4. Right-click database in CodeQL Databases panel" -ForegroundColor White
Write-Host "  5. Select 'Run Queries in Suite'" -ForegroundColor White
Write-Host "  6. Choose: javascript-security-and-quality" -ForegroundColor White
Write-Host ""
Write-Host "Results will appear in the CodeQL Query Results panel with full formatting!" -ForegroundColor Green

# Try to open VS Code with the database
code .
