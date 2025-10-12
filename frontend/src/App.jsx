import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";

// Window errorReporter is defined elsewhere or will be added at runtime
// Add JSDoc type definition for errorReporter on Window
/**
 * @typedef {Object} ErrorReporter
 * @property {function} setUser - Sets the current user for error reporting
 * @param {Object} userInfo - User information
 * @param {string} userInfo.id - User ID
 * @param {string} userInfo.email - User email
 * @param {string} userInfo.name - User name
 */

/**
 * @type {Window & { errorReporter?: ErrorReporter }}
 */
const win = window;
import { ThemeProvider } from "./styles/ThemeProvider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
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
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import websocketService from "./services/websocket.service";
import { initErrorReporting, setupGlobalErrorHandler } from "./utils/errorReporter";
import { queryClient } from "./services/queryClient";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { ToastProvider } from "./contexts/ToastContext";

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
  const { currentUser } = useAuth();

  // Initialize error reporting and set up global handlers
  useEffect(() => {
    // Initialize error reporting system
    initErrorReporting({
      environment: process.env.NODE_ENV,
      release: process.env.VITE_APP_VERSION
    });
    
    // Set up global error handlers
    setupGlobalErrorHandler();
    
    // Set user info in error reporter if authenticated
    if (currentUser && win.errorReporter) {
      win.errorReporter.setUser({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name || currentUser.email // Use name if available, fallback to email
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
          <ToastContainer
            role="alert"
            aria-live="assertive"
            autoClose={5000}
          />
        </ErrorBoundary>
      </main>
      </div>
    </>
  );
}

// The main App component just provides the context providers
export default function App() {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <ThemeProvider>
          <ErrorProvider>
            <LoadingProvider>
              <ToastProvider>
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
              </ToastProvider>
            </LoadingProvider>
          </ErrorProvider>
        </ThemeProvider>
      </PreferencesProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// [DEP0170] DeprecationWarning: The URL http://your-proxy-url:port is invalid

