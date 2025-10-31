import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App, { AppContent } from './App';

test('renders main app component', () => {
  // Render the lightweight AppContent inside a MemoryRouter so components
  // that use react-router hooks (NavLink, Routes) don't throw when the
  // router context is not present. This keeps the test focused and stable.
  render(
    <MemoryRouter>
      <AppContent />
    </MemoryRouter>
  );
  // Accept either the translated app title, the i18n key, or the raw fallback
  expect(screen.getByRole('heading', { name: /G\+ App|app\.title|title/i })).toBeInTheDocument();
});

