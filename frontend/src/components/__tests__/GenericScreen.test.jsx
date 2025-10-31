import React from 'react';
import { vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import userEvent from '@testing-library/user-event';
import GenericScreen from '../GenericScreen';

describe('GenericScreen Component', () => {
  it('shows loading initially', () => {
  renderWithProviders(<GenericScreen apiCall={() => new Promise(() => {})} />);
    // use findBy to allow for async rendering characteristics
    return screen.findByTestId('loading');
  });


  it('renders data when API succeeds', async () => {
    const testData = { value: 'test data' };
    const apiCall = () => Promise.resolve(testData);
    renderWithProviders(
      <GenericScreen apiCall={apiCall}>
        {(data) => (
          <div data-testid="content">{(data && typeof data === 'object' && data.value) || data}</div>
        )}
      </GenericScreen>
    );
    await screen.findByTestId('loading');
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const content = await screen.findByTestId('content');
  expect(content).toBeInTheDocument();
  expect(content).toHaveTextContent('test data');
  });


  it('shows error when API fails', async () => {
    const apiCall = () => Promise.reject(new Error('API Error'));
    renderWithProviders(<GenericScreen apiCall={apiCall} errorKey="Custom Error" />);
    await screen.findByTestId('loading');
    const err = await screen.findByTestId('error');
  expect(err).toBeInTheDocument();
  expect(err).toHaveTextContent('Custom Error');
  });


  it('allows retry after error', async () => {
    const apiCall = vi.fn()
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValue({ value: 'success' });
    renderWithProviders(
      <GenericScreen apiCall={apiCall}>
        {(data) => (
          <div data-testid="content">{(data && typeof data === 'object' && data.value) || data}</div>
        )}
      </GenericScreen>
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    if (screen.queryByTestId('error')) {
      const errNode = screen.getByTestId('error');
      const retryBtn = errNode.querySelector('button') || (await screen.findByText(/إعادة المحاولة|Retry/i));
      await userEvent.click(retryBtn);
      await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument(), { timeout: 2000 });
  expect(screen.getByTestId('content')).toHaveTextContent('success');
    } else {
  expect(screen.getByTestId('content')).toHaveTextContent('success');
    }
    expect(apiCall.mock.calls.length).toBeGreaterThanOrEqual(2);
  });


  it('shows empty state for empty array', async () => {
    const apiCall = () => Promise.resolve([]);
    renderWithProviders(
      <GenericScreen apiCall={apiCall} emptyKey="No Items Found">
        {(data) => <div>Should not render</div>}
      </GenericScreen>
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const emptyNode = await screen.findByTestId('empty');
  expect(emptyNode).toBeInTheDocument();
  expect(emptyNode).toHaveTextContent('No Items Found');
  });
});