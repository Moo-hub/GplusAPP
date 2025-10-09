# Running backend tests locally on Windows (PowerShell)

This short guide explains how to run the backend test-suite on Windows using a virtual environment. Tests are hermetic (in-memory SQLite + dependency overrides) so they run quickly and deterministically on Windows.

## Prerequisites

- Python 3.10+ installed
- A project virtual environment (convention: `backend/.venv`)

## Quick steps (PowerShell)

1) Open PowerShell and change to the `backend` directory:

```powershell
Set-Location -Path 'C:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\backend'
```

2) Create and activate a virtual environment (if you don't have one):

```powershell
python -m venv .venv
& '.\.venv\Scripts\Activate.ps1'
```

3) Install dependencies (first time or when requirements change):

```powershell
pip install -r requirements.txt
```

4) Run the hermetic, non-manual pytest suite (excludes tests marked `manual`):

```powershell
pytest -q -k "not manual"
```

## Notes and tips

- The test fixtures use an in-memory SQLite database with SQLAlchemy StaticPool so tests are deterministic on Windows.
- To run the full test-suite including manual tests, remove the `-k "not manual"` filter.
- If you see import errors, ensure the venv is activated and `Set-Location` is pointed to the `backend` directory.
- To run a single test or file:

```powershell
pytest -q path\to\test_file.py::test_name
```

- To run the application locally for manual testing with reload:

```powershell
$env:PYTHONPATH='.'; Set-Location -Path 'C:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\backend'; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If you'd like, I can add a VS Code task or a simple `make test-windows` script to make this a one-command operation.
 # Running backend tests locally on Windows (PowerShell)

This file documents a minimal, hermetic way to run the backend test-suite on Windows using the project's virtual environment.

Prerequisites



Steps (PowerShell)

1. Activate the virtual environment (PowerShell):

```powershell
& "${PWD}\\backend\\.venv\\Scripts\\Activate.ps1"
```

1. Install dependencies (only needed the first time or when dependencies change):

```powershell
pip install -r backend/requirements.txt
```

1. Run the hermetic, non-manual pytest suite from the `backend` directory:

```powershell
Set-Location -Path "${PWD}\\backend"
pytest -q -k "not manual"
```

Notes and tips




If you'd like I can add a `make test-windows` npm-style script or a simple PowerShell task to the VS Code `tasks.json` to make this one-shot.
## Windows local testing (backend) - quick guide

This file explains how to run the hermetic backend tests locally on Windows (PowerShell).

1. Create and activate a virtual environment (if not already):

    ```powershell
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    ```

1. Install required dependencies:

    ```powershell
    pip install -r requirements.txt
    ```

    If your repo uses a different requirements file or a project-local `.venv`, adapt the commands accordingly.

1. Run the non-manual pytest suite (excludes tests marked `manual`):

    ```powershell
    Set-Location -Path "$PSScriptRoot"  # or cd to backend folder
    pytest -q -k "not manual"
    ```

1. Run a single test file or test case:

    ```powershell
    pytest -q path\\to\\test_file.py::test_name
    ```

Notes:


    ```powershell
    $env:PYTHONPATH='.'; Set-Location -Path 'C:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\backend'; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    ```

If you want me to adjust CI behavior (make linters advisory), I can patch `.github/workflows/ci.yml` next.
