"""
Master security test suite for GPlus Recycling App
This script runs all security-related tests in a coordinated sequence
"""

import subprocess
import os
import sys
import time
import argparse

def print_header(title):
    """Print a formatted header for test sections"""
    print("\n" + "=" * 100)
    print(f" {title} ".center(100, "="))
    print("=" * 100)

def run_test_script(script_name, description):
    """Run a test script and return success status"""
    print_header(f"Running {description}")
    
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    if not os.path.exists(script_path):
        print(f"❌ Test script not found: {script_path}")
        return False
    
    print(f"Executing: {script_path}")
    result = subprocess.run([sys.executable, script_path], capture_output=False)
    
    if result.returncode == 0:
        print(f"\n✅ {description} completed successfully")
        return True
    else:
        print(f"\n❌ {description} failed with exit code {result.returncode}")
        return False

def check_app_running():
    """Check if the application is running"""
    import requests
    try:
        response = requests.get("http://localhost:8000/api/v1/health")
        if response.status_code == 200:
            print("✅ Application is running")
            return True
    except requests.RequestException:
        print("❌ Application does not appear to be running")
        print("Please start the application with 'uvicorn app.main:app --reload' before running tests")
        return False

def check_redis_running():
    """Check if Redis is running"""
    try:
        import redis
        client = redis.Redis(host='localhost', port=6379, db=0)
        if client.ping():
            print("✅ Redis is running")
            return True
    except:
        print("❌ Redis does not appear to be running")
        print("Please start Redis before running tests")
        return False

def run_security_tests(include_prerequisites=True):
    """Run all security tests in sequence"""
    print_header("GPlus Security Test Suite")
    
    # Check prerequisites if requested
    if include_prerequisites:
        if not check_app_running() or not check_redis_running():
            print("❌ Prerequisites check failed - please address issues and retry")
            return False
    
    # Define test scripts to run
    test_scripts = [
        ("test_security_monitoring.py", "Security Monitoring Tests"),
        ("test_auth_security.py", "Authentication Security Tests"),
        ("test_role_based_security.py", "Role-Based Security Tests")
    ]
    
    # Track results
    results = {}
    
    # Run each test script
    for script_name, description in test_scripts:
        results[description] = run_test_script(script_name, description)
        # Brief pause between test runs
        time.sleep(1)
    
    # Print summary
    print_header("Security Test Summary")
    all_passed = True
    for description, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {description}")
        all_passed = all_passed and result
    
    if all_passed:
        print("\n✅ All security tests passed successfully")
    else:
        print("\n❌ Some security tests failed - see details above")
    
    return all_passed

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run GPlus security test suite")
    parser.add_argument("--skip-prereq", action="store_true", help="Skip prerequisites check")
    args = parser.parse_args()
    
    success = run_security_tests(not args.skip_prereq)
    sys.exit(0 if success else 1)