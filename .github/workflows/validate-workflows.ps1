param()
foreach ($f in Get-ChildItem -Path .github\workflows -Filter *.yml -Recurse) {
    Write-Host "--- $($f.FullName) ---"
    $txt = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $txt) { Write-Host "Cannot read file" -ForegroundColor Red; continue }
    if ($txt -match '<<<<<<<|=======|>>>>>>>') { Write-Host 'CONFLICT MARKERS FOUND' -ForegroundColor Red } else { Write-Host 'No conflict markers' -ForegroundColor Green }
    try {
        $doc = $txt | ConvertFrom-Yaml
    } catch {
        Write-Host "YAML PARSE ERROR: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    if ($null -eq $doc.name) { Write-Host 'Missing name' -ForegroundColor Yellow } else { Write-Host "name: $($doc.name)" }
    if ($null -eq $doc.on) { Write-Host 'Missing on:' -ForegroundColor Yellow } else { Write-Host 'has on: OK' }
    if ($null -ne $doc.jobs) {
        foreach ($jobProp in $doc.jobs.PSObject.Properties) {
            $jobKey = $jobProp.Name
            Write-Host " Job: $jobKey"
            $job = $doc.jobs.$jobKey
            if ($null -eq $job.steps) { Write-Host '  No steps in job' -ForegroundColor Yellow; continue }
            $i = 0
            foreach ($s in $job.steps) {
                $i++
                if ($s -is [string]) { Write-Host "  Step $i: string step -> invalid" -ForegroundColor Red; continue }
                $props = $s.PSObject.Properties.Name
                $hasRun = $props -contains 'run'
                $hasUses = $props -contains 'uses'
                if (-not ($hasRun -or $hasUses)) { Write-Host "  Step $i: MISSING run/uses" -ForegroundColor Red } else { Write-Host "  Step $i: OK" }
                if ($hasRun -and $hasUses) { Write-Host "  Step $i: BOTH run AND uses (suspicious)" -ForegroundColor Yellow }
            }
        }
    } else { Write-Host 'No jobs key found' -ForegroundColor Yellow }
}
