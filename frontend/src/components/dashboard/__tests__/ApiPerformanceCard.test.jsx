import React from 'react';
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ApiPerformanceCard from "../cards/ApiPerformanceCard";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key })
}));

describe("ApiPerformanceCard", () => {
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
    
    // Check title is rendered
    expect(screen.getByText("dashboard.apiPerformance")).toBeInTheDocument();
    
    // Check overall stats are displayed using test IDs
    const responseTimeValue = screen.getByTestId("response-time-value");
    expect(responseTimeValue).toHaveTextContent("45.3");
    
    const cacheHitValue = screen.getByTestId("cache-hit-value");
    expect(cacheHitValue).toHaveTextContent("78.0");
    
    const requestRateValue = screen.getByTestId("request-rate-value");
    expect(requestRateValue).toHaveTextContent("120");
    
    // Check top endpoints are displayed
    expect(screen.getByText("/api/v1/companies")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/pickups")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/points")).toBeInTheDocument();
  });
  
  it("applies correct color coding to performance metrics", () => {
    render(<ApiPerformanceCard data={mockData} />);
    
    // Check that colors are applied (not testing specific color values)
    const responseTimeValue = screen.getByTestId("response-time-value");
    expect(responseTimeValue).toBeInTheDocument();
    expect(responseTimeValue.style.color).toBeDefined();
    
    const cacheHitValue = screen.getByTestId("cache-hit-value");
    expect(cacheHitValue).toBeInTheDocument();
    expect(cacheHitValue.style.color).toBeDefined();
    
    // Check endpoint response times have colors
    const firstEndpointResponseTime = screen.getByTestId("top-endpoint-response-time-0");
    expect(firstEndpointResponseTime).toBeInTheDocument();
    expect(firstEndpointResponseTime.style.color).toBeDefined();
    
    // Check endpoint cache ratios have colors
    const firstEndpointCacheRatio = screen.getByTestId("top-endpoint-cache-ratio-0");
    expect(firstEndpointCacheRatio).toBeInTheDocument();
    expect(firstEndpointCacheRatio.style.color).toBeDefined();
  });
});