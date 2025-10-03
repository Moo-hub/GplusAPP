import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GenericScreen from '../GenericScreen';

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
    const apiCall = vi.fn().mockRejectedValue(new Error('API Error'));
    
    render(<GenericScreen apiCall={apiCall} errorKey="Custom Error" />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
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
    
    await userEvent.click(screen.getByText('إعادة المحاولة'));
    
    await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(apiCall).toHaveBeenCalledTimes(2);
  });

  it('shows empty state for empty array', async () => {
    const apiCall = vi.fn().mockResolvedValue([]);
    
    render(
      <GenericScreen apiCall={apiCall} emptyKey="No Items Found">
        {(data) => <div>Should not render</div>}
      </GenericScreen>
    );

    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
    expect(screen.getByText('No Items Found')).toBeInTheDocument();
  });
});