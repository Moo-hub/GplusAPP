# scripts/run-regen-and-frontend-rest.ps1
# REST-based orchestration to run regen-lockfile -> frontend CI -> fallback repository_dispatch
# Requirements:
# - Set environment variable GITHUB_TOKEN to a Personal Access Token with repo + workflow scopes
# - PowerShell 7+

param(
  [string]$Owner = "Moo-hub",
  [string]$Repo = "GplusAPP",
  [string]$FeatureRef = "feature/refactor-batch-2-cont",
  [string]$RegenWorkflowFile = "regen-lockfile.yml",
  [string]$FrontendWorkflowFile = "frontend-ci.yml",
  [string]$DriverWorkflowFile = "frontend-dispatch.yml",
  [string]$DriverEventType = "frontend-ci-run",
  [int]$PollIntervalSec = 5,
  [int]$TimeoutSec = 3600
)

$ErrorActionPreference = "Stop"

function Invoke-GH {
  param([string]$Method, [string]$Uri, [hashtable]$Body)
  $Headers = @{ Authorization = "token $env:GITHUB_TOKEN"; "User-Agent" = "ps" }
  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -ContentType "application/json" -Body $json
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
  }
}

function Get-LatestRunByWorkflow {
  param([string]$WorkflowFile, [string]$Branch)
  $uri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$WorkflowFile/runs?branch=$Branch&per_page=1"
  $resp = Invoke-GH -Method GET -Uri $uri
  return $resp.workflow_runs | Select-Object -First 1
}

function Wait-RunComplete {
  param([string]$WorkflowFile, [string]$Branch, [int]$TimeoutSecLocal = $TimeoutSec)
  $start = Get-Date
  do {
    Start-Sleep -Seconds $PollIntervalSec
    $run = Get-LatestRunByWorkflow -WorkflowFile $WorkflowFile -Branch $Branch
    if ($run) {
      Write-Host ("[{0}] status={1} conclusion={2} id={3}" -f (Get-Date), $run.status, $run.conclusion, $run.id)
      if ($run.status -eq "completed") { return $run }
    } else {
      Write-Host ("[{0}] no run yet for {1} on {2}" -f (Get-Date), $WorkflowFile, $Branch)
    }
  } while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSecLocal)
  throw "Timeout waiting for run to complete on $WorkflowFile@$Branch"
}

function Invoke-WorkflowDispatch {
  param([string]$WorkflowFile, [string]$Ref)
  $uri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$WorkflowFile/dispatches"
  $body = @{ ref = $Ref }
  try {
    Invoke-GH -Method POST -Uri $uri -Body $body | Out-Null
  } catch {
    throw $_
  }
}

function Invoke-RepositoryDispatch {
  param([string]$EventType, [hashtable]$Payload)
  $uri = "https://api.github.com/repos/$Owner/$Repo/dispatches"
  $body = @{ event_type = $EventType; client_payload = $Payload }
  Invoke-GH -Method POST -Uri $uri -Body $body | Out-Null
}

# 0) validate token
if ([string]::IsNullOrEmpty($env:GITHUB_TOKEN)) {
  Write-Error "GITHUB_TOKEN is not set. Please export a PAT with repo,workflow scopes."
  exit 2
}

# 1) regen-lockfile
Write-Host "Triggering $RegenWorkflowFile on $FeatureRef ..."
try {
  Invoke-WorkflowDispatch -WorkflowFile $RegenWorkflowFile -Ref $FeatureRef
} catch {
  Write-Error ("Failed to dispatch {0}: {1}" -f $RegenWorkflowFile, $_.Exception.Message)
  exit 2
}
$regenRun = Wait-RunComplete -WorkflowFile $RegenWorkflowFile -Branch $FeatureRef
if ($regenRun.conclusion -ne "success") {
  Write-Error "regen-lockfile failed: runId=$($regenRun.id)"
  exit 1
}

# 2) Frontend CI via workflow_dispatch, fallback to repository_dispatch
$frontendOk = $true
try {
  Write-Host "Triggering $FrontendWorkflowFile on $FeatureRef ..."
  Invoke-WorkflowDispatch -WorkflowFile $FrontendWorkflowFile -Ref $FeatureRef
} catch {
  $frontendOk = $false
  Write-Warning "Direct workflow_dispatch failed for frontend CI, will fallback to repository_dispatch."
}

if ($frontendOk) {
  $feRun = Wait-RunComplete -WorkflowFile $FrontendWorkflowFile -Branch $FeatureRef
  if ($feRun.conclusion -eq "success") { Write-Host "frontend-ci success"; exit 0 } else { Write-Error "frontend-ci failed: runId=$($feRun.id)"; exit 1 }
}

# 3) Fallback to repository_dispatch driver on main
Write-Host "Falling back to repository_dispatch driver on main ..."
Invoke-RepositoryDispatch -EventType $DriverEventType -Payload @{ ref = $FeatureRef }

$driverRun = Wait-RunComplete -WorkflowFile $DriverWorkflowFile -Branch "main"
if ($driverRun.conclusion -eq "success") { Write-Host "driver success"; exit 0 } else { Write-Error "driver failed: runId=$($driverRun.id)"; exit 1 }
