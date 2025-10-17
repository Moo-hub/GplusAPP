import React from 'react';
import { render, screen } from '@testing-library/react';
import { toast } from 'react-toastify';
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showPromise,
  dismissAll,
  updateToast
} from '../utils/toast';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
    update: jest.fn(),
    isActive: jest.fn(),
  }
}));

// Mock i18n
jest.mock('../i18n/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'common.loading': 'Loading...',
      'common.success': 'Success!',
      'errors.generalError': 'An error occurred',
    };
    return translations[key] || key;
  }),
}));

describe('Toast Utility', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('showSuccess should call toast.success with correct parameters', () => {
    showSuccess('Test success message');
    
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Object),
        props: expect.objectContaining({
          children: expect.arrayOf(expect.any(Object))
        })
      }),
      expect.objectContaining({
        className: 'toast-success '
      })
    );
  });
  
  test('showError should call toast.error with correct parameters', () => {
    showError('Test error message');
    
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Object),
        props: expect.objectContaining({
          children: expect.arrayOf(expect.any(Object))
        })
      }),
      expect.objectContaining({
        className: 'toast-error ',
        autoClose: 7000
      })
    );
  });
  
  test('showError should handle Error objects', () => {
    const error = new Error('Test error instance');
    showError(error);
    
    expect(toast.error).toHaveBeenCalledTimes(1);
    // The error message should be extracted from the Error object
    expect(toast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          children: expect.arrayOf(expect.any(Object))
        })
      }),
      expect.any(Object)
    );
  });
  
  test('showWarning should call toast.warn with correct parameters', () => {
    showWarning('Test warning message');
    
    expect(toast.warn).toHaveBeenCalledTimes(1);
    expect(toast.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Object),
        props: expect.objectContaining({
          children: expect.arrayOf(expect.any(Object))
        })
      }),
      expect.objectContaining({
        className: 'toast-warning '
      })
    );
  });
  
  test('showInfo should call toast.info with correct parameters', () => {
    showInfo('Test info message');
    
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Object),
        props: expect.objectContaining({
          children: expect.arrayOf(expect.any(Object))
        })
      }),
      expect.objectContaining({
        className: 'toast-info '
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