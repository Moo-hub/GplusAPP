import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
  expect(container.firstChild.classList.contains('btn-danger')).toBe(true);
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Button size="large">Large</Button>);
  expect(container.firstChild.classList.contains('btn-large')).toBe(true);
  });

  it('applies fullWidth class when specified', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
  expect(container.firstChild.classList.contains('btn-block')).toBe(true);
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    
  const buttons = screen.getAllByTestId('button');
  const clickableButton = buttons.find(btn => btn.textContent.includes('Clickable'));
  await userEvent.click(clickableButton);
  expect(handleClick).toHaveBeenCalledTimes(1);
  });
});