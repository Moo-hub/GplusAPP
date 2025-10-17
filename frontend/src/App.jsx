import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "./styles/ThemeProvider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorFallback from "./components/ErrorFallback";
import LoadingOverlay from "./components/ui/LoadingOverlay";
import LoadingIndicatorWrapper from "./components/LoadingIndicatorWrapper";
import GlobalLoadingIndicator from "./components/GlobalLoadingIndicator";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PointsDashboard from "./components/PointsDashboard";
import PickupRequests from "./components/PickupRequests";
import PickupRequestForm from "./components/PickupRequestForm";
import CompanyList from "./components/CompanyList";
import CompanyDetail from "./components/CompanyDetail";
import Profile from "./components/Profile";
import NotFound from "./components/NotFound";
import Navigation from "./components/Navigation";
import ThemeToggle from "./components/ThemeToggle";
import LanguageSwitcher from "./components/LanguageSwitcher";
import PerformanceDashboard from "./components/dashboard/PerformanceDashboard";
import ServiceWorkerWrapper from "./components/ServiceWorkerWrapper";
import RouteTracker from "./components/RouteTracker";
import { QueryClientProvider } from "@tanstack/react-query";
// Avoid static import of ReactQueryDevtools so Vite's import-analysis doesn't
// fail in test environments where the package may be absent. Use a guarded
// runtime require so this does not become a static ESM import.
let ReactQueryDevtools = null;
try {
  // eslint-disable-next-line global-require
  const _dev = require('@tanstack/react-query-devtools');
  ReactQueryDevtools = _dev && _dev.ReactQueryDevtools ? _dev.ReactQueryDevtools : null;
} catch (e) {
  // ignore — devtools not present in the environment
  ReactQueryDevtools = null;
}
import websocketService from "./services/websocket.service";
import { initErrorReporting, setupGlobalErrorHandler } from "./utils/errorReporter";
import { queryClient } from "./services/queryClient";
import { PreferencesProvider } from "./contexts/PreferencesContext";

// Import our custom styles
import "react-toastify/dist/ReactToastify.css";
import "./styles/toast.css"; 
import "./styles/fallback-ui.css";
import "./App.css";
import "./i18n/i18n";

// Create a separate component for the authenticated content
function AppContent() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // useAuth may return null when AppContent is rendered standalone in tests
  // (no AuthProvider). Guard against null to keep the lightweight render
  // safe for smoke tests.
  const authCtx = useAuth();
  const currentUser = authCtx ? authCtx.currentUser : null;

  // Initialize error reporting and set up global handlers
  useEffect(() => {
    // Initialize error reporting system
    initErrorReporting({
      environment: process.env.NODE_ENV || 'development',
      release: process.env.VITE_APP_VERSION || '1.0.0'
    });
    
    // Set up global error handlers
    setupGlobalErrorHandler();
    
    // Set user info in error reporter if authenticated
    if (currentUser && window['errorReporter']) {
      window['errorReporter'].setUser({
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.name || currentUser.email
      });
    }
  }, [currentUser]);

  // Connect WebSocket when app loads and user is authenticated
  useEffect(() => {
    if (currentUser) {
      websocketService.connect();
    }

    // Cleanup on app unmount
    return () => {
      websocketService.disconnect();
    };
  }, [currentUser]);

  // Monitor network connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <GlobalLoadingIndicator />
      
      <div className="app-container">
        {!isOnline && (
          <div className="offline-notification" role="alert" aria-live="assertive">
            <span className="offline-icon" aria-hidden="true">📶</span>
            {t("common.offlineMode")}
          </div>
        )}

        <ThemeToggle />
        <LanguageSwitcher />

        <header className="app-header">
          <h1>{t("app.title")}</h1>
        </header>

        <Navigation />

        <main className="app-content">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/points"
              element={
                <ProtectedRoute>
                  <PointsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pickups"
              element={
                <ProtectedRoute>
                  <PickupRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pickups/new"
              element={
                <ProtectedRoute>
                  <PickupRequestForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <CompanyList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute>
                  <CompanyDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/performance"
              element={
                <ProtectedRoute>
                  <PerformanceDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} G+ App</p>
          <p className="app-version">
            v{process.env.VITE_APP_VERSION || "1.0.0"}
          </p>
        </footer>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={document.dir === "rtl"}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        closeButton={({ closeToast }) => (
          <button 
            onClick={closeToast} 
            className="Toastify__close-button" 
            aria-label={t('common.dismiss')}
          >
            ×
          </button>
        )}
        toastClassName={(context) => {
          // Add accessibility attributes
          setTimeout(() => {
            const toasts = document.querySelectorAll('.Toastify__toast');
            toasts.forEach(toast => {
              if (!toast.hasAttribute('role')) {
                toast.setAttribute('role', 'alert');
                toast.setAttribute('aria-live', 'assertive');
              }
            });
          }, 100);
          return context?.type || '';
        }}
      />
    </>
  );
}

// Export AppContent so tests can render a lightweight app shell without
// mounting the entire provider/router stack. This reduces module-init
// churn and avoids rare Node module re-import Status=0 errors in tests.
export { AppContent };

// The main App component just provides the context providers
export default function App() {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <ThemeProvider>
          <ErrorProvider>
            <LoadingProvider>
              <AuthProvider>
                <ServiceWorkerWrapper>
                  <BrowserRouter>
                    <RouteTracker>
                      <LoadingIndicatorWrapper>
                        <Suspense
                          fallback={<div className="loading-app">{t("common.loading")}</div>}
                        >
                          <AppContent />
                        </Suspense>
                      </LoadingIndicatorWrapper>
                    </RouteTracker>
                  </BrowserRouter>
                </ServiceWorkerWrapper>
              </AuthProvider>
            </LoadingProvider>
          </ErrorProvider>
        </ThemeProvider>
      </PreferencesProvider>
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}

// [DEP0170] DeprecationWarning: The URL http://your-proxy-url:port is invalid

