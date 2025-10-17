import pytest
import time
from fastapi.testclient import TestClient
from jose import jwt
import redis
import json

from app.main import app
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_csrf_token,
    verify_csrf_token,
    add_token_to_blacklist,
    is_token_blacklisted,
    decode_token
)
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.crud.user import create as create_user
from app.schemas.user import UserCreate

# Test client
client = TestClient(app)

# Fixtures
@pytest.fixture
def db_session():
    """Get a DB session for testing"""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def redis_client():
    """Get a Redis client for testing"""
    r = redis.Redis.from_url(settings.REDIS_URL)
    yield r
    # Clean up any test keys
    for key in r.keys("test:*"):
        r.delete(key)

@pytest.fixture
def test_user(db_session):
    """Create a test user for authentication tests"""
    user_in = UserCreate(
        email="test@example.com",
        password="testpassword123",
        name="Test User"
    )
    
    # Check if user already exists
    user = db_session.query(User).filter(User.email == user_in.email).first()
    if not user:
        user = create_user(db_session, obj_in=user_in)
    
    return user

@pytest.fixture
def test_superuser(db_session):
    """Create a test superuser for admin tests"""
    user_in = UserCreate(
        email="admin@example.com",
        password="adminpassword123",
        name="Admin User"
    )
    
    # Check if user already exists
    user = db_session.query(User).filter(User.email == user_in.email).first()
    if not user:
        user = create_user(db_session, obj_in=user_in)
        # Set as superuser
        user.is_superuser = True
        db_session.commit()
        db_session.refresh(user)
    
    return user

@pytest.fixture
def test_company_user(db_session):
    """Create a test company user for company role tests"""
    user_in = UserCreate(
        email="company@example.com",
        password="companypassword123",
        name="Company User"
    )
    
    # Check if user already exists
    user = db_session.query(User).filter(User.email == user_in.email).first()
    if not user:
        user = create_user(db_session, obj_in=user_in)
        # Set as company role
        user.role = "company"
        user.company_id = 1
        db_session.commit()
        db_session.refresh(user)
    
    return user

@pytest.fixture
def test_tokens(test_user):
    """Generate test tokens for a user"""
    access_token = create_access_token(test_user.id)
    refresh_token = create_refresh_token(test_user.id)
    csrf_token = generate_csrf_token()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token
    }

class TestSecurity:
    """Test suite for security features"""
    
    def test_token_creation_and_verification(self, test_user):
        """Test creating and verifying tokens"""
        # Create tokens
        access_token = create_access_token(test_user.id)
        refresh_token = create_refresh_token(test_user.id)
        
        # Verify tokens
        access_payload = decode_token(access_token)
        refresh_payload = decode_token(refresh_token)
        
        # Check token types
        assert access_payload.get("type") == "access"
        assert refresh_payload.get("type") == "refresh"
        
        # Check user ID
        assert access_payload.get("sub") == str(test_user.id)
        assert refresh_payload.get("sub") == str(test_user.id)
        
        # Check JTIs exist
        assert "jti" in access_payload
        assert "jti" in refresh_payload
    
    def test_token_blacklisting(self, redis_client):
        """Test token blacklisting functionality"""
        # Create token
        token_jti = "test-jti-1234"
        
        # Should not be blacklisted initially
        assert not is_token_blacklisted(token_jti)
        
        # Blacklist the token
        add_token_to_blacklist(token_jti, 600)  # 10 minutes
        
        # Should be blacklisted now
        assert is_token_blacklisted(token_jti)
    
    def test_csrf_token_validation(self):
        """Test CSRF token generation and validation"""
        # Generate CSRF token
        csrf_token = generate_csrf_token()
        
        # Create mock request with CSRF cookie
        class MockRequest:
            def __init__(self, cookies):
                self.cookies = cookies
        
        mock_request = MockRequest({"csrf_token": csrf_token})
        
        # Validate token
        assert verify_csrf_token(mock_request, csrf_token) is True
        
        # Invalid token should fail
        assert verify_csrf_token(mock_request, "invalid-token") is False
        
        # Missing token should fail
        assert verify_csrf_token(mock_request, None) is False
    
    def test_login_endpoint(self, test_user):
        """Test the login endpoint with valid credentials"""
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={"username": test_user.email, "password": "testpassword123"}
        )
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "csrf_token" in data
        assert "user" in data
        assert data["user"]["id"] == test_user.id
        
        # Check cookies are set
        cookies = response.cookies
        assert "refresh_token" in cookies
        assert "csrf_token" in cookies
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={"username": "wrong@example.com", "password": "wrongpassword"}
        )
        
        # Check response
        assert response.status_code == 401
        data = response.json()
        assert data.get("detail", {}).get("code") == "AUTHENTICATION_FAILED"
    
    def test_refresh_token_endpoint(self, test_user, redis_client):
        """Test refresh token endpoint"""
        # First login to get tokens
        login_response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={"username": test_user.email, "password": "testpassword123"}
        )
        
        # Extract tokens from login response
        login_data = login_response.json()
        csrf_token = login_data["csrf_token"]
        cookies = login_response.cookies
        
        # Call refresh endpoint with the cookies
        refresh_response = client.post(
            f"{settings.API_V1_STR}/auth/refresh",
            headers={"X-CSRF-Token": csrf_token},
            cookies={
                "refresh_token": cookies["refresh_token"],
                "csrf_token": cookies["csrf_token"]
            }
        )
        
        # Check response
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert "access_token" in data
        assert "csrf_token" in data
        assert "user" in data
        
        # Check new cookies are set
        new_cookies = refresh_response.cookies
        assert "refresh_token" in new_cookies
        assert "csrf_token" in new_cookies
        
        # Original refresh token should be blacklisted
        refresh_token = cookies["refresh_token"]
        payload = decode_token(refresh_token)
        jti = payload.get("jti")
        assert is_token_blacklisted(jti)
    
    def test_logout_endpoint(self, test_user):
        """Test logout endpoint"""
        # First login to get tokens
        login_response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={"username": test_user.email, "password": "testpassword123"}
        )
        
        # Extract tokens from login response
        login_data = login_response.json()
        csrf_token = login_data["csrf_token"]
        cookies = login_response.cookies
        
        # Call logout endpoint
        logout_response = client.post(
            f"{settings.API_V1_STR}/auth/logout",
            headers={"X-CSRF-Token": csrf_token},
            cookies={
                "refresh_token": cookies["refresh_token"],
                "csrf_token": cookies["csrf_token"]
            }
        )
        
        # Check response
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert data["code"] == "LOGOUT_SUCCESS"
        
        # Refresh token should be blacklisted
        refresh_token = cookies["refresh_token"]
        payload = decode_token(refresh_token)
        jti = payload.get("jti")
        assert is_token_blacklisted(jti)
        
        # Check cookies are cleared
        assert "refresh_token" not in logout_response.cookies
        assert "csrf_token" not in logout_response.cookies
    
    def test_protected_endpoint_with_valid_token(self, test_user):
        """Test protected endpoint with valid token"""
        # Get a valid token
        access_token = create_access_token(test_user.id)
        
        # Call protected endpoint
        response = client.get(
            f"{settings.API_V1_STR}/profile/",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
    
    def test_protected_endpoint_with_invalid_token(self):
        """Test protected endpoint with invalid token"""
        # Call protected endpoint with invalid token
        response = client.get(
            f"{settings.API_V1_STR}/profile/",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        # Check response
        assert response.status_code == 401
    
    def test_protected_endpoint_with_csrf_required(self, test_user):
        """Test protected endpoint that requires CSRF protection"""
        # Get valid tokens
        access_token = create_access_token(test_user.id)
        csrf_token = generate_csrf_token()
        
        # Call endpoint without CSRF token (should fail)
        response_without_csrf = client.put(
            f"{settings.API_V1_STR}/profile/",
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {access_token}"},
            cookies={"csrf_token": csrf_token}
        )
        
        # Should fail without CSRF header
        assert response_without_csrf.status_code == 403
        
        # Call endpoint with CSRF token
        response_with_csrf = client.put(
            f"{settings.API_V1_STR}/profile/",
            json={"name": "Updated Name"},
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-CSRF-Token": csrf_token
            },
            cookies={"csrf_token": csrf_token}
        )
        
        # Should succeed with CSRF token
        assert response_with_csrf.status_code == 200
    
    def test_role_based_access(self, test_user, test_superuser):
        """Test role-based access control"""
        # Get tokens for regular user and superuser
        user_token = create_access_token(test_user.id)
        superuser_token = create_access_token(
            test_superuser.id, 
            extra_data={"role": "admin"}
        )
        
        # Admin endpoint with regular user (should fail)
        admin_endpoint_with_user = client.get(
            f"{settings.API_V1_STR}/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should fail with 403 Forbidden
        assert admin_endpoint_with_user.status_code == 403
        
        # Admin endpoint with superuser (should succeed)
        admin_endpoint_with_superuser = client.get(
            f"{settings.API_V1_STR}/admin/users",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        
        # Should succeed
        assert admin_endpoint_with_superuser.status_code == 200
    
    def test_rate_limiting(self):
        """Test rate limiting middleware"""
        # Make multiple requests in a short time
        responses = []
        for _ in range(10):
            response = client.post(
                f"{settings.API_V1_STR}/auth/login",
                data={"username": "wrong@example.com", "password": "wrongpassword"}
            )
            responses.append(response)
        
        # Some of the later requests should be rate limited (429 Too Many Requests)
        assert any(r.status_code == 429 for r in responses)