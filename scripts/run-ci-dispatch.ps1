$ErrorActionPreference = 'Stop'

# Run from repo root: C:\GplusApp_backup
# Requires: gh CLI authenticated OR $env:GITHUB_TOKEN set (repo scope)

param(
  [string]$BranchName = "tmp/workflow-update"
)

$owner     = "Moo-hub"
$repoName  = "GplusAPP"
$repoFull  = "$owner/$repoName"
$branch    = $BranchName
$mainBranch= "main"

# Get GitHub token from env or gh auth
$token = $env:GITHUB_TOKEN
if (-not $token) {
  try {
    # Capture gh auth token output safely and trim whitespace. Use the call operator & to avoid parsing issues.
    $tokRaw = & gh auth token 2>$null | Out-String
    $token = $tokRaw.Trim()
  } catch {
    $token = $null
  }
}
if (-not $token) { Write-Error "GITHUB_TOKEN not set and gh auth token unavailable. Set env:GITHUB_TOKEN or run 'gh auth login'."; exit 1 }

# Helper: get file sha on branch (if exists)
function Get-RemoteSha {
  param([string]$path,[string]$ref)
  try {
  $uri = 'https://api.github.com/repos/' + $owner + '/' + $repoName + '/contents/' + $path + '?ref=' + $ref
  $hdr = @{ Authorization = "Bearer $token"; 'User-Agent' = 'run-ci-dispatch-script' }
    Write-Host "GET $uri"
    $resp = Invoke-RestMethod -Uri $uri -Headers $hdr -Method GET -ErrorAction Stop
    if ($resp -and $resp.sha) { Write-Host "-> sha: $($resp.sha)" }
    return $resp.sha
  } catch {
    Write-Host "GET failed for $path (ref=$ref)"
    try {
      $respStream = $_.Exception.Response.GetResponseStream()
      $sr = New-Object System.IO.StreamReader($respStream)
      $body = $sr.ReadToEnd()
      Write-Host "Response body:`n$body"
    } catch {
      Write-Host "(no response body)"
    }
    return $null
  }
}

# 1) Ensure branch exists remotely
try {
  gh api repos/$owner/$repoName/git/ref/heads/$branch --silent | Out-Null
  Write-Host "Remote branch '$branch' exists."
} catch {
  Write-Host "Remote branch '$branch' not found - creating from $mainBranch..."
  $mainSha = gh api repos/$owner/$repoName/git/ref/heads/$mainBranch --jq .object.sha
  if (-not $mainSha) { Write-Error "Cannot get '$mainBranch' sha"; exit 1 }
  gh api repos/$owner/$repoName/git/refs -X POST -f ref=refs/heads/$branch -f sha=$mainSha | Out-Null
  Write-Host "Created branch '$branch' at $mainSha."
}

# 2) Upload/update files via Contents API (pass sha when updating to avoid 422)
$files = @(
  @{ local = ".\frontend\src\setupTests.js"; repo = "frontend/src/setupTests.js"; msg = "ci(test): mock react-query-devtools in setupFiles" },
  @{ local = ".\frontend\src\App.jsx"; repo = "frontend/src/App.jsx"; msg = "ci(test): guard react-query-devtools import in App.jsx for test env" },
  @{ local = ".\.github\workflows\repository-dispatch-listener.yml"; repo = ".github/workflows/repository-dispatch-listener.yml"; msg = "ci(frontend): run Vitest (dot) on repository_dispatch" }
)

foreach ($f in $files) {
  if (-not (Test-Path $f.local)) { Write-Error "Local file not found: $($f.local)"; exit 1 }
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content $f.local -Raw)))
  $sha = Get-RemoteSha -path $f.repo -ref $branch
  # If not found on the target branch, try the main branch (branch may be out-of-date)
  if (-not $sha) {
    Write-Host "No sha on branch $branch; checking $mainBranch for existing file..."
    $sha = Get-RemoteSha -path $f.repo -ref $mainBranch
  if ($sha) { Write-Host ([string]::Format('Found sha on {0}: {1} (will use to update branch)', $mainBranch, $sha)) }
  }
  $uri = "https://api.github.com/repos/$owner/$repoName/contents/$($f.repo)"
  $body = @{ message = $f.msg; content = $b64; branch = $branch }
  if ($sha) { $body.sha = $sha; Write-Host "Updating $($f.repo) (sha=$sha)..." } else { Write-Host "Creating $($f.repo)..." }
  # Use Bearer auth header for REST calls
  $hdr = @{ Authorization = "Bearer $token"; 'User-Agent' = 'run-ci-dispatch-script' }
  try {
    $jsonBody = $body | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri $uri -Method PUT -Headers $hdr -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop | Out-Null
  } catch {
    Write-Host "Upload failed; attempting to refetch sha and retry..."
    try {
      $respStream = $_.Exception.Response.GetResponseStream()
      $sr = New-Object System.IO.StreamReader($respStream)
      $errBody = $sr.ReadToEnd()
      Write-Host "PUT error body:`n$errBody"
    } catch {
      Write-Host "(no error body available)"
    }
    # Try branch first, then main branch to find a usable sha
    $freshSha = Get-RemoteSha -path $f.repo -ref $branch
    if (-not $freshSha) {
      Write-Host "No sha on $branch; checking $mainBranch..."
      $freshSha = Get-RemoteSha -path $f.repo -ref $mainBranch
    }
    if ($freshSha) {
      Write-Host "Found fresh sha: $freshSha; retrying upload with sha..."
      $body.sha = $freshSha
      try {
        $jsonBody = $body | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Uri $uri -Method PUT -Headers $hdr -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop | Out-Null
        Write-Host "Retry OK: $($f.repo)"
        continue
      } catch {
        Write-Error "Retry failed for $($f.repo): $_"; exit 1
      }
    }
    Write-Error "Failed to upload $($f.repo) and no fresh sha obtained: $_"; exit 1
  }
  Write-Host "OK: $($f.repo)"
}

# 3) Trigger the workflow via workflow_dispatch on the specific workflow file
Write-Host "Triggering workflow dispatch for $branch via workflow API..."
$workflowFile = '.github/workflows/repository-dispatch-listener.yml'
$dispatchUri = 'https://api.github.com/repos/' + $owner + '/' + $repoName + '/actions/workflows/' + [System.Uri]::EscapeDataString($workflowFile) + '/dispatches'
$dispatchBody = @{ ref = $branch }
$jsonDispatch = $dispatchBody | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Uri $dispatchUri -Method POST -Headers $hdr -Body $jsonDispatch -ContentType 'application/json' -ErrorAction Stop
  Write-Host "Workflow dispatch posted for ref: $branch" 
} catch {
  Write-Error "Failed to post workflow dispatch: $_"
}

# 4) Find latest repository_dispatch run, watch and save logs/artifacts
Start-Sleep -Seconds 5
Write-Host "Waiting for workflow run to be created (by workflow name)..."

# Try to find the newest run for the workflow by workflow name (more reliable than headBranch)
$maxRunWait = 600  # wait up to 10 minutes for the workflow run to appear
$elapsed = 0
$runNum = $null
while ($elapsed -lt $maxRunWait -and -not $runNum) {
  try {
    # Use 'number' (the gh API field) rather than runNumber which older
    # versions of the CLI/editor integrations may not expose.
    $item = gh run list -R $repoFull --workflow "Repository Dispatch Listener" --limit 1 --json number,createdAt,workflowName --jq '.[0]' 2>$null
    if ($item -and $item -ne 'null') {
      $obj = $item | ConvertFrom-Json
      if ($obj.number) { $runNum = $obj.number; break }
    }
  } catch {
    # ignore transient CLI/JSON parse issues
  }
  Start-Sleep -Seconds 6
  $elapsed += 6
}
if (-not $runNum) { Write-Error "No workflow run found for 'Repository Dispatch Listener' within $maxRunWait seconds."; exit 1 }
Write-Host "Found runNumber: $runNum"

# Wait for run to complete and stream logs to console
gh run watch -R $repoFull $runNum

# Save logs
$logDir = Join-Path (Get-Location) "ci-logs"; $artDir = Join-Path $logDir "artifacts"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $artDir | Out-Null
$logFile = Join-Path $logDir "$runNum.log"
gh run view -R $repoFull $runNum --log > $logFile
Write-Host "Saved logs -> $logFile"

# Download artifact named 'vitest-report' after ensuring artifacts are available (poll with backoff)
try {
  $maxWaitSec = 300
  $delay = 3
  $elapsed = 0
  $found = $false
  while ($elapsed -lt $maxWaitSec -and -not $found) {
    try {
      Write-Host "Checking for artifacts for run $runNum (elapsed ${elapsed}s)..."
      $resp = gh api repos/$owner/$repoName/actions/runs/$runNum/artifacts --jq '.artifacts' 2>$null
      if ($resp -and $resp -ne '[]') { $found = $true; break }
    } catch {
      # ignore transient failures and retry
    }
    Start-Sleep -Seconds $delay
    $elapsed += $delay
    if ($delay -lt 30) { $delay = [math]::Min(30, $delay * 2) }
  }
  if ($found) {
    gh run download $runNum -R $repoFull --name vitest-report --dir $artDir
    Write-Host "Artifacts downloaded -> $artDir"
  } else {
    Write-Host "No artifacts found within $maxWaitSec seconds for run $runNum."
  }
} catch {
  try { $msg = $_.ToString() } catch { $msg = 'unknown error' }
  Write-Host "Artifact download failed or 'vitest-report' not present for run ${runNum}: ${msg}"
}

Write-Host "Script finished."
