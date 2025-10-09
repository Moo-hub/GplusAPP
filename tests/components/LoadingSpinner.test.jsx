import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
    expect(container).toHaveClass('loading-container');
    expect(container.firstChild).toHaveClass('loading-spinner');
    expect(container.firstChild).toHaveClass('spinner-medium');
    expect(container.firstChild).toHaveClass('spinner-primary');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="small" />);
    expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner-small');
    
    render(<LoadingSpinner size="large" />);
    expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner-large');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />);
    expect(screen.getByText('Loading...').parentElement.firstChild).toHaveClass('spinner-secondary');
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
    expect(container).toHaveClass('fullscreen');
    expect(container.firstChild).toHaveClass('spinner-fullscreen');
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
    
    expect(container).toHaveClass('loading-container');
    expect(container).toHaveClass('fullscreen');
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass('spinner-large');
    expect(spinner).toHaveClass('spinner-secondary');
    expect(spinner).toHaveClass('spinner-fullscreen');
  });
});