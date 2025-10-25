/**
 * MSW Server for Node.js test environment
 * Simple and reliable setup - no proxy, no dynamic imports
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Create server with all handlers
export const server = setupServer(...handlers);

// For compatibility with code expecting ready promise
export const ready = Promise.resolve();

