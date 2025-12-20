#!/usr/bin/env pwsh
# Generate HTML report from SARIF
param(
    [string]$SarifFile = (Get-ChildItem "codeql-results/*.sarif" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName,
    [string]$OutputFile = "codeql-results/report.html"
)

if (-not $SarifFile) {
    Write-Host "No SARIF file found. Run .\run-codeql.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Generating HTML report from $SarifFile..." -ForegroundColor Cyan

# Use the Microsoft SARIF Viewer (if available) or create a simple HTML viewer
npm install -g @microsoft/sarif-multitool 2>&1 | Out-Null

if (Get-Command sarif -ErrorAction SilentlyContinue) {
    sarif convert $SarifFile --output $OutputFile --format html
    Write-Host "HTML report saved to: $OutputFile" -ForegroundColor Green
    Start-Process $OutputFile
} else {
    Write-Host "Installing SARIF tools..." -ForegroundColor Yellow
    Write-Host "Alternative: View the SARIF file in VS Code with the CodeQL extension" -ForegroundColor Cyan
}
