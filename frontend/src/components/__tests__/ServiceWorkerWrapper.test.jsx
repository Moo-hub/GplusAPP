import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServiceWorkerWrapper Component', () => {
  // Spy on console.log to verify it's called
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // Clean up mocks after tests
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children without modifying them', () => {
    // Arrange
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    // Act
    render(<ServiceWorkerWrapper>{testContent}</ServiceWorkerWrapper>);
    
    // Assert
    const content = screen.getByTestId('test-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Test Content');
  });

  it('logs to console when mounted', () => {
    // Act
    render(
      <ServiceWorkerWrapper>
        <div>Child Content</div>
      </ServiceWorkerWrapper>
    );
    
    // Assert
    expect(console.log).toHaveBeenCalledWith('ServiceWorkerWrapper mounted');
  });

  it('renders multiple children correctly', () => {
    // Arrange
    const testContent = (
      <>
        <div data-testid="child1">First Child</div>
        <div data-testid="child2">Second Child</div>
      </>
    );
    
    // Act
    render(<ServiceWorkerWrapper>{testContent}</ServiceWorkerWrapper>);
    
    // Assert
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});