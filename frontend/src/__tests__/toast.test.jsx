import { vi } from 'vitest';

// Mock react-toastify
const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  dismiss: vi.fn(),
  update: vi.fn(),
  isActive: vi.fn(),
};

// Patch globalThis for helpers (set only once before imports)
if (typeof globalThis !== 'undefined') {
  globalThis.__TEST_TOAST__ = toast;
}

// Now import the mocked toast and the helpers under test
// Removed import of toast from react-toastify; using local mock object instead
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showPromise,
  dismissAll,
  updateToast
} from '../utils/toast.jsx';

describe('Toast Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('showSuccess should call toast.success with correct parameters', () => {
    showSuccess('Test success message');
    
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        className: expect.stringContaining('toast-success')
      })
    );
  });
  
  test('showError should call toast.error with correct parameters', () => {
    showError('Test error message');
    
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        className: expect.stringContaining('toast-error'),
        autoClose: 7000
      })
    );
  });
  
  test('showError should handle Error objects', () => {
    const error = new Error('Test error instance');
    showError(error);
    
    expect(toast.error).toHaveBeenCalledTimes(1);
    // The error message should be passed as content (React element) and config
    expect(toast.error).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
  });
  
  test('showWarning should call toast.warn with correct parameters', () => {
    showWarning('Test warning message');
    
    expect(toast.warn).toHaveBeenCalledTimes(1);
    expect(toast.warn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        className: expect.stringContaining('toast-warning')
      })
    );
  });
  
  test('showInfo should call toast.info with correct parameters', () => {
    showInfo('Test info message');
    
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        className: expect.stringContaining('toast-info')
      })
    );
  });
  
  test('showPromise should call toast.promise with correct parameters', () => {
    const testPromise = Promise.resolve();
    
    showPromise(testPromise, {
      pending: 'Loading data',
      success: 'Data loaded',
      error: 'Failed to load data'
    });
    
    expect(toast.promise).toHaveBeenCalledTimes(1);
    expect(toast.promise).toHaveBeenCalledWith(
      testPromise,
      {
        pending: 'Loading data',
        success: 'Data loaded',
        error: 'Failed to load data'
      },
      expect.any(Object)
    );
  });
  
  test('dismissAll should call toast.dismiss', () => {
    dismissAll();
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
    
    dismissAll(false);
    expect(toast.dismiss).toHaveBeenCalledTimes(2);
    expect(toast.dismiss).toHaveBeenLastCalledWith(null);
  });
  
  test('updateToast should call toast.update if toast is active', () => {
    toast.isActive.mockReturnValueOnce(true);
    
    const toastId = 'test-toast-id';
    const updateOptions = { content: 'Updated content' };
    
    updateToast(toastId, updateOptions);
    
    expect(toast.isActive).toHaveBeenCalledWith(toastId);
    expect(toast.update).toHaveBeenCalledWith(toastId, updateOptions);
  });
  
  test('updateToast should not call toast.update if toast is not active', () => {
    toast.isActive.mockReturnValueOnce(false);
    
    const toastId = 'test-toast-id';
    const updateOptions = { content: 'Updated content' };
    
    updateToast(toastId, updateOptions);
    
    expect(toast.isActive).toHaveBeenCalledWith(toastId);
    expect(toast.update).not.toHaveBeenCalled();
  });
});
