import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

for r in app.routes:
    path = getattr(r, 'path', '')
    methods = getattr(r, 'methods', None)
    if '/api/v1/notifications' in path:
        print(path, methods)
