param()

$owner = 'Moo-hub'
$repo = 'GplusAPP'

function Log($m){ Write-Output $m }

# Ensure ConvertFrom-Yaml is available
if (-not (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue)) {
    try { Install-Module powershell-yaml -Scope CurrentUser -Force -ErrorAction Stop | Out-Null; Import-Module powershell-yaml -ErrorAction Stop } catch { Log "Cannot install powershell-yaml: $($_.Exception.Message)"; exit 2 }
}

# Get list of files in .github/workflows
$apiList = gh api repos/$owner/$repo/contents/.github/workflows --silent
if (-not $apiList) { Log "Failed to list remote workflows via gh api"; exit 3 }
$files = $apiList | ConvertFrom-Json

foreach ($f in $files) {
    $path = $f.path
    Log "--- $path ---"
    try {
        $contentJson = gh api repos/$owner/$repo/contents/$path --silent | ConvertFrom-Json
        $b64 = $contentJson.content
        $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64))
    } catch {
        Log ([string]::Format('Failed to fetch content for {0}: {1}', $path, $_.Exception.Message)); continue
    }

    if ($decoded -match '<<<<<<<|=======|>>>>>>>') { Log 'CONFLICT MARKERS FOUND' } else { Log 'No conflict markers' }

    try {
        $doc = $decoded | ConvertFrom-Yaml
        if ($null -eq $doc.name) { Log 'Missing name' } else { Log ("name: {0}" -f $doc.name) }
        if ($null -eq $doc.on) { Log 'Missing on' } else { Log 'has on: OK' }
    } catch {
        Log ("YAML PARSE ERROR: {0}" -f $_.Exception.Message)
    }
}
