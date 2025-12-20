#!/usr/bin/env pwsh
# View CodeQL Results

param(
    [string]$ResultsFile = (Get-ChildItem "codeql-results/*.csv" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
)

if (-not $ResultsFile -or -not (Test-Path $ResultsFile)) {
    Write-Host "No results found. Run .\run-codeql.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 CodeQL Analysis Results" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "File: $(Split-Path $ResultsFile -Leaf)" -ForegroundColor Gray
Write-Host ""

# Read CSV with proper headers
$content = Get-Content $ResultsFile
$totalIssues = $content.Count

if ($totalIssues -eq 0) {
    Write-Host "✅ NO ISSUES FOUND!" -ForegroundColor Green  
    Write-Host "   Your code passed all security and quality checks." -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "Total Issues Found: $totalIssues" -ForegroundColor Yellow
Write-Host ""

# Parse each line
$sourceIssues = 0
$distIssues = 0

foreach ($line in $content) {
    $fields = $line -split '","' | ForEach-Object { $_.Trim('"') }
    $file = $fields[4]
    
    if ($file -like "*dist/*" -or $file -like "*playwright-report/*") {
        $distIssues++
    } else {
        $sourceIssues++
    }
}

Write-Host "  Source Code Issues: $sourceIssues" -ForegroundColor $(if ($sourceIssues -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Build Artifacts:    $distIssues (can ignore)" -ForegroundColor DarkGray
Write-Host ""

if ($sourceIssues -eq 0) {
    Write-Host "✅ All source code is clean!" -ForegroundColor Green
    Write-Host "   Issues found are only in minified/bundled files." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "🔍 Source Code Issues:" -ForegroundColor Yellow
    Write-Host "-" * 80 -ForegroundColor Gray
    
    $count = 0
    foreach ($line in $content) {
        $fields = $line -split '","' | ForEach-Object { $_.Trim('"') }
        $name = $fields[0]
        $severity = $fields[2]
        $description = $fields[3]
        $file = $fields[4]
        $lineNum = $fields[5]
        
        if ($file -notlike "*dist/*" -and $file -notlike "*playwright-report/*") {
            $count++
            Write-Host ""
            Write-Host "[$count] $name" -ForegroundColor Cyan
            Write-Host "    Location: $file`:$lineNum" -ForegroundColor Gray
            Write-Host "    Severity: $severity" -ForegroundColor $(if ($severity -eq "error") { "Red" } else { "Yellow" })
            Write-Host "    $description" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "💡 To view full details: Open $ResultsFile" -ForegroundColor Gray
Write-Host ""
