# Robust runner to dispatch repository event for frontend CI, watch the run, and save logs
# Usage: powershell.exe -NoExit -File .\scripts\run-ci.ps1

param(
    [string]$branch = 'ci/unify-vitest-sync-WIP',
    [int]$pollIntervalSec = 5
)

$ErrorActionPreference = 'Stop'

function Write-ErrorAndExit($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Running CI dispatch runner for branch: $branch"

    # check gh auth
    Write-Host "Checking gh auth status..."
    gh auth status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "gh is not authenticated. Please run: gh auth login --web" -ForegroundColor Yellow
        Read-Host 'Press Enter to exit'
        exit 1
    }

    $token = gh auth token
    if (-not $token) {
        Write-Host "Unable to read gh auth token; ensure gh is logged in" -ForegroundColor Yellow
        Read-Host 'Press Enter to exit'
        exit 1
    }

    $body = @{ event_type = 'run-ci-for-branch'; client_payload = @{ ref = $branch } } | ConvertTo-Json -Depth 5

    Write-Host "Sending repository_dispatch for branch: $branch"
    # Use Invoke-WebRequest for cross-platform compatibility and clearer status handling
    $status = $null
    try {
        $webResp = Invoke-WebRequest -Uri 'https://api.github.com/repos/Moo-hub/GplusAPP/dispatches' -Method Post -Headers @{ Authorization = "token $token"; Accept = 'application/vnd.github+json' } -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
        $status = $webResp.StatusCode
    } catch {
        # Try to extract HTTP status code from the response if present
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            try { $status = [int]$_.Exception.Response.StatusCode } catch { $status = $_.Exception.Response.StatusCode }
        } else {
            Write-Host "Dispatch request failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host $_.Exception | Out-String
            Read-Host 'Press Enter to exit'
            exit 1
        }
    }

    if ($status -eq 204 -or $status -eq '204') {
        Write-Host "Dispatch accepted (HTTP $status). Waiting for workflow run to be created..."
    } else {
        Write-Host "Dispatch response HTTP code: $status" -ForegroundColor Yellow
        Write-Host "If not 204, check permissions and payload format (gh auth / token scopes). Exiting." -ForegroundColor Yellow
        Read-Host 'Press Enter to exit'
        exit 1
    }

    # Poll for a new run matching the branch (robust: use gh api to get workflow_runs)
    Write-Host "Polling for runs on branch: $branch"
    $run = $null
    $tries = 0
    # allow a longer polling window (up to ~10 minutes by default)
    while (-not $run -and $tries -lt 120) {
        Start-Sleep -Seconds $pollIntervalSec
        $tries++

        # Fetch workflow runs via gh api (returns JSON that includes workflow_runs array)
        $jsonRaw = gh api repos/Moo-hub/GplusAPP/actions/runs --jq '.workflow_runs' 2>$null
        if (-not $jsonRaw) { continue }

        $clean = $jsonRaw.Trim()
        if ($clean.Length -eq 0) { continue }

        # Ensure we have a JSON array starting point
        $firstChar = $clean[0]
        if ($firstChar -ne '[' -and $firstChar -ne '{') {
            $idx = $clean.IndexOf('[')
            if ($idx -ge 0) { $clean = $clean.Substring($idx).Trim() }
        }

        try {
            $runs = $clean | ConvertFrom-Json -ErrorAction Stop
        } catch {
            # Save raw output for inspection and continue polling
            $debugDir = Join-Path (Get-Location) 'ci-logs'
            if (-not (Test-Path $debugDir)) { New-Item -ItemType Directory -Path $debugDir | Out-Null }
            $rawFile = Join-Path $debugDir "gh-run-list-raw-$((Get-Date).ToString('yyyyMMddHHmmss')).txt"
            $jsonRaw | Out-File -FilePath $rawFile -Encoding utf8
            Write-Host "Failed to parse gh api runs JSON. Saved raw output to $rawFile" -ForegroundColor Yellow
            continue
        }

        if (-not $runs) { continue }

        # Normalize to array
        if ($runs -is [System.Array]) { $items = $runs } else { $items = @($runs) }

        # Prefer repository_dispatch events (driver uses dispatch). Pick latest repository_dispatch run and inspect its logs for client_payload.ref after saving.
        $match = $items | Where-Object { $_.event -eq 'repository_dispatch' } | Sort-Object -Property @{Expression={ if ($_.created_at) { $_.created_at } else { $_.createdAt } }} -Descending | Select-Object -First 1
        if ($match) {
            $run = $match
            Write-Host "Selected repository_dispatch run id: $($run.id). Will watch it and save logs; inspect the logs for client_payload.ref to verify the target branch." -ForegroundColor Cyan
            break
        }
    }

    if (-not $run) {
        Write-Host "No run found for branch $branch after polling. Listing recent runs for manual inspection:" -ForegroundColor Yellow
        gh run list -R Moo-hub/GplusAPP --limit 30
        Read-Host 'Press Enter to exit'
        exit 1
    }

    $runId = $run.id
    Write-Host "Found run id: $runId (workflow: $($run.name))"

    # Watch the run until completion
    Write-Host "Watching run $runId. This will stream logs to console."
    gh run watch $runId -R Moo-hub/GplusAPP

    # After completion, save full log
    $outDir = Join-Path -Path (Get-Location) -ChildPath 'ci-logs'
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    $logFile = Join-Path $outDir "$runId.log"
    Write-Host "Saving full run log to $logFile"
    gh run view $runId --repo Moo-hub/GplusAPP --log > $logFile

    Write-Host "Done. Logs saved to $logFile"
    Read-Host 'Press Enter to exit'

} catch {
    Write-Host "Unhandled error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.StackTrace
    Read-Host 'Press Enter to exit'
    exit 1
}
