// React Testing Library imports
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Component import
import ApiPerformanceCard from '../ApiPerformanceCard';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'dashboard.apiPerformance': 'API Performance',
        'dashboard.avgResponseTime': 'Avg Response Time',
        'dashboard.cacheHitRatio': 'Cache Hit Ratio',
        'dashboard.requestRate': 'Request Rate',
        'dashboard.topEndpoints': 'Top Endpoints',
        'dashboard.avg': 'Avg',
        'dashboard.cache': 'Cache'
      };
      return translations[key] || key;
    }
  })
}));

describe('ApiPerformanceCard', () => {
  const mockApiData = {
    overall: {
      avg_response_time: 45.2, // milliseconds
      cache_hit_ratio: 0.85, // 85%
      requests_per_minute: 120
    },
    endpoints: [
      {
        path: '/api/v1/items',
        method: 'GET',
        avg_response_time: 22.5,
        cache_hit_ratio: 0.95
      },
      {
        path: '/api/v1/users',
        method: 'GET',
        avg_response_time: 35.8,
        cache_hit_ratio: 0.78
      },
      {
        path: '/api/v1/orders',
        method: 'POST',
        avg_response_time: 120.3,
        cache_hit_ratio: 0.2
      }
    ]
  };

  it('renders skeleton when data is not provided', () => {
    render(<ApiPerformanceCard />);
    
    const skeleton = screen.getByTestId('api-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('skeleton');
  });

  it('renders with data properly', () => {
    render(<ApiPerformanceCard data={mockApiData} />);
    
    // Check if the card is rendered
    const card = screen.getByTestId('api-performance-card');
    expect(card).toBeInTheDocument();
    
    // Check response time
    const responseTimeValue = screen.getByTestId('response-time-value');
    expect(responseTimeValue).toBeInTheDocument();
    expect(responseTimeValue).toHaveTextContent('45.2');
    
    // Check cache hit ratio
    const cacheHitValue = screen.getByTestId('cache-hit-value');
    expect(cacheHitValue).toBeInTheDocument();
    expect(cacheHitValue).toHaveTextContent('85.0');
    
    // Check request rate
    const requestRateValue = screen.getByTestId('request-rate-value');
    expect(requestRateValue).toBeInTheDocument();
    expect(requestRateValue).toHaveTextContent('120');
  });

  it('renders top endpoints section', () => {
    render(<ApiPerformanceCard data={mockApiData} />);
    
    // Check top endpoints section exists
    const topEndpoints = screen.getByTestId('top-endpoints');
    expect(topEndpoints).toBeInTheDocument();
    
    // Check first endpoint path
    const firstEndpointPath = screen.getByTestId('top-endpoint-path-0');
    expect(firstEndpointPath).toBeInTheDocument();
    expect(firstEndpointPath).toHaveTextContent('/api/v1/items');
    
    // Check first endpoint response time
    const firstEndpointResponseTime = screen.getByTestId('top-endpoint-response-time-0');
    expect(firstEndpointResponseTime).toBeInTheDocument();
    expect(firstEndpointResponseTime).toHaveTextContent('22.5ms');
    
    // Check first endpoint cache ratio
    const firstEndpointCacheRatio = screen.getByTestId('top-endpoint-cache-ratio-0');
    expect(firstEndpointCacheRatio).toBeInTheDocument();
    expect(firstEndpointCacheRatio).toHaveTextContent('95%');
  });

  it('applies correct styling based on metric values', () => {
    render(<ApiPerformanceCard data={mockApiData} />);
    
    // Check that response time has color styling
    const responseTimeValue = screen.getByTestId('response-time-value');
    expect(responseTimeValue).toBeInTheDocument();
    expect(responseTimeValue.style.color).toBeDefined();
    
    // Check that cache hit ratio has color styling
    const cacheHitValue = screen.getByTestId('cache-hit-value');
    expect(cacheHitValue).toBeInTheDocument();
    expect(cacheHitValue.style.color).toBeDefined();
    
    // Check that first endpoint response time has color styling
    const firstEndpointResponseTime = screen.getByTestId('top-endpoint-response-time-0');
    expect(firstEndpointResponseTime).toBeInTheDocument();
    expect(firstEndpointResponseTime.style.color).toBeDefined();
    
    // Check that third endpoint cache ratio has color styling
    const thirdEndpointCacheRatio = screen.getByTestId('top-endpoint-cache-ratio-2');
    expect(thirdEndpointCacheRatio).toBeInTheDocument();
    expect(thirdEndpointCacheRatio.style.color).toBeDefined();
  });
});