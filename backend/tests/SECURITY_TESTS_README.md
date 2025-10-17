# Security Testing Suite for GPlus Recycling App

This directory contains a comprehensive suite of security tests for the GPlus Recycling App. These tests validate the security features implemented in the application, including authentication, authorization, CSRF protection, rate limiting, and security monitoring.

## Prerequisites

Before running the tests, ensure that:

1. The application is running (`uvicorn app.main:app --reload`)
2. Redis is running and properly configured
3. The required Python packages are installed:

   ```bash
   pip install requests redis pytest
   ```

## Test Scripts

### Master Test Runner

- `run_security_tests.py`: Runs all security tests in sequence

### Individual Test Scripts

- `test_security_monitoring.py`: Tests the security monitoring system
- `test_auth_security.py`: Tests authentication security features (CSRF, rate limiting, token validation)
- `test_role_based_security.py`: Tests role-based access control and protected routes

## Running Tests

### Running All Tests

To run all security tests at once:

```bash
python -m tests.run_security_tests
```

To skip the prerequisites check:

```bash
python -m tests.run_security_tests --skip-prereq
```

### Running Individual Tests

You can also run individual test scripts:

```bash
python -m tests.test_security_monitoring
python -m tests.test_auth_security
python -m tests.test_role_based_security
```

## What's Being Tested

1. **Security Monitoring**
   - Security event logging
   - Login attempt tracking
   - Redis storage for security events
   - Redis retention policies

2. **Authentication Security**
   - CSRF protection
   - Rate limiting
   - Token validation and type verification
   - Token blacklisting after logout

3. **Role-Based Security**
   - Admin-only route protection
   - User protected routes
   - Guest (unauthenticated) access limits

## Test Output

The tests provide detailed output indicating:

- ✅ Passed tests
- ❌ Failed tests
- Details of the requests and responses
- Summary of security event logging
- Redis security data storage information

## Troubleshooting

If tests are failing, check:

1. **Application Running**: Ensure the API is running and accessible
2. **Redis Connection**: Make sure Redis is running and properly configured
3. **Route Configuration**: Verify that the API routes match those expected by the tests
4. **Security Middleware**: Confirm that security middleware is properly registered
5. **Log Directory**: Ensure the `logs` directory exists and is writable

## Extending the Tests

To add new security tests:

1. Create a new test script or add test scenarios to existing scripts
2. Update `run_security_tests.py` to include any new test scripts
3. Follow the existing pattern for test scenarios and assertions

## Continuous Integration

These tests can be incorporated into CI/CD pipelines to ensure security features continue to work as expected.

Example GitHub Actions step:

```yaml
- name: Run Security Tests
  run: |
    cd backend
    python -m tests.run_security_tests --skip-prereq
```
