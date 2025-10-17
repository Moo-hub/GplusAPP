import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/compatibility.css";
import "./styles/accessibility.css";
import "./styles/performance.css";
import { initCompatibilityFixes } from "./utils/compatibility.js";

async function mountApp() {
  // Initialize compatibility fixes
  initCompatibilityFixes();
  
  /*
  // تفعيل MSW للاختبار السريع مع بيانات محلية
  if (process.env.NODE_ENV === 'development') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true
      });
      console.log('🔶 Mock Service Worker is currently DISABLED for backend integration testing.');
      // console.log('📧 جرب: test@example.com');
      // console.log('🔑 كلمة المرور: password123');
      // console.log('📧 أو جرب: admin@gplus.com');
      // console.log('🔑 كلمة المرور: admin123');
      // console.log('✨ MSW يحول الطلبات إلى Backend الحقيقي الآن!');
    } catch (error) {
      console.warn('MSW failed to start:', error);
    }
  }
  */
  
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

mountApp();

