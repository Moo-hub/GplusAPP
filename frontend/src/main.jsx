
import React from "react";
import ReactDOM from "react-dom/client";
import CleanApp from "./CleanApp";
import "./i18n";
import "./index.css";
import 'react-toastify/dist/ReactToastify.css';

// Static import for MSW worker
// Attempt to import MSW worker. Some environments (production, CI) may not
// have the worker file; guard against that so the app can still mount.
let worker = null;
try {
  // Use a dynamic require so bundlers that strip MSW in production won't
  // break the module resolution during build.
  // eslint-disable-next-line global-require
  const maybe = require('./mocks/browser');
  worker = maybe && (maybe.worker || maybe.default);
} catch (e) {
  // worker not available in this environment; we'll continue without mocks
  worker = null;
}

const isDev = process.env.NODE_ENV === 'development';

async function enableMocks() {
  if (isDev && typeof window !== 'undefined') {
    try {
      if (worker && typeof worker.start === 'function') {
        console.log('🔶 Initializing Mock Service Worker...');
        // Start MSW but don't let it stall app mount for more than 1s
        const startPromise = worker.start({ onUnhandledRequest: 'bypass' });
        const timeout = new Promise(resolve => setTimeout(resolve, 1000));
        await Promise.race([startPromise, timeout]);
        console.log('✅ Mock Service Worker initialized (or timed out)');
      } else {
        console.log('⚠️ MSW worker not found; continuing without request mocks');
      }
    } catch (mswError) {
      console.warn('⚠️ MSW initialization failed, continuing without mocks:', mswError.message);
    }
  }
}

async function mountApp() {
  try {
    console.log('🔶 Starting React application...');
    await enableMocks();
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <CleanApp />
      </React.StrictMode>
    );
    console.log('✅ React app mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting app:', error);
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#e53e3e' }}>Application Error</h1>
          <p>There was an error loading the application: {error.message}</p>
          <details>
            <summary>Error Details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {error.stack}
            </pre>
          </details>
        </div>
      </React.StrictMode>
    );
  }
}

mountApp();

