from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
resp = client.get('/openapi.json')
if resp.status_code != 200:
    print('openapi-fetch-failed', resp.status_code)
    raise SystemExit(1)

spec = resp.json()
paths = list(spec.get('paths', {}).keys())
tags = [t.get('name') for t in spec.get('tags', [])]
print('paths_count:', len(paths))
print('/api/v1/environmental/impacts' in paths)
print('tags:', tags)
