/**
 * IndexedDB utility for offline data storage
 * 
 * This module provides a wrapper around IndexedDB to make it easier to work with
 * for offline data storage in the GPlus app.
 */

const DB_NAME = 'gplusOfflineDB';
const DB_VERSION = 1;
const STORES = {
  PICKUPS: 'pickups',
  USER_DATA: 'userData',
  PENDING_REQUESTS: 'pendingRequests'
};

let dbInstance = null;

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.PICKUPS)) {
        db.createObjectStore(STORES.PICKUPS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains(STORES.PENDING_REQUESTS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_REQUESTS, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('url', 'url', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
  });
};

/**
 * Add an item to a store
 * @param {string} storeName - The name of the store
 * @param {Object} data - The data to store
 * @returns {Promise<any>} A promise that resolves with the result
 */
export const addItem = async (storeName, data) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Update an item in a store
 * @param {string} storeName - The name of the store
 * @param {Object} data - The data to update
 * @returns {Promise<any>} A promise that resolves with the result
 */
export const updateItem = async (storeName, data) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Get an item from a store
 * @param {string} storeName - The name of the store
 * @param {string|number} id - The ID of the item to get
 * @returns {Promise<any>} A promise that resolves with the item
 */
export const getItem = async (storeName, id) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Get all items from a store
 * @param {string} storeName - The name of the store
 * @returns {Promise<Array>} A promise that resolves with all items
 */
export const getAllItems = async (storeName) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Delete an item from a store
 * @param {string} storeName - The name of the store
 * @param {string|number} id - The ID of the item to delete
 * @returns {Promise<any>} A promise that resolves when the item is deleted
 */
export const deleteItem = async (storeName, id) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Clear all items from a store
 * @param {string} storeName - The name of the store
 * @returns {Promise<any>} A promise that resolves when the store is cleared
 */
export const clearStore = async (storeName) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Add a pending API request to be synchronized when back online
 * @param {Object} requestData - The request data to store
 * @param {string} requestData.url - The URL of the request
 * @param {string} requestData.method - The HTTP method
 * @param {Object} requestData.body - The request body
 * @param {Object} requestData.headers - The request headers
 * @returns {Promise<any>} A promise that resolves with the result
 */
export const addPendingRequest = async (requestData) => {
  const data = {
    ...requestData,
    timestamp: Date.now(),
    synced: false
  };
  
  return await addItem(STORES.PENDING_REQUESTS, data);
};

/**
 * Get all pending requests that need to be synchronized
 * @returns {Promise<Array>} A promise that resolves with all pending requests
 */
export const getPendingRequests = async () => {
  return await getAllItems(STORES.PENDING_REQUESTS);
};

/**
 * Mark a pending request as synced
 * @param {number} id - The ID of the request
 * @returns {Promise<any>} A promise that resolves when the request is marked as synced
 */
export const markRequestSynced = async (id) => {
  const request = await getItem(STORES.PENDING_REQUESTS, id);
  if (request) {
    request.synced = true;
    await updateItem(STORES.PENDING_REQUESTS, request);
  }
};

/**
 * Delete synced requests
 * @returns {Promise<void>} A promise that resolves when synced requests are deleted
 */
export const deleteSyncedRequests = async () => {
  const requests = await getPendingRequests();
  const promises = requests
    .filter(req => req.synced)
    .map(req => deleteItem(STORES.PENDING_REQUESTS, req.id));
  
  await Promise.all(promises);
};

// Export constants
export const Stores = STORES;