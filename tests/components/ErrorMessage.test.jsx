import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from '../components/common/ErrorMessage';

describe('ErrorMessage Component', () => {
  it('renders with default message when no message provided', () => {
    render(<ErrorMessage />);
    
    expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Failed to load data';
    render(<ErrorMessage message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error message" />);
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorMessage message="Error message" onRetry={() => {}} />);
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry function when retry button is clicked', async () => {
    const handleRetry = vi.fn();
    render(<ErrorMessage message="Error message" onRetry={handleRetry} />);
    
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});