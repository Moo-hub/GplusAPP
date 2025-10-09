import { screen, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { customRender } from '../../test-utils';

describe('CompaniesScreen Integration', () => {
  it('fetches and displays companies from API', async () => {
    customRender(<CompaniesScreen />);
    expect(await screen.findByText(/EcoCorp/i)).toBeInTheDocument();
    expect(await screen.findByText(/GreenTech/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    server.use(
      http.get('/api/companies', () => HttpResponse.json(null, { status: 500 }))
    );
    customRender(<CompaniesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

