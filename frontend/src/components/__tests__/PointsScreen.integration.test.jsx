import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import * as api from '../../services/api';
import { customRender } from '../../test-utils';
import PointsScreen from '../screens/PointsScreen';

// Test-time diagnostics: print which axios module and adapter are active
beforeAll(async () => {
  try {
    const axiosMod = require('axios');
    const axios = (axiosMod && axiosMod.default) ? axiosMod.default : axiosMod;
  // diagnostic log suppressed
    try {
      let adapterName = 'none';
      try {
        // avoid deep TS type checks by accessing as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = /** @type {any} */ (axios);
        if (a && a.defaults && a.defaults.adapter) adapterName = a.defaults.adapter.name || 'custom';
      } catch (inner) {
        // ignore
      }
  // diagnostic log suppressed
    } catch (e) {
  // diagnostic log suppressed
    }
  } catch (e) {
    console.warn('[TEST DIAG] could not resolve axios info');
  }

  try {
    // Wait for the MSW server proxy to be ready so server.use() applies correctly
    if (server && server.ready) {
      // eslint-disable-next-line no-console
  // diagnostic log suppressed
      await server.ready;
      // eslint-disable-next-line no-console
  // diagnostic log suppressed
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[TEST DIAG] server.ready check failed', e && e.message ? e.message : e);
  }
});

describe('PointsScreen Integration', () => {
  it('fetches and displays points balance', async () => {
    customRender(<PointsScreen />);
    expect(await screen.findByText(/200/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Directly spy on the service method to simulate a server error.
    const spy = vi.spyOn(api, 'getPoints').mockRejectedValue(new Error('Server error'));
    try {
      customRender(<PointsScreen />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    } finally {
      spy.mockRestore();
    }
  });
});

