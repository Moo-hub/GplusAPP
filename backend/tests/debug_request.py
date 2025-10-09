import os
os.environ['ENVIRONMENT'] = 'test'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from app.main import app
from app.core.security import create_access_token
from fastapi.testclient import TestClient

client = TestClient(app)

def print_me(token=None):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    r = client.get('/api/v1/auth/me', headers=headers)
    print('STATUS', r.status_code)
    try:
        print('JSON:', r.json())
    except Exception:
        print('TEXT:', r.text)

if __name__ == '__main__':
    # create a token for user id 1
    token = create_access_token(subject=1, extra_data={'role':'user','disabled':False})
    print('USING TOKEN:', token)
    print_me(token)
    print('\nNOW INVALID TOKEN')
    print_me('invalidtoken')
