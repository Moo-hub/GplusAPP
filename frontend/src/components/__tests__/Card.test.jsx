import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    expect(container.firstChild).toHaveClass('card-dark');
  });

  it('applies hoverable class when specified', () => {
    const { container } = render(<Card hoverable>Content</Card>);
    expect(container.firstChild).toHaveClass('card-hoverable');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    
    await userEvent.click(screen.getByTestId('card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});