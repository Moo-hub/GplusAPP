param()

function Safe-Write($msg, $color = 'White'){
    # Use Write-Output for reliability in this environment
    Write-Output $msg
}

$workflowDir = Join-Path -Path $PSScriptRoot -ChildPath '..\.github\workflows'
if (-not (Test-Path -Path $workflowDir)) { $workflowDir = '.github\workflows' }

$parserAvailable = (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue) -ne $null
if (-not $parserAvailable) {
    try {
        Install-Module powershell-yaml -Scope CurrentUser -Force -ErrorAction Stop | Out-Null
        Import-Module powershell-yaml -ErrorAction Stop
        $parserAvailable = (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue) -ne $null
    } catch {
        Safe-Write "YAML parser not available and module install failed: $($_.Exception.Message)"
        exit 2
    }
}

Get-ChildItem -Path $workflowDir -Filter *.yml -Recurse | ForEach-Object {
    $path = $_.FullName
    Safe-Write "--- $path ---"
    try { $text = Get-Content -Path $path -Raw -ErrorAction Stop } catch { Safe-Write "Cannot read file: $_"; return }

    if ($text -match '<<<<<<<|=======|>>>>>>>') { Safe-Write 'CONFLICT MARKERS FOUND' }
    else { Safe-Write 'No conflict markers' }

    try {
        $doc = $text | ConvertFrom-Yaml
    } catch {
        Safe-Write ("YAML PARSE ERROR: {0}" -f $_.Exception.Message)
        return
    }

    if ($null -eq $doc.name) { Safe-Write 'Missing name' } else { Safe-Write ("name: {0}" -f $doc.name) }
    if ($null -eq $doc.on) { Safe-Write "Missing on:" } else { Safe-Write 'has on: OK' }

    if ($null -ne $doc.jobs) {
        foreach ($prop in $doc.jobs.PSObject.Properties) {
            $jobKey = $prop.Name
            Safe-Write (" Job: {0}" -f $jobKey)
            $job = $doc.jobs.$jobKey
            if ($null -eq $job.steps) { Safe-Write '  No steps in job' ; continue }
            $i = 0
            foreach ($s in $job.steps) {
                $i++
                if ($s -is [string]) { Safe-Write ("  Step {0}: string step -> invalid" -f $i); continue }
                $props = @()
                try { $props = $s.PSObject.Properties.Name } catch { }
                $hasRun = $props -contains 'run'
                $hasUses = $props -contains 'uses'
                if (-not ($hasRun -or $hasUses)) { Safe-Write ("  Step {0}: MISSING run/uses" -f $i) } else { Safe-Write ("  Step {0}: OK" -f $i) }
                if ($hasRun -and $hasUses) { Safe-Write ("  Step {0}: BOTH run AND uses (suspicious)" -f $i) }
            }
        }
    } else { Safe-Write 'No jobs key found' }
}
