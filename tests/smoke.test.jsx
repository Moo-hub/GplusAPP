import React from 'react';
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

it('smoke renders', () => {
  const el = <div>hello</div>;
  render(el);
  expect(screen.getByText(/hello/i)).toBeInTheDocument();
});
