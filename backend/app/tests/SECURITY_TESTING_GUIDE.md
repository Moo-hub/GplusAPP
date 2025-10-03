# Security Testing Guide

This guide describes how to run comprehensive security tests on the GPlus application across different environments.

## Test Suites

We have created three different test suites to validate our security implementation:

1. **Unit Tests** (`test_security_features.py`): Validates individual security components
2. **Rate Limiting Tests** (`test_rate_limiting.py`): Specifically tests our rate limiting implementation
3. **Cross-Environment Tests** (`cross_environment_security_tests.py`): End-to-end tests to validate security across different environments

## Prerequisites

Before running the tests, make sure you have:

1. Python 3.8+ installed
2. Required Python packages:

   ```bash
   pytest
   requests
   python-jose
   pandas
   matplotlib
   pytest-cov
   ```

You can install these with:

```bash
pip install pytest requests python-jose pandas matplotlib pytest-cov
```

## Running the Tests

### 1. Unit Tests

These tests validate the core security components:

```bash
# Navigate to the backend directory
cd backend

# Run all security tests with coverage
python -m pytest app/tests/test_security_features.py -v --cov=app.core.security

# Run specific tests
python -m pytest app/tests/test_security_features.py::TestSecurity::test_token_creation_and_verification -v
```

### 2. Rate Limiting Tests

These tests specifically validate the rate limiting implementation:

```bash
# For development environment
python app/tests/test_rate_limiting.py --url http://localhost:8000 --requests 50 --concurrency 5

# For staging environment
python app/tests/test_rate_limiting.py --url https://staging-api.gplusapp.com --requests 50 --concurrency 5

# For production environment (use with caution)
python app/tests/test_rate_limiting.py --url https://api.gplusapp.com --requests 20 --concurrency 2 --endpoint /api/v1/health
```

### 3. Cross-Environment Tests

These tests validate security features across different environments:

```bash
# For development environment
python app/tests/cross_environment_security_tests.py --url http://localhost:8000 --verbose

# For staging environment
python app/tests/cross_environment_security_tests.py --url https://staging-api.gplusapp.com --verbose --output staging_results.csv

# For production environment (use with caution)
python app/tests/cross_environment_security_tests.py --url https://api.gplusapp.com --verbose --output production_results.csv
```

## Comparing Results Across Environments

You can use the following script to compare test results across environments:

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load results
dev_results = pd.read_csv('dev_results.csv')
staging_results = pd.read_csv('staging_results.csv')
prod_results = pd.read_csv('production_results.csv')

# Count passed/failed tests per environment
environments = ['Development', 'Staging', 'Production']
passed = [
    len(dev_results[dev_results['status'] == 'pass']),
    len(staging_results[staging_results['status'] == 'pass']),
    len(prod_results[prod_results['status'] == 'pass'])
]
failed = [
    len(dev_results[dev_results['status'] == 'fail']),
    len(staging_results[staging_results['status'] == 'fail']),
    len(prod_results[prod_results['status'] == 'fail'])
]

# Create bar chart
plt.figure(figsize=(12, 6))
width = 0.35
x = range(len(environments))
plt.bar([i - width/2 for i in x], passed, width, label='Passed')
plt.bar([i + width/2 for i in x], failed, width, label='Failed')
plt.xlabel('Environment')
plt.ylabel('Number of Tests')
plt.title('Security Test Results by Environment')
plt.xticks(x, environments)
plt.legend()
plt.savefig('security_comparison.png')
```

## Test Environments

Configure the following environments for testing:

1. **Development**: Your local development environment (`http://localhost:8000`)
2. **Staging**: Staging environment (`https://staging-api.gplusapp.com`)
3. **Production**: Production environment (`https://api.gplusapp.com`)

## Important Considerations

1. **Be careful with production testing**: Limit the number of requests and use non-destructive endpoints
2. **Test user accounts**: Make sure test accounts exist in all environments
3. **Rate limiting**: Production environments may have stricter rate limits
4. **API keys**: Some environments may require API keys or special authentication

## Test Result Analysis

When analyzing test results, pay attention to:

1. **Consistency**: Security features should behave consistently across environments
2. **Response times**: Significant variations may indicate configuration differences
3. **Rate limiting**: Should be properly configured in all environments
4. **Error messages**: Should be consistent and not reveal sensitive information

## Reporting Issues

If you find security issues during testing:

1. Document the exact steps to reproduce
2. Note which environment(s) are affected
3. Record request/response details
4. Follow the security incident response plan
5. If critical, immediately notify the security team

Remember, security testing is an ongoing process, not a one-time activity!