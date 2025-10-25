import { render, screen } from '@testing-library/react';

test('sanity jsx transform', () => {
  render(<div>sanity</div>);
  expect(screen.getByText(/sanity/i)).toBeInTheDocument();
});
