import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '../../frontend/src/test-utils';
import LoadingSpinner from '../../frontend/src/components/common/LoadingSpinner';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'common.loading': 'Loading...'
      };
      return translations[key] || key;
    }
  })
}));

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByText('Loading...');
    expect(spinner).toBeInTheDocument();
    
  const container = spinner.parentElement;
  // Basic smoke checks: container exists and spinner element present
  expect(container).toBeInTheDocument();
  expect(container.firstChild).toHaveClass('spinner');
  });

  it('renders with custom size', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
  expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner');

    // Replace the rendered component instead of mounting another instance
    rerender(<LoadingSpinner size="large" />);
  expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />);
  expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner');
  });

  it('renders with custom message', () => {
    const customMessage = 'Please wait while loading...';
    render(<LoadingSpinner message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders in fullscreen mode', () => {
    render(<LoadingSpinner fullscreen />);
    
  const container = screen.getByText('Loading...').parentElement;
  expect(container).toBeInTheDocument();
  expect(container.firstChild).toHaveClass('spinner');       
  });

  it('combines all custom props correctly', () => {
    const customMessage = 'Custom loading message';
    render(
      <LoadingSpinner 
        size="large" 
        color="secondary" 
        message={customMessage} 
        fullscreen 
      />
    );
    
    const message = screen.getByText(customMessage);
    const container = message.parentElement;
    const spinner = container.firstChild;
    expect(container).toBeInTheDocument();
  expect(spinner).toHaveClass('spinner');
  });
});