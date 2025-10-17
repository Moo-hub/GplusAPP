import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { initDB, addPendingRequest, getPendingRequests, markRequestSynced, deleteSyncedRequests } from '../src/utils/offlineStorage';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn().mockReturnValue({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn()
      }),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null
          }),
          put: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null
          }),
          delete: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null
          }),
          getAll: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            result: []
          }),
          get: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            result: null
          }),
          index: vi.fn().mockReturnValue({
            getAll: vi.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
              result: []
            })
          })
        }),
        oncomplete: null,
        onerror: null,
        commit: vi.fn()
      }),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true)
      }
    }
  })
};

// Store the original indexedDB
const originalIndexedDB = window.indexedDB;

describe('offlineStorage', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Mock indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: originalIndexedDB,
      writable: true
    });
  });

  it('should initialize the database successfully', async () => {
    // Setup the success callback
    const openRequest = mockIndexedDB.open();
    
    // Mock the database initialization
    const initPromise = initDB();
    
    // Simulate successful database open
    setTimeout(() => {
      openRequest.onsuccess({ target: { result: openRequest.result } });
    }, 0);
    
    // Wait for the initialization to complete
    await initPromise;
    
    // Verify that indexedDB.open was called with the correct parameters
    expect(mockIndexedDB.open).toHaveBeenCalledWith('gplusOfflineDB', 1);
  });

  it('should handle database initialization error', async () => {
    // Setup the error callback
    const openRequest = mockIndexedDB.open();
    
    // Mock the database initialization
    const initPromise = initDB();
    
    // Simulate a database open error
    setTimeout(() => {
      openRequest.onerror({ target: { error: new Error('Failed to open database') } });
    }, 0);
    
    // Wait for the initialization to fail and expect an error
    await expect(initPromise).rejects.toThrow('Failed to open database');
  });

  it('should add a pending request successfully', async () => {
    // Setup the success callbacks
    const openRequest = mockIndexedDB.open();
    const db = openRequest.result;
    const transaction = db.transaction();
    const objectStore = transaction.objectStore();
    const addRequest = objectStore.add();
    
    // Mock successful DB initialization
    const initPromise = initDB();
    setTimeout(() => {
      openRequest.onsuccess({ target: { result: db } });
    }, 0);
    await initPromise;
    
    // Mock the request to add
    const request = {
      url: '/api/test',
      method: 'POST',
      data: { test: true },
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Add the request
    const addPromise = addPendingRequest(request);
    
    // Simulate successful transaction
    setTimeout(() => {
      addRequest.onsuccess({ target: { result: 1 } });
      transaction.oncomplete();
    }, 0);
    
    // Wait for the request to be added
    const result = await addPromise;
    
    // Verify that the transaction was created with the correct parameters
    expect(db.transaction).toHaveBeenCalledWith(['pendingRequests'], 'readwrite');
    
    // Verify that the object store was accessed
    expect(transaction.objectStore).toHaveBeenCalledWith('pendingRequests');
    
    // Verify that the request was added
    expect(objectStore.add).toHaveBeenCalledWith({
      ...request,
      timestamp: expect.any(Number)
    });
    
    // Verify that the result is the ID returned by the add operation
    expect(result).toBe(1);
  });

  it('should get all pending requests successfully', async () => {
    // Setup the success callbacks
    const openRequest = mockIndexedDB.open();
    const db = openRequest.result;
    const transaction = db.transaction();
    const objectStore = transaction.objectStore();
    const getAllRequest = objectStore.getAll();
    
    // Mock successful DB initialization
    const initPromise = initDB();
    setTimeout(() => {
      openRequest.onsuccess({ target: { result: db } });
    }, 0);
    await initPromise;
    
    // Mock the pending requests
    const pendingRequests = [
      { id: 1, url: '/api/test1', method: 'POST', timestamp: Date.now() },
      { id: 2, url: '/api/test2', method: 'PUT', timestamp: Date.now() }
    ];
    
    // Get all pending requests
    const getPromise = getPendingRequests();
    
    // Simulate successful transaction with mock data
    setTimeout(() => {
      getAllRequest.result = pendingRequests;
      getAllRequest.onsuccess({ target: { result: pendingRequests } });
      transaction.oncomplete();
    }, 0);
    
    // Wait for the requests to be retrieved
    const result = await getPromise;
    
    // Verify that the transaction was created with the correct parameters
    expect(db.transaction).toHaveBeenCalledWith(['pendingRequests'], 'readonly');
    
    // Verify that the object store was accessed
    expect(transaction.objectStore).toHaveBeenCalledWith('pendingRequests');
    
    // Verify that getAll was called
    expect(objectStore.getAll).toHaveBeenCalled();
    
    // Verify that the result matches the mock data
    expect(result).toEqual(pendingRequests);
  });

  it('should mark a request as synced successfully', async () => {
    // Setup the success callbacks
    const openRequest = mockIndexedDB.open();
    const db = openRequest.result;
    const transaction = db.transaction();
    const objectStore = transaction.objectStore();
    const deleteRequest = objectStore.delete();
    
    // Mock successful DB initialization
    const initPromise = initDB();
    setTimeout(() => {
      openRequest.onsuccess({ target: { result: db } });
    }, 0);
    await initPromise;
    
    // Mark a request as synced
    const markPromise = markRequestSynced(1);
    
    // Simulate successful transaction
    setTimeout(() => {
      deleteRequest.onsuccess();
      transaction.oncomplete();
    }, 0);
    
    // Wait for the request to be marked as synced
    await markPromise;
    
    // Verify that the transaction was created with the correct parameters
    expect(db.transaction).toHaveBeenCalledWith(['pendingRequests'], 'readwrite');
    
    // Verify that the object store was accessed
    expect(transaction.objectStore).toHaveBeenCalledWith('pendingRequests');
    
    // Verify that delete was called with the correct ID
    expect(objectStore.delete).toHaveBeenCalledWith(1);
  });

  it('should delete all synced requests successfully', async () => {
    // Setup the success callbacks
    const openRequest = mockIndexedDB.open();
    const db = openRequest.result;
    const transaction = db.transaction();
    const objectStore = transaction.objectStore();
    const clearRequest = { onsuccess: null, onerror: null };
    
    // Mock the clear method
    objectStore.clear = vi.fn().mockReturnValue(clearRequest);
    
    // Mock successful DB initialization
    const initPromise = initDB();
    setTimeout(() => {
      openRequest.onsuccess({ target: { result: db } });
    }, 0);
    await initPromise;
    
    // Delete all synced requests
    const deletePromise = deleteSyncedRequests();
    
    // Simulate successful transaction
    setTimeout(() => {
      clearRequest.onsuccess();
      transaction.oncomplete();
    }, 0);
    
    // Wait for the requests to be deleted
    await deletePromise;
    
    // Verify that the transaction was created with the correct parameters
    expect(db.transaction).toHaveBeenCalledWith(['pendingRequests'], 'readwrite');
    
    // Verify that the object store was accessed
    expect(transaction.objectStore).toHaveBeenCalledWith('pendingRequests');
    
    // Verify that clear was called
    expect(objectStore.clear).toHaveBeenCalled();
  });
});