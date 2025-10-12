import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ViewportIndicator from '../dev/ViewportIndicator';

// Mock environment variables
vi.mock('@vitejs/plugin-react', async () => {
  const actual = await vi.importActual('@vitejs/plugin-react');
  return {
    ...actual,
    env: {
      NODE_ENV: 'development'
    }
  };
});

describe('ViewportIndicator Component', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  it('renders in development mode', () => {
    // Force development environment
    process.env.NODE_ENV = 'development';
    
    render(<ViewportIndicator />);
    
    // Check that viewport indicator is rendered
    expect(screen.getByText('XS')).toBeInTheDocument();
  });
  
  it('does not render in production mode', () => {
    // Force production environment
    process.env.NODE_ENV = 'production';
    
    const { container } = render(<ViewportIndicator />);
    
    // Check that the component returns null
    expect(container.firstChild).toBeNull();
  });
  
  it('renders the component with all breakpoint indicators', () => {
    // Force development environment
    process.env.NODE_ENV = 'development';
    
    render(<ViewportIndicator />);
    
    // Check that all breakpoint indicators are present in the DOM
    expect(screen.getByText('XS')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('LG')).toBeInTheDocument();
    expect(screen.getByText('XL')).toBeInTheDocument();
    expect(screen.getByText('2XL')).toBeInTheDocument();
  });
});