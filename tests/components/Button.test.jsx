import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../components/Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click Me');
    expect(button).toHaveClass('btn btn-primary btn-medium');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-secondary');
    
    render(<Button variant="danger">Danger Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-danger');
  });

  it('applies size classes correctly', () => {
    render(<Button size="small">Small Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-small');
    
    render(<Button size="large">Large Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-large');
  });

  it('applies fullWidth class when prop is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-block');
  });

  it('sets the button type correctly', () => {
    render(<Button type="submit">Submit Button</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('type', 'submit');
    
    render(<Button type="reset">Reset Button</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('type', 'reset');
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('adds aria-label attribute when provided', () => {
    render(<Button ariaLabel="Close dialog">X</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('applies additional className when provided', () => {
    render(<Button className="custom-class">Custom Class Button</Button>);
    expect(screen.getByTestId('button')).toHaveClass('custom-class');
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    await userEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    await userEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});