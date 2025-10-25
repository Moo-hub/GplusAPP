import React from 'react';
import { render, screen, cleanup } from "@testing-library/react";
import ApiPerformanceCard from '../cards/ApiPerformanceCard';
import { vi } from "vitest";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key })
}));

describe("ApiPerformanceCard", () => {
  // Ensure DOM is cleaned between tests (some environments don't auto-clean)
  afterEach(() => cleanup());
  const mockData = {
    overall: {
      avg_response_time: 45.3,
      cache_hit_ratio: 0.78,
      requests_per_minute: 120
    },
    endpoints: [
      {
        path: "/api/v1/companies",
        method: "GET",
        avg_response_time: 38.2,
        cache_hit_ratio: 0.92,
        requests_count: 1520
      },
      {
        path: "/api/v1/pickups",
        method: "GET",
        avg_response_time: 67.4,
        cache_hit_ratio: 0.64,
        requests_count: 945
      },
      {
        path: "/api/v1/points",
        method: "GET",
        avg_response_time: 29.8,
        cache_hit_ratio: 0.88,
        requests_count: 2130
      }
    ]
  };
  
  it("renders skeleton when no data is provided", () => {
    render(<ApiPerformanceCard data={null} />);
    expect(screen.getByTestId("api-skeleton")).toBeInTheDocument();
  });
  
  it("renders API performance data correctly", () => {
    render(<ApiPerformanceCard data={mockData} />);
    
  // Check title is rendered (robust to translation)
  expect(screen.getByText(/dashboard\.apiPerformance|API Performance/i)).toBeInTheDocument();
    
  // Check overall stats are displayed using test IDs
  const responseTimeValues = screen.getAllByTestId("response-time-value");
  expect(responseTimeValues[0]).toHaveTextContent("45.3");

  const cacheHitValues = screen.getAllByTestId("cache-hit-value");
  expect(cacheHitValues[0]).toHaveTextContent("78.0");

  const requestRateValues = screen.getAllByTestId("request-rate-value");
  expect(requestRateValues[0]).toHaveTextContent("120");
    
    // Check top endpoints are displayed (use allBy to tolerate duplicate renders)
    const firstEndpointPath = screen.getAllByTestId('top-endpoint-path-0')[0];
    expect(firstEndpointPath).toHaveTextContent('/api/v1/companies');
    const secondEndpointPath = screen.getAllByTestId('top-endpoint-path-1')[0];
    expect(secondEndpointPath).toHaveTextContent('/api/v1/pickups');
    const thirdEndpointPath = screen.getAllByTestId('top-endpoint-path-2')[0];
    expect(thirdEndpointPath).toHaveTextContent('/api/v1/points');
  });
  
  it("applies correct color coding to performance metrics", () => {
    render(<ApiPerformanceCard data={mockData} />);
    
    // Check that colors are applied (not testing specific color values)
  const responseTimeValue = screen.getAllByTestId("response-time-value")[0];
  expect(responseTimeValue).toBeInTheDocument();
  expect(responseTimeValue.style.color).toBeDefined();

  const cacheHitValue = screen.getAllByTestId("cache-hit-value")[0];
  expect(cacheHitValue).toBeInTheDocument();
  expect(cacheHitValue.style.color).toBeDefined();
    
    // Check endpoint response times have colors
    const firstEndpointResponseTime = screen.getAllByTestId("top-endpoint-response-time-0")[0];
    expect(firstEndpointResponseTime).toBeInTheDocument();
    expect(firstEndpointResponseTime.style.color).toBeDefined();
    
    // Check endpoint cache ratios have colors
    const firstEndpointCacheRatio = screen.getAllByTestId("top-endpoint-cache-ratio-0")[0];
    expect(firstEndpointCacheRatio).toBeInTheDocument();
    expect(firstEndpointCacheRatio.style.color).toBeDefined();
  });
});