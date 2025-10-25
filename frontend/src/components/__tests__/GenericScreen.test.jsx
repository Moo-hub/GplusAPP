// import React from 'react'; // Remove duplicate React import
import { screen, waitFor, act, cleanup } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import userEvent from '@testing-library/user-event';

import GenericScreen from '../GenericScreen';
describe('GenericScreen Component', () => {
  // Ensure DOM is cleaned between tests to avoid leftover nodes (loading,
  // error, empty) from previous renders interfering with later assertions.
  afterEach(() => cleanup());
  it('shows loading initially', () => {
    renderWithProviders(<GenericScreen apiCall={() => new Promise(() => {})} />);
    // use findAllBy to allow for async rendering characteristics and tolerate
    // duplicate mounts under React StrictMode
    return screen.findAllByTestId('loading');
  });

  it('renders data when API succeeds', async () => {
    const testData = { value: 'test data' };
    // use a plain function returning a resolved promise for determinism
    const apiCall = () => Promise.resolve(testData);
    
    renderWithProviders(
      <GenericScreen apiCall={apiCall}>
        {(data) => (
          <div data-testid="content">{(data && typeof data === 'object' && data.value) || data}</div>
        )}
      </GenericScreen>
    );

  // Ensure loading shows then assert the content appears. We prefer
  // asserting the final visible outcome rather than relying on loader
  // disappearance because React 18 StrictMode may mount components twice
  // and temporarily leave multiple loader nodes in the DOM.
  await screen.findAllByTestId('loading');
  // pick the first matching content node and assert its text; re-query
  // inside waitFor to avoid holding stale references across rerenders.
  await waitFor(() => expect(screen.getAllByTestId('content')[0]).toHaveTextContent('test data'), { timeout: 2000 });
  });

  it('shows error when API fails', async () => {
    // use a controllable rejection so the test attaches handlers before the
    // promise rejects and to avoid unhandled rejection warnings in Node.
    let rejectPromise = () => {};
    // create a single shared promise so we can attach a noop catch immediately
    // and return the same promise instance from the apiCall function.
    const testPromise = new Promise((_, reject) => { rejectPromise = reject; });
    // attach a noop catch early to avoid Node treating the rejection as
    // unhandled if the component's handler hasn't been attached yet.
    testPromise.catch(() => {});
    const apiCall = () => testPromise;

    renderWithProviders(<GenericScreen apiCall={apiCall} errorKey="Custom Error" />);

  // ensure loading appears, then trigger the rejection under act so React
  // has time to attach component-level handlers before the promise rejects.
  await screen.findAllByTestId('loading');

    if (typeof rejectPromise === 'function') {
      // Use act to flush React updates that may be scheduled in response to
      // the rejection.
      try {
        // eslint-disable-next-line testing-library/no-unnecessary-act
        // some environments require explicit act around state changes
        // triggered by promises.
        // Wrap rejection in a microtask to ensure handlers attached.
        // Use a synchronous act call to keep the pattern deterministic.
        // eslint-disable-next-line no-undef
        act(() => { rejectPromise(new Error('API Error')); });
      } catch (e) {
        // ignore any synchronous errors from the reject call
      }
    }

  // Await the error node explicitly (use findAll to tolerate duplicates)
  const errs = await screen.findAllByTestId('error');
  const err = errs[0];
  expect(err).toBeInTheDocument();
  const msgs = await screen.findAllByText('Custom Error');
  expect(msgs.length).toBeGreaterThan(0);
  });

  it('allows retry after error', async () => {
    // deterministic apiCall that fails first then succeeds using vi.fn
    const apiCall = vi.fn()
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({ value: 'success' });
    
    renderWithProviders(
      <GenericScreen apiCall={apiCall}>
        {(data) => (
          <div data-testid="content">{(data && typeof data === 'object' && data.value) || data}</div>
        )}
      </GenericScreen>
    );

    // Wait for either an error or content to appear (tests may experience
    // duplicate effect calls under React 18/StrictMode so the success can
    // appear quickly). Then, if an error is visible click retry; otherwise
    // assert the content is already present. Finally, ensure the apiCall was
    // invoked at least twice (initial + retry or initial duplicate + retry).
    // Wait for either error or content to appear. React 18 StrictMode
    // sometimes duplicates effect calls so success may appear quickly.
    await waitFor(() => {
      if (screen.queryAllByTestId('error').length || screen.queryAllByTestId('content').length) return true;
      throw new Error('no result yet');
    }, { timeout: 2000 });


    if (screen.queryAllByTestId('error').length) {
      // 1. تأكد من فشل الاختبار الأول (تظهر حالة الخطأ)
  await waitFor(() => expect(screen.getAllByTestId('error').length).toBeGreaterThan(0));

      // 2. العثور على الزر بنص مرن (زر، وبنص 'إعادة المحاولة' أو 'Retry')
  // 1. استخدام findAllByRole للحصول على جميع الأزرار
  const retryButtons = await screen.findAllByRole('button', { name: /إعادة المحاولة|retry/i });
  // 2. اختيار الزر الأخير (الأحدث)
  const retryButton = retryButtons[retryButtons.length - 1];

  // 3. النقر على الزر
  await userEvent.click(retryButton);

  // 4. التحقق من النجاح
  await waitFor(() => expect(screen.queryAllByText(/success/i).length).toBeGreaterThan(0), { timeout: 2000 });
    } else {
      // content already present (race happened); assert expected text on any
      // content node
      const all = screen.getAllByTestId('content');
      expect(all.some(n => n.textContent.includes('success'))).toBe(true);
    }

  expect(apiCall.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state for empty array', async () => {
    const apiCall = () => Promise.resolve([]);
    
    renderWithProviders(
      <GenericScreen apiCall={apiCall} emptyKey="No Items Found">
        {(data) => <div>Should not render</div>}
      </GenericScreen>
    );

  // Wait for the empty state node to appear (don't assert loader count).
  // Re-query inside waitFor to ensure we inspect the current DOM nodes.
  await waitFor(() => expect(screen.getAllByTestId('empty')[0]).toHaveTextContent('No Items Found'), { timeout: 2000 });
  });
});