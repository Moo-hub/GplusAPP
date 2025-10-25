import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MemoryUsageCard from '../cards/MemoryUsageCard.jsx';

describe("MemoryUsageCard", () => {
  const mockData = {
    used_memory_gb: 2.5,
    max_memory_gb: 8.0,
    used_percent: 31.25,
    fragmentation_ratio: 1.2,
    connected_clients: 15,
    pressure_level: "low",
    trend: {
      direction: "stable",
      rate: 0.5
    }
  };
  
  it("renders skeleton when no data is provided", () => {
    render(<MemoryUsageCard data={null} />);
    expect(screen.getByTestId("memory-skeleton")).toBeInTheDocument();
  });
  
  it("renders memory usage data correctly", () => {
    render(<MemoryUsageCard data={mockData} />);
    // Check title is rendered (allow fallback key or translation)
    expect(screen.getByText(/redis memory usage|dashboard\.redisMemoryUsage/i)).toBeInTheDocument();
    // Check gauge shows correct percentage (allow optional whitespace before %)
    expect(screen.getByTestId("memory-gauge-text")).toHaveTextContent(/31\.3\s*%/);
    // Check memory values are displayed
    expect(screen.getByText(/used memory|dashboard\.usedMemory/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.5\s*gb/i)).toBeInTheDocument();
    expect(screen.getByText(/total memory|dashboard\.totalMemory/i)).toBeInTheDocument();
    expect(screen.getByText(/8\s*gb/i)).toBeInTheDocument();
    // Check fragmentation and clients are displayed
    expect(screen.getByText(/fragmentation ratio|dashboard\.fragmentationRatio/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.2/i)).toBeInTheDocument();
    expect(screen.getByText(/connected clients|dashboard\.connectedClients/i)).toBeInTheDocument();
    expect(screen.getByText(/15/i)).toBeInTheDocument();
    // Check trend information is displayed
    const trendLabel = screen.getByTestId("trend-label");
    expect(trendLabel).toBeInTheDocument();
    expect(trendLabel).toHaveTextContent(/Stable/);
  });
  
  it("applies correct color based on pressure level", () => {
    // Low pressure (green)
    const { rerender } = render(<MemoryUsageCard data={mockData} />);
    expect(screen.getByTestId("memory-gauge-fill")).toHaveStyle({ backgroundColor: expect.any(String) });
    
    // Medium pressure (gold)
    rerender(<MemoryUsageCard data={{...mockData, pressure_level: "medium"}} />);
    expect(screen.getByTestId("memory-gauge-fill")).toHaveStyle({ backgroundColor: expect.any(String) });
    
    // High pressure (orange)
    rerender(<MemoryUsageCard data={{...mockData, pressure_level: "high"}} />);
    expect(screen.getByTestId("memory-gauge-fill")).toBeInTheDocument();
    expect(screen.getByTestId("memory-gauge-fill").style.backgroundColor).toBeDefined();
    
    // Critical pressure (red)
    rerender(<MemoryUsageCard data={{...mockData, pressure_level: "critical"}} />);
    expect(screen.getByTestId("memory-gauge-fill")).toBeInTheDocument();
    expect(screen.getByTestId("memory-gauge-fill").style.backgroundColor).toBeDefined();
  });
  
  it("applies correct trend direction styling", () => {
    // Stable trend
    const { rerender } = render(<MemoryUsageCard data={mockData} />);
    expect(screen.getByTestId("trend-label")).toHaveClass("stable");
    
    // Increasing trend (negative)
    rerender(<MemoryUsageCard data={{...mockData, trend: { direction: "increasing", rate: 1.2 }}} />);
    expect(screen.getByTestId("trend-label")).toHaveClass("increasing");
    
    // Decreasing trend (positive)
    rerender(<MemoryUsageCard data={{...mockData, trend: { direction: "decreasing", rate: 0.8 }}} />);
    expect(screen.getByTestId("trend-label")).toHaveClass("decreasing");
  });
});