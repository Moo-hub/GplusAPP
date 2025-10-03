import requests
import time
import json
import sys
import argparse
from concurrent.futures import ThreadPoolExecutor
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def test_rate_limiting(base_url, endpoint, requests_count=100, concurrency=10, auth_token=None):
    """
    Test rate limiting by sending multiple requests to an endpoint
    and analyzing the response patterns.
    
    Args:
        base_url: Base URL of the API
        endpoint: API endpoint to test
        requests_count: Number of requests to send
        concurrency: Number of concurrent requests
        auth_token: Authentication token (if needed)
    
    Returns:
        DataFrame with response data
    """
    url = f"{base_url}{endpoint}"
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    results = []
    start_time = time.time()
    
    def make_request(i):
        req_start = time.time()
        try:
            response = requests.get(url, headers=headers, timeout=10)
            status_code = response.status_code
            response_time = time.time() - req_start
            
            try:
                # Try to parse error message if available
                error_msg = ""
                if status_code >= 400:
                    error_data = response.json()
                    if "detail" in error_data:
                        if isinstance(error_data["detail"], dict) and "code" in error_data["detail"]:
                            error_msg = error_data["detail"]["code"]
                        else:
                            error_msg = str(error_data["detail"])
            except:
                error_msg = ""
                
            return {
                "request_id": i,
                "timestamp": time.time() - start_time,
                "status_code": status_code,
                "response_time": response_time,
                "error": error_msg
            }
        except Exception as e:
            return {
                "request_id": i,
                "timestamp": time.time() - start_time,
                "status_code": 0,
                "response_time": time.time() - req_start,
                "error": str(e)
            }
    
    # Use ThreadPoolExecutor to send concurrent requests
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        results = list(executor.map(make_request, range(requests_count)))
    
    # Convert to DataFrame for analysis
    df = pd.DataFrame(results)
    
    # Sort by timestamp
    df = df.sort_values("timestamp")
    
    return df

def analyze_results(df):
    """Analyze and display rate limiting test results"""
    total_time = df["timestamp"].max()
    success_rate = len(df[df["status_code"] == 200]) / len(df) * 100
    rate_limited = len(df[df["status_code"] == 429])
    
    print(f"Test completed in {total_time:.2f} seconds")
    print(f"Success rate: {success_rate:.1f}%")
    print(f"Rate limited requests: {rate_limited} ({rate_limited/len(df)*100:.1f}%)")
    
    # Status code distribution
    print("\nStatus Code Distribution:")
    status_counts = df["status_code"].value_counts().sort_index()
    for status, count in status_counts.items():
        print(f"  {status}: {count} ({count/len(df)*100:.1f}%)")
    
    # Plot results
    plt.figure(figsize=(12, 8))
    
    # Plot status codes over time
    plt.subplot(2, 1, 1)
    plt.scatter(df["timestamp"], df["status_code"], alpha=0.6)
    plt.title("Response Status Codes Over Time")
    plt.xlabel("Time (seconds)")
    plt.ylabel("Status Code")
    plt.grid(True)
    
    # Plot response times
    plt.subplot(2, 1, 2)
    plt.plot(df["timestamp"], df["response_time"], 'o-', alpha=0.5)
    plt.title("Response Times")
    plt.xlabel("Time (seconds)")
    plt.ylabel("Response Time (seconds)")
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig("rate_limit_test_results.png")
    print("Results saved to rate_limit_test_results.png")
    
    return df

def main():
    parser = argparse.ArgumentParser(description="Test API rate limiting")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of the API")
    parser.add_argument("--endpoint", default="/api/v1/auth/login", help="Endpoint to test")
    parser.add_argument("--requests", type=int, default=100, help="Number of requests to send")
    parser.add_argument("--concurrency", type=int, default=10, help="Number of concurrent requests")
    parser.add_argument("--token", help="Bearer token for authentication")
    parser.add_argument("--output", default="rate_limit_results.csv", help="Output CSV file for results")
    
    args = parser.parse_args()
    
    print(f"Testing rate limiting on {args.url}{args.endpoint}")
    print(f"Sending {args.requests} requests with concurrency {args.concurrency}")
    
    df = test_rate_limiting(
        args.url, 
        args.endpoint, 
        args.requests, 
        args.concurrency,
        args.token
    )
    
    # Save results
    df.to_csv(args.output, index=False)
    print(f"Raw results saved to {args.output}")
    
    # Analyze results
    analyze_results(df)

if __name__ == "__main__":
    main()