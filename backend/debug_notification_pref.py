from app.main import app
from fastapi.testclient import TestClient
from app.tests.utils.user import create_random_user, user_authentication_headers
from app.db.session import get_db
from app.db.init_db import init_db
from app.db.session import SessionLocal

client = TestClient(app)

# Create a DB session and a user
from app.db.session import engine
from app.db.base import Base
Base.metadata.create_all(bind=engine)

# create user via helper
session = SessionLocal()
user = create_random_user(session)
headers = user_authentication_headers(client, user.email, "testpassword")
print('Headers:', headers)
resp = client.get('/api/v1/notifications/preferences', headers=headers)
print('Status', resp.status_code)
print('Body:', resp.text)

session.close()