#!/usr/bin/env pwsh
# CodeQL Analysis Script for Mahjong Project
# Usage: .\run-codeql.ps1

param(
    [string]$OutputDir = "codeql-results",
    [string]$Format = "sarif-latest",
    [switch]$QuickScan,
    [switch]$OpenResults
)

Write-Host "🔍 CodeQL Analysis for Mahjong Project" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✓ Created output directory: $OutputDir" -ForegroundColor Green
}

# Step 1: Create/refresh database
Write-Host "📦 Creating CodeQL database (excluding dist/, node_modules, etc.)..." -ForegroundColor Yellow
$dbPath = "codeql-db"
codeql database create $dbPath --language=javascript --source-root=. --overwrite --codescanning-config=.codeql/codeql-config.yml

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database creation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database created successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Choose query suite
if ($QuickScan) {
    Write-Host "⚡ Running quick security scan..." -ForegroundColor Yellow
    $querySuite = "c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-code-scanning.qls"
    $outputFile = "$OutputDir/quick-scan"
} else {
    Write-Host "🔎 Running comprehensive security and quality analysis..." -ForegroundColor Yellow
    $querySuite = "c:/Tools/codeql-packs/codeql/javascript-queries/2.2.3/codeql-suites/javascript-security-and-quality.qls"
    $outputFile = "$OutputDir/full-analysis"
}

# Step 3: Run analysis
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$sarifOutput = "$outputFile-$timestamp.sarif"
$csvOutput = "$outputFile-$timestamp.csv"

Write-Host "📊 Analyzing codebase..." -ForegroundColor Yellow
codeql database analyze $dbPath $querySuite --format=$Format --output=$sarifOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Analysis failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ SARIF results: $sarifOutput" -ForegroundColor Green

# Step 4: Also generate CSV for easy viewing
Write-Host "📄 Generating CSV report..." -ForegroundColor Yellow
codeql database analyze $dbPath $querySuite --format=csv --output=$csvOutput 2>&1 | Out-Null
Write-Host "✓ CSV results: $csvOutput" -ForegroundColor Green
Write-Host ""

# Step 5: Generate summary
Write-Host "📋 Analysis Summary:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$csvContent = Import-Csv $csvOutput
$totalIssues = $csvContent.Count

Write-Host "Total issues found: $totalIssues" -ForegroundColor $(if ($totalIssues -eq 0) { "Green" } else { "Yellow" })

if ($totalIssues -gt 0) {
    Write-Host ""
    Write-Host "Top 10 issue types:" -ForegroundColor Cyan
    $csvContent | Group-Object -Property Name | 
        Sort-Object Count -Descending | 
        Select-Object -First 10 | 
        ForEach-Object { Write-Host "  - $($_.Name): $($_.Count)" -ForegroundColor White }
}

Write-Host ""
Write-Host "✅ Analysis complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Results saved to:" -ForegroundColor Cyan
Write-Host "  SARIF: $sarifOutput" -ForegroundColor White
Write-Host "  CSV:   $csvOutput" -ForegroundColor White
Write-Host ""

# Step 6: Optionally open results
if ($OpenResults) {
    Write-Host "🌐 Opening results..." -ForegroundColor Yellow
    
    # Open CSV in default application
    Start-Process $csvOutput
    
    # Try to open SARIF in VS Code if available
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code $sarifOutput
    }
}

Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  - View CSV: Start-Process $csvOutput" -ForegroundColor Gray
Write-Host "  - View in VS Code: code $sarifOutput" -ForegroundColor Gray
Write-Host "  - Quick scan: .\run-codeql.ps1 -QuickScan" -ForegroundColor Gray
Write-Host "  - Auto-open results: .\run-codeql.ps1 -OpenResults" -ForegroundColor Gray
