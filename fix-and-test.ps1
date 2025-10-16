param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$TestsPath = ".\tests\test_environmental.py",
  [string]$PythonExe = "python",
  [string]$PytestExe = "pytest",
  [switch]$DryRun,
  [switch]$Confirm,
  [int]$TimeoutSec = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-Timestamp { (Get-Date).ToString("yyyyMMddTHHmmss") }
function PSep { [System.IO.Path]::PathSeparator }

$ts = New-Timestamp
$logsDir = Join-Path $RepoRoot "ci-logs\$ts"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

Push-Location $RepoRoot
try {
  $summary = [ordered]@{
    RepoRoot   = $RepoRoot
    DryRun     = [bool]$DryRun
    Confirm    = [bool]$Confirm
    PythonExe  = $PythonExe
    PytestExe  = $PytestExe
    TestsPath  = $TestsPath
    LogsDir    = $logsDir
  }

  # 1) اكتشاف/عزل app.py
  $rootApp = Join-Path $RepoRoot "app.py"
  $willBackup = $false
  if (Test-Path $rootApp) {
    $head = (Get-Content $rootApp -TotalCount 5 -ErrorAction SilentlyContinue) -join "`n"
    if ($head -match '(^|\r?\n)\s*(---|\+\+\+|@@|<<<<<<<|=======|>>>>>>>)') {
      $willBackup = $true
    } else {
      if (Test-Path (Join-Path $RepoRoot "app")) { $willBackup = $true }
    }
  }
  $summary.BackupRootApp = $willBackup

  if ($DryRun) {
    $summary.Action = "DryRun: would" + ($(if($willBackup){" backup app.py -> app.py.bak.$ts;"} else {" skip backup;"}) + " ensure app package; generate app/main.py if missing; set env; run pytest")
    $summary | ConvertTo-Json -Depth 5 | Tee-Object -File (Join-Path $logsDir "summary.json") | Out-Null
    Pop-Location
    exit 0
  }

  if ($willBackup) {
    $bak = Join-Path $RepoRoot ("app.py.bak." + $ts)
    if (-not $Confirm) { throw "Safety: set -Confirm to allow modifying/renaming app.py" }
    Rename-Item $rootApp $bak -Force
    $summary.BackupPath = $bak
  }

  # 2) ضمان حزمة app/ و __init__.py
  $appDir = Join-Path $RepoRoot "app"
  if (-not (Test-Path $appDir)) { New-Item -ItemType Directory -Path $appDir -Force | Out-Null }
  $initFile = Join-Path $appDir "__init__.py"
  if (-not (Test-Path $initFile)) { New-Item -ItemType File -Path $initFile -Force | Out-Null }

  # 3) إنشاء app/main.py باستعمال importlib
  $mainFile = Join-Path $appDir "main.py"
  if (-not (Test-Path $mainFile)) {
@'
import importlib
from fastapi import FastAPI

app = FastAPI()

candidates = [
    "backend.environmental.router",
    "app.environmental.router",
    "environmental.router",
]
env_router = None
for mod in candidates:
    try:
        m = importlib.import_module(mod)
        env_router = getattr(m, "router", None)
        if env_router:
            break
    except Exception:
        continue

if env_router:
    app.include_router(env_router, prefix="/api/v1/environmental")

@app.get("/health")
def health():
    return {"status": "ok"}
'@ | Set-Content -Path $mainFile -Encoding utf8
    $summary.GeneratedMain = $true
  } else {
    $summary.GeneratedMain = $false
  }

  # 4) ضبط بيئة الاختبار
  $oldPP = $env:PYTHONPATH
  $pp = $RepoRoot
  if (Test-Path (Join-Path $RepoRoot "backend")) { $pp = $pp + (PSep) + (Join-Path $RepoRoot "backend") }
  $env:PYTHONPATH = $pp
  $env:ENVIRONMENT = "test"
  $summary.PYTHONPATH = $env:PYTHONPATH

  # 5) فحص الاستيراد
  $importScriptPath = Join-Path $logsDir "import_check.py"
@'
try:
    from app.main import app
    assert app is not None
    print("IMPORT_OK")
except Exception as e:
    import traceback
    print("IMPORT_FAIL:", e)
    traceback.print_exc()
    raise SystemExit(2)
'@ | Set-Content -Path $importScriptPath -Encoding utf8

  $importOut = & $PythonExe $importScriptPath 2>&1
  $importOut | Tee-Object -File (Join-Path $logsDir "import_check.txt") | Out-Null
  if (-not ($importOut -match "IMPORT_OK")) { throw "Import failed (see import_check.txt)" }

  # 6) تشغيل pytest وتسجيل المخرجات
  $target = $TestsPath
  if (-not (Test-Path $target)) {
    if (Test-Path ".\tests") { $target = ".\tests" } else { $target = "." }
  }
  $summary.PytestTarget = $target

  $pytestLog = Join-Path $logsDir "pytest_output.txt"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $PytestExe
  $psi.Arguments = "-q `"$target`""
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $null = $p.Start()

  $sw = [Diagnostics.Stopwatch]::StartNew()
  $stdOut = $p.StandardOutput.ReadToEnd()
  $stdErr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  $sw.Stop()

  $stdOut | Tee-Object -File $pytestLog | Out-Null
  if ($stdErr) { $stdErr | Tee-Object -File (Join-Path $logsDir "pytest_stderr.txt") | Out-Null }

  $summary.PytestExitCode = $p.ExitCode
  $summary.DurationSec = [int]$sw.Elapsed.TotalSeconds
  $summary | ConvertTo-Json -Depth 5 | Tee-Object -File (Join-Path $logsDir "summary.json") | Out-Null

  if ($p.ExitCode -eq 0) { Write-Host "Tests PASSED"; $exit = 0 }
  else { Write-Host "Tests FAILED (exit=$($p.ExitCode))"; $exit = 1 }

  # إعادة PYTHONPATH القديم
  $env:PYTHONPATH = $oldPP
  Pop-Location
  exit $exit
}
catch {
  $msg = $_.Exception.Message
  "$msg" | Tee-Object -File (Join-Path $logsDir "error.txt") | Out-Null
  # تمييز الأخطاء
  if ($msg -match "Import failed") { $code = 2 }
  elseif ($msg -match "Confirm") { $code = 3 }
  else { $code = 3 }
  Pop-Location
  exit $code
}
