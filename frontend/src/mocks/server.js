import * as mswCore from 'msw';
// Prefer dynamic ESM imports so conditional exports in msw resolve
// correctly in ESM test environments. Provide clear diagnostic logs
// so test runs show whether the real msw server was initialized or
// a no-op fallback was used.
// Diagnostic: print loader path so test output can confirm this file
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import handlersModule from './handlers.js';

const handlers = (handlersModule && (handlersModule.handlers || (handlersModule.default && handlersModule.default.handlers))) || [];
const server = setupServer(...handlers);
// Attach core helpers for tests to register handlers
server.http = http;
server.HttpResponse = HttpResponse;

export { server };
export default { server };
// _setRealServer so exported.__mswReal and ready are resolved.
if (realServer) _setRealServer(realServer);

export const server = exported;
export default { server };
