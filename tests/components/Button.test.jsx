import React from 'react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../frontend/src/components/Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    
  const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click Me');
    expect(button).toHaveClass('btn btn-primary btn-medium');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { container: c1 } = render(<Button variant="secondary">Secondary Button</Button>);
  expect(within(c1).getByRole('button')).toHaveClass('btn-secondary');

    const { container: c2 } = render(<Button variant="danger">Danger Button</Button>);
  expect(within(c2).getByRole('button')).toHaveClass('btn-danger');
  });

  it('applies size classes correctly', () => {
    const { container: c1 } = render(<Button size="small">Small Button</Button>);
  expect(within(c1).getByRole('button')).toHaveClass('btn-small');

    const { container: c2 } = render(<Button size="large">Large Button</Button>);
  expect(within(c2).getByRole('button')).toHaveClass('btn-large');
  });

  it('applies fullWidth class when prop is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);
  expect(screen.getByRole('button')).toHaveClass('btn-block');
  });

  it('sets the button type correctly', () => {
    const { container: c1 } = render(<Button type="submit">Submit Button</Button>);
  expect(within(c1).getByRole('button')).toHaveAttribute('type', 'submit');

    const { container: c2 } = render(<Button type="reset">Reset Button</Button>);
  expect(within(c2).getByRole('button')).toHaveAttribute('type', 'reset');
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
  });

  it('adds aria-label attribute when provided', () => {
    render(<Button ariaLabel="Close dialog">X</Button>);
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('applies additional className when provided', () => {
    render(<Button className="custom-class">Custom Class Button</Button>);
  expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
  await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
  await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});