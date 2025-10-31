import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, afterEach } from 'vitest';
import GenericScreen from '../GenericScreen';

beforeEach(() => {
  try { vi.unstubAllGlobals(); } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis.GenericScreen) delete globalThis.GenericScreen; } catch (e) {}
  try { if (typeof global !== 'undefined' && global.GenericScreen) delete global.GenericScreen; } catch (e) {}
});

afterEach(() => {
  try { vi.unstubAllGlobals(); } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis.GenericScreen) delete globalThis.GenericScreen; } catch (e) {}
  try { if (typeof global !== 'undefined' && global.GenericScreen) delete global.GenericScreen; } catch (e) {}
});

describe('GenericScreen Component', () => {
  it('shows loading initially', () => {
    render(<GenericScreen apiCall={() => new Promise(() => {})} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders data when API succeeds', async () => {
    const testData = { value: 'test data' };
    const apiCall = vi.fn().mockResolvedValue(testData);
    
    render(
      <GenericScreen apiCall={apiCall}>
        {(data) => <div data-testid="content">{data.value}</div>}
      </GenericScreen>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
    expect(screen.getByText('test data')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    const apiCall = vi.fn().mockImplementation(() => {
      console.log('apiCall mock: rejected');
      return Promise.reject(new Error('API Error'));
    });
    render(<GenericScreen apiCall={apiCall} errorKey="Custom Error" />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => {
      const errorNode = screen.queryByTestId('error');
      if (errorNode) console.log('errorNode:', errorNode.textContent);
      expect(errorNode).toBeInTheDocument();
    });
    expect(screen.getByTestId('error').textContent).toContain('Custom Error');
  });

  it('allows retry after error', async () => {
    const apiCall = vi.fn()
      .mockRejectedValueOnce(new Error('API Error'))
  .mockResolvedValue({ value: 'success' });
    
    render(
      <GenericScreen apiCall={apiCall}>
        {(data) => <div data-testid="content">{data.value}</div>}
      </GenericScreen>
    );

  await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
  // Click retry button by role and text
  const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i });
  await userEvent.click(retryBtn);
  await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
  expect(screen.getByText('success')).toBeInTheDocument();
  expect(apiCall).toHaveBeenCalledTimes(2);
  });

  it('shows empty state for empty array', async () => {
    const apiCall = vi.fn().mockImplementation(() => {
      console.log('apiCall mock: resolved empty array');
      return Promise.resolve([]);
    });
    render(
      <GenericScreen apiCall={apiCall} emptyKey="No Items Found">
        {(data) => <div>Should not render</div>}
      </GenericScreen>
    );
    await waitFor(() => {
      const emptyNode = screen.queryByTestId('empty');
      if (emptyNode) console.log('emptyNode:', emptyNode.textContent);
      expect(emptyNode).toBeInTheDocument();
    });
    expect(screen.getByTestId('empty').textContent).toContain('No Items Found');
  });
});