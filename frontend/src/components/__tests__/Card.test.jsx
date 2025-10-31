import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="Test Title">Content</Card>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('applies dark variant class when specified', () => {
    const { container } = render(<Card variant="dark">Content</Card>);
  expect(container.firstChild.classList.contains('card-dark')).toBe(true);
  });

  it('applies hoverable class when specified', () => {
    const { container } = render(<Card hoverable>Content</Card>);
  expect(container.firstChild.classList.contains('card-hoverable')).toBe(true);
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    
  const cards = screen.getAllByTestId('card');
  const clickableCard = cards.find(card => card.textContent.includes('Clickable'));
  await userEvent.click(clickableCard);
  expect(handleClick).toHaveBeenCalledTimes(1);
  });
});