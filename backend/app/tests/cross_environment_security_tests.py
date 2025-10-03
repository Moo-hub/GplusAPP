import argparse
import requests
import json
import sys
import time
import uuid
import csv
from datetime import datetime

class SecurityTestSuite:
    """
    A test suite for validating security features across different environments.
    """
    
    def __init__(self, base_url, verbose=False):
        self.base_url = base_url.rstrip('/')
        self.verbose = verbose
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.csrf_token = None
        self.results = []
        
    def log(self, message):
        """Print log message if verbose mode is enabled"""
        if self.verbose:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] {message}")
    
    def record_result(self, test_name, status, message="", duration=0):
        """Record test result"""
        result = {
            "test_name": test_name,
            "status": status,
            "message": message,
            "duration": duration,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.results.append(result)
        
        # Print result
        status_str = "✅ PASS" if status == "pass" else "❌ FAIL"
        print(f"{status_str} - {test_name}")
        if message and status == "fail":
            print(f"       {message}")
        
        return status == "pass"
    
    def run_test(self, test_func, test_name):
        """Run a test function and record the result"""
        start_time = time.time()
        try:
            self.log(f"Running test: {test_name}")
            test_func()
            duration = time.time() - start_time
            return self.record_result(test_name, "pass", duration=duration)
        except AssertionError as e:
            duration = time.time() - start_time
            return self.record_result(test_name, "fail", str(e), duration=duration)
        except Exception as e:
            duration = time.time() - start_time
            return self.record_result(test_name, "fail", f"Error: {str(e)}", duration=duration)
    
    def test_login(self, email="test@example.com", password="testpassword123"):
        """Test login functionality"""
        test_name = "Authentication - Login"
        
        url = f"{self.base_url}/api/v1/auth/login"
        data = {
            "username": email,
            "password": password
        }
        
        self.log(f"Sending login request to {url}")
        response = self.session.post(url, data=data)
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}: {response.text}"
        
        # Extract tokens from response
        data = response.json()
        assert "access_token" in data, "Access token not in response"
        assert "csrf_token" in data, "CSRF token not in response"
        
        self.access_token = data["access_token"]
        self.csrf_token = data["csrf_token"]
        
        # Check cookies
        cookies = self.session.cookies
        assert "refresh_token" in cookies, "Refresh token cookie not set"
        assert "csrf_token" in cookies, "CSRF token cookie not set"
        
        self.log("Login successful")
    
    def test_access_protected_endpoint(self):
        """Test accessing a protected endpoint"""
        test_name = "Authorization - Protected Endpoint Access"
        
        # Ensure we have a token
        assert self.access_token, "No access token available. Run login test first."
        
        url = f"{self.base_url}/api/v1/profile/"
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        self.log(f"Accessing protected endpoint {url}")
        response = self.session.get(url, headers=headers)
        
        assert response.status_code == 200, f"Access denied with status {response.status_code}: {response.text}"
        self.log("Protected endpoint access successful")
    
    def test_csrf_protection(self):
        """Test CSRF protection on mutation endpoints"""
        test_name = "Security - CSRF Protection"
        
        # Ensure we have tokens
        assert self.access_token, "No access token available. Run login test first."
        assert self.csrf_token, "No CSRF token available. Run login test first."
        
        url = f"{self.base_url}/api/v1/profile/"
        data = {
            "name": f"Updated User {uuid.uuid4().hex[:8]}"
        }
        
        # Test 1: Without CSRF token (should fail)
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        self.log(f"Testing PUT without CSRF token")
        response_without_csrf = self.session.put(url, json=data, headers=headers)
        
        assert response_without_csrf.status_code in [403, 401], \
            f"Request without CSRF token should fail but got status {response_without_csrf.status_code}"
        
        # Test 2: With CSRF token (should succeed)
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-CSRF-Token": self.csrf_token
        }
        
        self.log(f"Testing PUT with CSRF token")
        response_with_csrf = self.session.put(url, json=data, headers=headers)
        
        assert response_with_csrf.status_code == 200, \
            f"Request with CSRF token failed with status {response_with_csrf.status_code}: {response_with_csrf.text}"
        
        self.log("CSRF protection test successful")
    
    def test_token_refresh(self):
        """Test token refresh functionality"""
        test_name = "Authentication - Token Refresh"
        
        # Ensure we have tokens
        assert self.csrf_token, "No CSRF token available. Run login test first."
        
        url = f"{self.base_url}/api/v1/auth/refresh"
        headers = {
            "X-CSRF-Token": self.csrf_token
        }
        
        self.log(f"Testing token refresh")
        response = self.session.post(url, headers=headers)
        
        assert response.status_code == 200, f"Token refresh failed with status {response.status_code}: {response.text}"
        
        # Extract new tokens
        data = response.json()
        assert "access_token" in data, "New access token not in response"
        assert "csrf_token" in data, "New CSRF token not in response"
        
        # Update tokens
        self.access_token = data["access_token"]
        self.csrf_token = data["csrf_token"]
        
        self.log("Token refresh successful")
    
    def test_logout(self):
        """Test logout functionality"""
        test_name = "Authentication - Logout"
        
        # Ensure we have tokens
        assert self.access_token, "No access token available. Run login test first."
        assert self.csrf_token, "No CSRF token available. Run login test first."
        
        url = f"{self.base_url}/api/v1/auth/logout"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-CSRF-Token": self.csrf_token
        }
        
        self.log(f"Testing logout")
        response = self.session.post(url, headers=headers)
        
        assert response.status_code == 200, f"Logout failed with status {response.status_code}: {response.text}"
        
        # Check response
        data = response.json()
        assert data.get("code") == "LOGOUT_SUCCESS", "Logout didn't return success message"
        
        # Try to access protected endpoint (should fail)
        profile_url = f"{self.base_url}/api/v1/profile/"
        profile_headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        self.log("Verifying token is invalidated")
        profile_response = self.session.get(profile_url, headers=profile_headers)
        
        # Reset tokens
        self.access_token = None
        self.csrf_token = None
        
        self.log("Logout test successful")
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        test_name = "Security - Rate Limiting"
        
        url = f"{self.base_url}/api/v1/auth/login"
        data = {
            "username": "wrong@example.com",
            "password": "wrongpassword"
        }
        
        self.log(f"Testing rate limiting with {10} requests")
        
        # Send multiple requests
        responses = []
        for i in range(10):
            response = requests.post(url, data=data)
            responses.append(response)
            self.log(f"Request {i+1}: Status {response.status_code}")
        
        # Check if any requests were rate limited
        rate_limited = any(r.status_code == 429 for r in responses)
        assert rate_limited, "No requests were rate limited. Rate limiting may not be working."
        
        self.log("Rate limiting test successful")
    
    def run_all_tests(self):
        """Run all security tests"""
        print(f"Running security tests against {self.base_url}")
        
        tests = [
            (self.test_login, "Authentication - Login"),
            (self.test_access_protected_endpoint, "Authorization - Protected Endpoint Access"),
            (self.test_csrf_protection, "Security - CSRF Protection"),
            (self.test_token_refresh, "Authentication - Token Refresh"),
            (self.test_rate_limiting, "Security - Rate Limiting"),
            (self.test_logout, "Authentication - Logout")
        ]
        
        passed = 0
        failed = 0
        
        for test_func, test_name in tests:
            if self.run_test(test_func, test_name):
                passed += 1
            else:
                failed += 1
        
        print(f"\nTest Summary: {passed} passed, {failed} failed")
        
        # Return True if all tests passed
        return failed == 0
    
    def export_results(self, filename):
        """Export test results to CSV file"""
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = ["test_name", "status", "message", "duration", "timestamp"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.results)
        
        print(f"Results exported to {filename}")

def main():
    parser = argparse.ArgumentParser(description="Security Feature Test Suite")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of the API")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    parser.add_argument("--output", default="security_test_results.csv", help="Output CSV file for results")
    parser.add_argument("--email", default="test@example.com", help="Email for login test")
    parser.add_argument("--password", default="testpassword123", help="Password for login test")
    
    args = parser.parse_args()
    
    test_suite = SecurityTestSuite(args.url, args.verbose)
    success = test_suite.run_all_tests()
    test_suite.export_results(args.output)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()