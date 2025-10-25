import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceWorkerWrapper from '../ServiceWorkerWrapper';
import { info } from '../../utils/logger';

// Mock logger info function with correct relative path
vi.mock('../../utils/logger', () => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

describe('ServiceWorkerWrapper Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children without modifying them', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    render(<ServiceWorkerWrapper>{testContent}</ServiceWorkerWrapper>);
    const content = screen.getByTestId('test-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Test Content');
  });

  it('calls logger.info when mounted', () => {
    render(
      <ServiceWorkerWrapper>
        <div>Child Content</div>
      </ServiceWorkerWrapper>
    );
    expect(info).toHaveBeenCalledWith('ServiceWorkerWrapper mounted');
  });

  it('renders multiple children correctly', () => {
    const testContent = (
      <>
        <div data-testid="child1">First Child</div>
        <div data-testid="child2">Second Child</div>
      </>
    );
    render(<ServiceWorkerWrapper>{testContent}</ServiceWorkerWrapper>);
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});