# File: analyze-project.ps1
# PowerShell script to fully analyze GplusApp project

# -------- CONFIGURATION --------
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$reportsDir = Join-Path $projectRoot "reports"

# Create reports directory if not exists
if (!(Test-Path $reportsDir)) { New-Item -ItemType Directory -Path $reportsDir | Out-Null }

# -------- STEP 1: LINT & FORMAT --------
Write-Host "`n[Step 1] Running ESLint and Prettier..."
npx eslint "$projectRoot/src/**/*.{js,jsx,ts,tsx}" --max-warnings 0
npx prettier --check "$projectRoot/src/**/*.{js,jsx,ts,tsx}"

# -------- STEP 2: TYPE CHECK --------
Write-Host "`n[Step 2] TypeScript type check..."
npx tsc --noEmit

# -------- STEP 3: UNIT TESTS & COVERAGE --------
Write-Host "`n[Step 3] Running Unit Tests with coverage..."
npx vitest run --coverage
# If using Jest, uncomment next line
# npx jest --coverage

# -------- STEP 4: CODE DUPLICATION (JSCPD) --------
Write-Host "`n[Step 4] Detecting code duplication..."
$jscpdReport = Join-Path $reportsDir "jscpd-report.json"
npx jscpd "$projectRoot/src" --min-tokens 50 --reporters json --output $jscpdReport

# Display top 10 repeated code blocks
Write-Host "`nTop 10 duplicated code blocks:"
Get-Content $jscpdReport | ConvertFrom-Json | Select-Object -ExpandProperty duplicates | Sort-Object -Property lines -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "File(s): $($_.files | ForEach-Object { $_.name } -join ', ') | Lines: $($_.lines) | Tokens: $($_.tokens)"
}

# -------- STEP 5: COMPLEXITY & MAINTAINABILITY (PLATO) --------
Write-Host "`n[Step 5] Analyzing complexity and maintainability..."
$platoReportDir = Join-Path $reportsDir "plato-report"
npx plato -r -d $platoReportDir "$projectRoot/src"

# -------- STEP 6: SUMMARY & RECOMMENDATIONS --------
Write-Host "`n[Step 6] Summary of reports available in $reportsDir"
Write-Host " - jscpd.json: code duplication details"
Write-Host " - plato-report/: complexity & maintainability analysis"
Write-Host " - coverage/: test coverage reports"

Write-Host "`n[Step 7] Recommendations:"
Write-Host "1. Extract top duplicated code blocks to reusable hooks/utilities/components."
Write-Host "2. Fix lint/prettier/type issues immediately."
Write-Host "3. Review Plato maintainability scores, especially files with high complexity."
Write-Host "4. Incrementally refactor using tests to verify correctness."
Write-Host "5. Keep code modular and maintain the current project structure."

Write-Host "`nAnalysis complete! ✅"
