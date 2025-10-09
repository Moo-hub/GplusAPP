// Lazy compatibility shim: avoid importing the heavy MSW/server module at top-level.
// This proxy will dynamically import the real server from the frontend only when
// one of its methods or helpers is actually used. That keeps the test runner
// from eagerly loading big modules and helps prevent OOM during large test runs.

let _realServer = null;
let _importStarted = false;
let _importPromise = null;
const _pending = [];

function _startImport() {
	if (!_importStarted) {
		_importStarted = true;
		_importPromise = import('../frontend/src/mocks/server.js').then((mod) => {
			// prefer named export 'server' if present
			_realServer = mod.server || mod.default?.server || mod;
			// flush pending calls
			_pending.forEach(({ method, args, resolve, reject }) => {
				try {
					const res = _realServer[method](...args);
					resolve(res);
				} catch (e) {
					reject(e);
				}
			});
			_pending.length = 0;
			return _realServer;
		});
	}
	return _importPromise;
}

function _enqueue(method, args) {
	return new Promise((resolve, reject) => {
		_pending.push({ method, args, resolve, reject });
		_startImport().catch(reject);
	});
}

// Lightweight proxy server object. Methods return Promises if the real server
// hasn't been loaded yet. If the real server is already loaded they proxy
// synchronously to it.
const server = {
	use: (...args) => {
		if (_realServer) return _realServer.use(...args);
		return _enqueue('use', args);
	},
	listen: (...args) => {
		if (_realServer) return _realServer.listen(...args);
		return _enqueue('listen', args);
	},
	resetHandlers: (...args) => {
		if (_realServer) return _realServer.resetHandlers(...args);
		return _enqueue('resetHandlers', args);
	},
	close: (...args) => {
		if (_realServer) return _realServer.close(...args);
		return _enqueue('close', args);
	},
	listHandlers: (...args) => {
		if (_realServer) return _realServer.listHandlers(...args);
		return _enqueue('listHandlers', args);
	},
};

// Export a ready promise so callers can wait for the underlying server if they want.
function ready() {
	return _startImport();
}

// Lazy helpers for HttpResponse and http namespace. They return Promises that
// resolve to the underlying implementation result.
function HttpResponse(...args) {
	return _startImport().then((s) => s.HttpResponse(...args));
}

const http = new Proxy(
	{},
	{
		get(_, prop) {
			return (...args) => _startImport().then((s) => s.http[prop](...args));
		},
	}
);

export { server, ready, HttpResponse, http };
export default server;
