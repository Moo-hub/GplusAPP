import { vi } from 'vitest';

// Lightweight fake IndexedDB helper for tests.
// Provides an `open` spy and utilities to trigger success/error callbacks.
export function createMockIndexedDB() {
  function makeRequest(result) {
    // Allow results to be queued before handlers are attached.
  // result can be present for test construction, but we don't consider
  // the request successful until triggerSuccess sets hasResult=true.
  let queued = { hasResult: false, result };
    const req = {
      _queued: queued,
      onsuccess: null,
      onerror: null,
      get result() { return queued.result; },
      set result(v) { queued.result = v; queued.hasResult = true; }
    };

    // When a handler is assigned after a result was queued, invoke it.
    Object.defineProperty(req, 'onsuccess', {
      configurable: true,
      enumerable: true,
      get() { return this._onsuccess; },
      set(fn) {
        this._onsuccess = fn;
        if (fn && this._queued && this._queued.hasResult) {
          try { fn({ target: { result: this._queued.result } }); } catch (e) {}
        }
      }
    });

    Object.defineProperty(req, 'onerror', {
      configurable: true,
      enumerable: true,
      get() { return this._onerror; },
      set(fn) {
        this._onerror = fn;
        if (fn && this._queued && this._queued.error) {
          try { fn({ target: { error: this._queued.error } }); } catch (e) {}
        }
      }
    });

    return req;
  }

  // create fresh DB/request objects per open() call to avoid shared state
  function makeDB() {
    // create stable request instances per method so tests that pre-create
    // a request (e.g., const addRequest = objectStore.add();) get the same
    // request instance the module receives when it later calls the same
    // method. This removes timing/identity mismatches.
    const _requests = {};
    function stable(method, defaultResult) {
      return vi.fn(() => {
        if (!_requests[method]) _requests[method] = makeRequest(defaultResult);
        return _requests[method];
      });
    }

    const objectStore = {
      add: stable('add', 1),
      put: stable('put', 1),
      delete: stable('delete', undefined),
      getAll: stable('getAll', []),
      get: stable('get', null),
      clear: stable('clear', undefined),
      // expose for tests if they need to inspect the last request
      __requests: _requests
    };

    // transaction should also queue oncomplete/onerror handlers if commit or
    // other helpers signal completion before handler assignment.
    function makeTransaction() {
      let queued = { completed: false, error: null };
      const tx = {
        objectStore: vi.fn(() => objectStore),
        commit: vi.fn(() => { queued.completed = true; if (tx.oncomplete) try { tx.oncomplete(); } catch (e) {} }),
        get _queued() { return queued; }
      };

      Object.defineProperty(tx, 'oncomplete', {
        configurable: true,
        enumerable: true,
        get() { return this._oncomplete; },
        set(fn) {
          this._oncomplete = fn;
          if (fn && queued.completed) {
            try { fn(); } catch (e) {}
          }
        }
      });

      Object.defineProperty(tx, 'onerror', {
        configurable: true,
        enumerable: true,
        get() { return this._onerror; },
        set(fn) {
          this._onerror = fn;
          if (fn && queued.error) {
            try { fn(queued.error); } catch (e) {}
          }
        }
      });

      return tx;
    }

    const transaction = makeTransaction();

    const db = {
      createObjectStore: vi.fn(() => ({ createIndex: vi.fn() })),
      transaction: vi.fn(() => transaction),
      objectStoreNames: { contains: vi.fn(() => true) }
    };

    // wrap the transaction spy to log calls for debugging, but keep it a vi.fn
    const originalTransaction = db.transaction;
    db.transaction = vi.fn(function(...args) {
      try { console.debug && console.debug('[fakeIndexedDB] db.transaction called', args); } catch (e) {}
      return originalTransaction.apply(this, args);
    });

    // Create an open request that supports queued results and handler
    // setters so tests can trigger events before or after handlers are
    // assigned. Use makeRequest to get the queued behavior.
    const openReturn = makeRequest(db);
    // allow upgradeneeded to be set the same way as onsuccess/onerror
    openReturn.onupgradeneeded = null;

    return { openReturn, db, transaction, objectStore };
  }

  // keep a single openReturn instance until reset() so test-held references
  // and module-held references match (tests call mock.open() and module calls
  // indexedDB.open()).
  let current = null;
  const mock = {
    open: vi.fn(() => {
      if (!current) {
        const created = makeDB();
        current = created.openReturn;
        // also attach db/transaction/objectStore for helper access if needed
        current._db = created.db;
        current._transaction = created.transaction;
        current._objectStore = created.objectStore;
      }
      return current;
    }),
    // helper: trigger success on a request-like object
    triggerSuccess(req, result) {
      if (!req) return;
      // if the request supports queued results, set it so future handler
      // assignments will trigger immediately.
      try {
        if (req._queued) {
          // don't overwrite an existing queued error
          if (typeof result !== 'undefined') req._queued.result = result;
          req._queued.hasResult = true;
        } else {
          if (typeof result !== 'undefined') req.result = result;
        }
      } catch (e) {}

      // debug: help trace calls during tests
      try { console.debug && console.debug('[fakeIndexedDB] triggerSuccess', { req, result: req.result }); } catch (e) {}

      // call handler if already assigned and no queued error
      try {
        if (req._queued && req._queued.error) {
          // an error was queued; don't call success
        } else {
          if (req.onsuccess) req.onsuccess({ target: { result: req.result } });
        }
      } catch (e) {}
    },
    // helper: trigger error on a request-like object
    triggerError(req, error) {
      try {
        if (req._queued) {
          req._queued.error = error;
          req._queued.hasResult = true;
        }
      } catch (e) {}
      try {
        if (req.onerror) req.onerror({ target: { error } });
      } catch (e) {}
    },
    // reset spy state
    reset() {
      mock.open.mockClear && mock.open.mockClear();
      current = null;
      // attempt to clear any cached DB instance in the module under test to
      // ensure complete isolation between tests.
      try {
        // require relative to this mock file location to reach project src
        // path: tests/__mocks__/ -> ../../src/utils/offlineStorage
        // eslint-disable-next-line global-require
        const mod = require('../../src/utils/offlineStorage');
        if (mod && typeof mod._clearDBInstance === 'function') {
          mod._clearDBInstance();
        }
      } catch (e) {
        // ignore if require isn't available (Esm) or fails
      }
    }
  };

  return mock;
}

export default createMockIndexedDB;
