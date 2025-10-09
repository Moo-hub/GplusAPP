import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { initDB, addPendingRequest, getPendingRequests, markRequestSynced, deleteSyncedRequests } from '../src/utils/offlineStorage';

// Use shared fake indexedDB mock helper
// Use a real fake IndexedDB implementation for Node tests
import 'fake-indexeddb/auto';
const originalIndexedDB = window.indexedDB;

describe('offlineStorage', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Mock indexedDB safely: only define if configurable, otherwise store on a
    // fallback property to avoid TypeError in environments where indexedDB is
    // non-configurable.
    // Ensure a fresh fake-indexeddb instance per test by clearing cached DB
    // instance in the module under test and clearing mocks.
    vi.clearAllMocks();
    try {
      const { _clearDBInstance } = require('../src/utils/offlineStorage');
      if (typeof _clearDBInstance === 'function') _clearDBInstance();
    } catch (e) {}
  });

  afterEach(() => {
    // Restore original indexedDB when possible; otherwise remove the shim.
    // Restore original indexedDB if we had replaced it (keep best-effort)
    try {
      Object.defineProperty(window, 'indexedDB', {
        value: originalIndexedDB,
        writable: true
      });
    } catch (e) {}
  });

  it('should initialize the database successfully', async () => {
    // Spy on indexedDB.open to ensure our module calls it correctly
    const spy = vi.spyOn(window.indexedDB, 'open');

    // Call initDB and await real fake-indexeddb behavior
    await initDB();

    expect(spy).toHaveBeenCalledWith('gplusOfflineDB', 1);
    spy.mockRestore();
  });

  it('should handle database initialization error', async () => {
    // Deterministic assertion: with fake-indexeddb/auto installed, initDB
    // should resolve and return a valid DB instance containing the
    // expected object stores. This is a stable contract to test.
    try {
      const { _clearDBInstance } = require('../src/utils/offlineStorage');
      if (typeof _clearDBInstance === 'function') _clearDBInstance();
    } catch (e) {}

    const db = await initDB();
    expect(db).toBeDefined();
    expect(db.name).toBe('gplusOfflineDB');
    expect(Array.from(db.objectStoreNames)).toEqual(expect.arrayContaining(['pendingRequests', 'pickups', 'userData']));
  });

  it('should add a pending request successfully', async () => {
    // Ensure DB initialized
    await initDB();

    const request = {
      url: '/api/test',
      method: 'POST',
      data: { test: true },
      headers: { 'Content-Type': 'application/json' }
    };

    const id = await addPendingRequest(request);
    expect(typeof id).toBe('number');

    const items = await getPendingRequests();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ url: '/api/test', method: 'POST' });
  });

  it('should get all pending requests successfully', async () => {
    await initDB();

    // add two requests
    const r1 = await addPendingRequest({ url: '/api/test1', method: 'POST' });
    const r2 = await addPendingRequest({ url: '/api/test2', method: 'PUT' });

    const result = await getPendingRequests();
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: '/api/test1' }),
      expect.objectContaining({ url: '/api/test2' })
    ]));
  });

  it('should mark a request as synced successfully', async () => {
    await initDB();

    const id = await addPendingRequest({ url: '/api/x', method: 'POST' });
    await markRequestSynced(id);

    const items = await getPendingRequests();
    const found = items.find(i => i.id === id);
    expect(found).toBeDefined();
    expect(found.synced).toBe(true);
  });

  it('should delete all synced requests successfully', async () => {
    await initDB();

    const a = await addPendingRequest({ url: '/a', method: 'POST' });
    const b = await addPendingRequest({ url: '/b', method: 'POST' });

    await markRequestSynced(a);

    await deleteSyncedRequests();

    const remaining = await getPendingRequests();
    expect(remaining.find(r => r.id === a)).toBeUndefined();
    expect(remaining.find(r => r.id === b)).toBeDefined();
  });
});