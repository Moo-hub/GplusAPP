# Safe workflow validator: parses YAML and reports issues
$report = @()
# Ensure we have a YAML parser: prefer built-in ConvertFrom-Yaml (PS 7+)
$hasParser = $false
if (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue) { $hasParser = $true }
else {
    try {
        Install-Module powershell-yaml -Scope CurrentUser -Force -ErrorAction Stop | Out-Null
        Import-Module powershell-yaml -ErrorAction Stop
        if (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue) { $hasParser = $true }
    } catch {
        Write-Host "Warning: YAML parser not available and module install failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

foreach ($f in Get-ChildItem -Path .github\workflows -Recurse -Filter *.yml) {
    $path = $f.FullName
    $text = Get-Content -Path $path -Raw -ErrorAction SilentlyContinue
    $entry = [ordered]@{ File = $path; HasConflictMarkers = $false; ParseError = $null; HasOn = $false; HasName = $false; Issues = @() }
    if ($null -eq $text) { $entry.ParseError = 'Could not read file'; $report += (New-Object psobject -Property $entry); continue }
    if ($text -match '<<<<<<<|=======|>>>>>>>') { $entry.HasConflictMarkers = $true; $entry.Issues += 'Conflict markers present' }
    if (-not $hasParser) { $entry.ParseError = 'No YAML parser available (ConvertFrom-Yaml missing)'; $report += (New-Object psobject -Property $entry); continue }

    try {
        $doc = $text | ConvertFrom-Yaml
    } catch {
        $entry.ParseError = $_.Exception.Message
        $report += (New-Object psobject -Property $entry)
        continue
    }

    # check name/on at top level
    if ($null -ne $doc.name) { $entry.HasName = $true } else { $entry.Issues += "Missing 'name' key" }
    if ($null -ne $doc.on)   { $entry.HasOn = $true }   else { $entry.Issues += "Missing 'on' key" }

    # inspect jobs and their steps
    if ($null -ne $doc.jobs) {
        $jobKeys = @()
        try { $jobKeys = $doc.jobs.PSObject.Properties.Name } catch { }
        foreach ($jobKey in $jobKeys) {
            $job = $doc.jobs.$jobKey
            if ($null -ne $job.steps) {
                $idx = 0
                foreach ($step in $job.steps) {
                    $idx++
                    # step might be simple string; ensure object
                    if ($step -is [string]) { $entry.Issues += "Job '$jobKey' step #$idx is a string, not an object"; continue }
                    $props = @()
                    try { $props = $step.PSObject.Properties.Name } catch { }
                    $hasRun = $props -contains 'run'
                    $hasUses = $props -contains 'uses'
                    if (-not ($hasRun -or $hasUses)) { $entry.Issues += "Job '$jobKey' step #$idx missing 'uses' or 'run'" }
                    if ($hasRun -and $hasUses) { $entry.Issues += "Job '$jobKey' step #$idx has both 'uses' and 'run'" }
                }
            }
        }
    }
    $report += (New-Object psobject -Property $entry)
}

# write JSON report and print summary table
$report | ConvertTo-Json -Depth 6 | Set-Content -Path workflow-check-report.json -Encoding Utf8
if ($report.Count -eq 0) { Write-Host 'No workflow files found.'; exit 0 }
$report | Format-Table -AutoSize @{Label='File';Expression={$_.File}}, HasConflictMarkers, @{Label='ParseError';Expression={$_.ParseError}}, @{Label='Issues';Expression={($_.Issues -join '; ')}} 
Write-Host "Wrote report to: $((Resolve-Path workflow-check-report.json).Path)" -ForegroundColor Green
