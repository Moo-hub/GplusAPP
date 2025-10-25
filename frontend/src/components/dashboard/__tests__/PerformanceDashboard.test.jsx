import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import PerformanceDashboard from '../PerformanceDashboard';

// Robust ESM mocking: define a stable mock object and use it everywhere
const mockMetricsApi = {
  getRedisMemoryMetrics: vi.fn(),
  getRedisKeyPatterns: vi.fn(),
  getApiPerformanceMetrics: vi.fn(),
  getSystemHealthMetrics: vi.fn(),
};
vi.mock("../../../api/metrics", () => mockMetricsApi);

// Use the mock object directly in all tests
const metricsApi = mockMetricsApi;
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key })
}));

// Mock the card components
vi.mock("../cards/MemoryUsageCard", () => ({
  default: ({ data }) => (
    <div data-testid="memory-usage-card">
      <span>Memory Usage: {data ? data.used_percent : "loading"}</span>
    </div>
  )
}));

vi.mock("../cards/ApiPerformanceCard", () => ({
  default: ({ data }) => (
    <div data-testid="api-performance-card">
      <span>API Performance: {data ? data.overall.cache_hit_ratio : "loading"}</span>
    </div>
  )
}));

vi.mock("../cards/KeyPatternCard", () => ({
  default: ({ data }) => (
    <div data-testid="key-pattern-card">
      <span>Key Patterns: {data ? Object.keys(data.patterns).length : "loading"}</span>
    </div>
  )
}));

vi.mock("../cards/SystemHealthCard", () => ({
  default: ({ data }) => (
    <div data-testid="system-health-card">
      <span>System Health: {data ? data.services.redis.status : "loading"}</span>
    </div>
  )
}));

describe("PerformanceDashboard", () => {
  // Mock data for tests
  const mockMemoryMetrics = {
    used_memory_gb: 2.5,
    max_memory_gb: 8.0,
    used_percent: 31.25,
    fragmentation_ratio: 1.2,
    connected_clients: 15,
    pressure_level: "low",
    trend: {
      direction: "stable",
      rate: 0.5
    },
    timestamp: "2025-09-28T10:00:00Z"
  };

  const mockKeyPatterns = {
    patterns: {
      "cache:*": 25.6,
      "security:event:*": 12.8,
      "token:*": 8.4,
    },
    timestamp: "2025-09-28T10:00:00Z"
  };

  const mockApiPerformance = {
    overall: {
      avg_response_time: 45.3,
      cache_hit_ratio: 0.78,
      requests_per_minute: 120
    },
    endpoints: [
      {
        path: "/api/v1/companies",
        avg_response_time: 38.2,
        cache_hit_ratio: 0.92,
        requests_count: 1520
      },
      {
        path: "/api/v1/pickups",
        avg_response_time: 67.4,
        cache_hit_ratio: 0.64,
        requests_count: 945
      }
    ],
    timestamp: "2025-09-28T10:00:00Z"
  };

  const mockSystemHealth = {
    services: {
      redis: {
        status: "healthy",
        latency: 1.2
      },
      database: {
        status: "healthy",
        connections: 8,
        latency: 3.5
      },
      api: {
        status: "healthy"
      }
    },
    timestamp: "2025-09-28T10:00:00Z"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock functions
    metricsApi.getRedisMemoryMetrics.mockReset();
    metricsApi.getRedisKeyPatterns.mockReset();
    metricsApi.getApiPerformanceMetrics.mockReset();
    metricsApi.getSystemHealthMetrics.mockReset();
  });

  it("renders loading state initially", () => {
    // Mock API functions to return promises that don't resolve yet
    metricsApi.getRedisMemoryMetrics.mockReturnValue(new Promise(() => {}));
    metricsApi.getRedisKeyPatterns.mockReturnValue(new Promise(() => {}));
    metricsApi.getApiPerformanceMetrics.mockReturnValue(new Promise(() => {}));
    metricsApi.getSystemHealthMetrics.mockReturnValue(new Promise(() => {}));

    render(<PerformanceDashboard />);
    
  expect(screen.getByText(/dashboard\.loading|loading/i)).toBeInTheDocument();
  });

  it("renders dashboard with metrics data when loaded", async () => {
    // Mock API responses
    metricsApi.getRedisMemoryMetrics.mockResolvedValue(mockMemoryMetrics);
    metricsApi.getRedisKeyPatterns.mockResolvedValue(mockKeyPatterns);
    metricsApi.getApiPerformanceMetrics.mockResolvedValue(mockApiPerformance);
    metricsApi.getSystemHealthMetrics.mockResolvedValue(mockSystemHealth);

    render(<PerformanceDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId("memory-usage-card")).toBeInTheDocument();
      expect(screen.getByTestId("api-performance-card")).toBeInTheDocument();
      expect(screen.getByTestId("key-pattern-card")).toBeInTheDocument();
      expect(screen.getByTestId("system-health-card")).toBeInTheDocument();
    });

    // Check endpoint table is rendered
  expect(screen.getByText(/dashboard\.endpointPerformance|Endpoint Performance/i)).toBeInTheDocument();
    
    // Check specific endpoint data
    expect(screen.getByText("/api/v1/companies")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/pickups")).toBeInTheDocument();
  });

  it("renders error state when API calls fail", async () => {
    // Mock API failures
    metricsApi.getRedisMemoryMetrics.mockRejectedValue(new Error("Failed to load Redis metrics"));
    metricsApi.getRedisKeyPatterns.mockRejectedValue(new Error("Failed to load key patterns"));
    metricsApi.getApiPerformanceMetrics.mockRejectedValue(new Error("Failed to load API metrics"));
    metricsApi.getSystemHealthMetrics.mockRejectedValue(new Error("Failed to load system health"));

    render(<PerformanceDashboard />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/dashboard\.error|error/i)).toBeInTheDocument();
    });
    
    // Error message should be displayed - this may vary based on the error returned
    expect(screen.getByText(/Failed to load.*metrics/i)).toBeInTheDocument();
    
    // Retry button should be present
  expect(screen.getByText(/dashboard\.tryAgain|try again/i)).toBeInTheDocument();
  });
});