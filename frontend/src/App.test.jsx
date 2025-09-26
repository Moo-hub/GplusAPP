import { render, screen } from '@testing-library/react';

test('renders main app component', () => {
  render(<App />);
  expect(screen.getByText(/GPlus/i)).toBeInTheDocument();
});

