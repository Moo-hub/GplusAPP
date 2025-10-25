// React Testing Library imports
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';


import SystemHealthCard from '../SystemHealthCard'; // path is correct, no change needed


import { setupI18nMock } from '../../../test-utils.js';
setupI18nMock();

describe('SystemHealthCard', () => {
  const mockHealthData = {
    services: {
      redis: {
        status: 'healthy',
        latency: 1.2,
        connections: 45
      },
      api: {
        status: 'healthy',
        latency: 3.5
      },
      db: {
        status: 'degraded',
        latency: 125.8,
        connections: 120
      },
      cache: {
        status: 'unavailable'
      }
    }
  };

  it('renders skeleton when data is not provided', () => {
  render(<SystemHealthCard data={undefined} />);
    
    const skeleton = screen.getByTestId('system-health-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('skeleton');
  });

  it('renders with data properly', () => {
    render(<SystemHealthCard data={mockHealthData} />);
    
    // Check if the card is rendered
    const card = screen.getByTestId('system-health-card');
    expect(card).toBeInTheDocument();
    
    // Check if services grid is rendered
    const servicesGrid = screen.getByTestId('services-grid');
    expect(servicesGrid).toBeInTheDocument();
    
    // Check if all services are rendered
    const redisService = screen.getByTestId('service-redis');
    expect(redisService).toBeInTheDocument();
    
    const apiService = screen.getByTestId('service-api');
    expect(apiService).toBeInTheDocument();
    
    const dbService = screen.getByTestId('service-db');
    expect(dbService).toBeInTheDocument();
    
    const cacheService = screen.getByTestId('service-cache');
    expect(cacheService).toBeInTheDocument();
  });

  it('displays correct status indicators', () => {
    render(<SystemHealthCard data={mockHealthData} />);
    
    // Check Redis status (healthy)
    const redisStatus = screen.getByTestId('status-indicator-redis');
    expect(redisStatus).toBeInTheDocument();
    expect(redisStatus).toHaveClass('status-healthy');
    
    // Check DB status (degraded)
    const dbStatus = screen.getByTestId('status-indicator-db');
    expect(dbStatus).toBeInTheDocument();
    expect(dbStatus).toHaveClass('status-degraded');
    
    // Check Cache status (unavailable)
    const cacheStatus = screen.getByTestId('status-indicator-cache');
    expect(cacheStatus).toBeInTheDocument();
    expect(cacheStatus).toHaveClass('status-unavailable');
  });

  it('displays service metrics correctly', () => {
    render(<SystemHealthCard data={mockHealthData} />);
    
    // Check Redis latency
    const redisLatency = screen.getByTestId('service-latency-redis');
    expect(redisLatency).toBeInTheDocument();
    expect(redisLatency).toHaveTextContent('1.2 ms');
    
    // Check Redis connections
    const redisConnections = screen.getByTestId('service-connections-redis');
    expect(redisConnections).toBeInTheDocument();
    expect(redisConnections).toHaveTextContent('45');
    
    // Check DB latency
    const dbLatency = screen.getByTestId('service-latency-db');
    expect(dbLatency).toBeInTheDocument();
    expect(dbLatency).toHaveTextContent('125.8 ms');
    
    // Cache service should not have latency or connections
    expect(screen.queryByTestId('service-latency-cache')).not.toBeInTheDocument();
    expect(screen.queryByTestId('service-connections-cache')).not.toBeInTheDocument();
  });

  it('displays service status text correctly', () => {
    render(<SystemHealthCard data={mockHealthData} />);
    
    // Check Redis status text
    const redisStatusText = screen.getByTestId('service-status-redis');
    expect(redisStatusText).toBeInTheDocument();
    expect(redisStatusText).toHaveTextContent('Healthy');
    
    // Check DB status text
    const dbStatusText = screen.getByTestId('service-status-db');
    expect(dbStatusText).toBeInTheDocument();
    expect(dbStatusText).toHaveTextContent('Degraded');
    
    // Check Cache status text
    const cacheStatusText = screen.getByTestId('service-status-cache');
    expect(cacheStatusText).toBeInTheDocument();
    expect(cacheStatusText).toHaveTextContent('Unavailable');
  });
});