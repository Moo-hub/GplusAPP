# templates/backend_fastapi/tests/manual/README.md

# Manual Test Scripts

This directory contains manual test scripts that require manual intervention or setup.
These tests are marked with `@pytest.mark.manual` and are excluded from automated test runs.

To run only non-manual tests:
```bash
pytest -k "not manual"
```

To run manual tests:
```bash
pytest -k "manual" -v
```
