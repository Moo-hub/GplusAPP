import sys
from pathlib import Path
# Ensure the backend package is importable when the script is run directly
repo_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo_root))

from app.main import app
from fastapi.testclient import TestClient
import json

c = TestClient(app)
resp = c.get("/api/v1/environmental-impact/")
print(resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)
