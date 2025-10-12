import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

async function mountApp() {
  // إعداد MSW للمحاكاة في بيئة التطوير فقط
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('🔶 Mock Service Worker initialized');
  }
  
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

mountApp();

