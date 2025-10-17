import os
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

from app.db.base import Base
from app.db.session import engine

# Ensure DB/tables exist and app seeds same as tests/conftest
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# create a token for test user (subject 1)
access_token = create_access_token(subject=1, extra_data={"role": "user", "disabled": False})
headers = {"Authorization": f"Bearer {access_token}"}

endpoints = [
    ("GET", "/api/v1/users/me", headers),
    ("GET", "/api/v1/pickups/admin", headers),
]

for method, path, hdrs in endpoints:
    print("\nCALLING:", method, path)
    if method == "GET":
        resp = client.get(path, headers=hdrs)
    elif method == "POST":
        resp = client.post(path, headers=hdrs)
    else:
        resp = None
    print("STATUS:", resp.status_code)
    try:
        print("JSON:", resp.json())
    except Exception:
        print("TEXT:", resp.text)

print('\nDone')
