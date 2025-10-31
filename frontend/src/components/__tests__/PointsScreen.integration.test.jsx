import React from "react";
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
    const spy = vi.spyOn(api, 'getPoints').mockResolvedValue({ data: [{ balance: 200 }] });
    customRender(<PointsScreen />);
    const items = await screen.findAllByTestId('item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toContain('200');
    spy.mockRestore();
  });

  it('handles API error gracefully', async () => {
    const spy = vi.spyOn(api, 'getPoints').mockRejectedValue(new Error('Server error'));
    customRender(<PointsScreen />);
    const errorNode = await screen.findByTestId('error');
  expect(errorNode).toBeInTheDocument();
  expect(errorNode.textContent).toMatch(/error|something went wrong|points.error|api error/i);
    spy.mockRestore();
  });

  it('handles empty points data', async () => {
    const spy = vi.spyOn(api, 'getPoints').mockResolvedValue({ data: [] });
    customRender(<PointsScreen />);
    const emptyNode = await screen.findByTestId('empty');
  expect(emptyNode).toBeInTheDocument();
  expect(emptyNode.textContent).toMatch(/no_points_found|points.empty|empty/i);
    spy.mockRestore();
  });
});

