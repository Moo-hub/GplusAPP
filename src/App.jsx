import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import contexts and providers
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/toast/Toast';
import { QueryProvider } from './providers/QueryProvider';
import { OfflineProvider } from './contexts/OfflineContext';
import { CSRFProvider } from './contexts/CSRFContext';
import ResponsiveWrapper from './components/ResponsiveWrapper';
import { initializeOfflineContext } from './services/enhancedApi';

// Import components
import NotFound from './components/NotFound';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PickupRequests from './components/PickupRequests';
import PickupRequestForm from './components/PickupRequestForm';
import PickupCalendarScreen from './components/screens/PickupCalendarScreen';
import CompanyList from './components/CompanyList';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/error/ErrorBoundary';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import EnvironmentalDashboard from './components/EnvironmentalDashboard';

// Admin components
const AdminScreen = lazy(() => import('./screens/Admin/AdminScreen'));

// Redemption system components
import RedemptionOptions from './components/RedemptionOptions';
import RedemptionDetails from './components/RedemptionDetails';
import UserRedemptions from './components/UserRedemptions';
import RedemptionView from './components/RedemptionView';
import AdminRedemptionOptions from './components/AdminRedemptionOptions';

// Import API toast initializer
import { ApiToastInitializer } from './services/api';

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <CSRFProvider>
          <AuthProvider>
            <ToastProvider>
              <ResponsiveWrapper>
                <ApiToastInitializer />
              <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public routes */}
                <Route index element={
                  <ErrorBoundary>
                    <Home />
                  </ErrorBoundary>
                } />
                <Route path="/login" element={
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                } />
                <Route path="/register" element={
                  <ErrorBoundary>
                    <Register />
                  </ErrorBoundary>
                } />
                <Route path="/companies" element={
                  <ErrorBoundary>
                    <CompanyList />
                  </ErrorBoundary>
                } />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/pickups" element={
                    <ErrorBoundary>
                      <PickupRequests />
                    </ErrorBoundary>
                  } />
                  <Route path="/pickups/new" element={
                    <ErrorBoundary>
                      <PickupRequestForm />
                    </ErrorBoundary>
                  } />
                  <Route path="/pickups/calendar" element={
                    <ErrorBoundary>
                      <PickupCalendarScreen />
                    </ErrorBoundary>
                  } />
                  <Route path="/profile" element={
                    <ErrorBoundary>
                      <Profile />
                    </ErrorBoundary>
                  } />
                  <Route path="/dashboard" element={
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  } />
                  <Route path="/environmental-impact" element={
                    <ErrorBoundary>
                      <EnvironmentalDashboard />
                    </ErrorBoundary>
                  } />

                  {/* Redemption system routes */}
                  <Route path="/rewards" element={
                    <ErrorBoundary>
                      <RedemptionOptions />
                    </ErrorBoundary>
                  } />
                  <Route path="/rewards/:id" element={
                    <ErrorBoundary>
                      <RedemptionDetails />
                    </ErrorBoundary>
                  } />
                  <Route path="/account/redemptions" element={
                    <ErrorBoundary>
                      <UserRedemptions />
                    </ErrorBoundary>
                  } />
                  <Route path="/redemptions/:id" element={
                    <ErrorBoundary>
                      <RedemptionView />
                    </ErrorBoundary>
                  } />

                  {/* Admin routes - accessible through Protected Route */}
                  <Route path="/admin/redemption-options" element={
                    <ErrorBoundary>
                      <AdminRedemptionOptions />
                    </ErrorBoundary>
                  } />
                </Route>
                
                {/* Admin Dashboard routes - require admin role */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={
                    <ErrorBoundary>
                      <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div><p>Loading...</p></div>}>
                        <AdminScreen />
                      </Suspense>
                    </ErrorBoundary>
                  } />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
            </ResponsiveWrapper>
          </ToastProvider>
        </AuthProvider>
        </CSRFProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

// Create an OfflineAwareApp wrapper
const OfflineAwareApp = () => {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
          console.log('ServiceWorker registered with scope:', registration.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed:', err);
        });
      });
    }
  }, []);

  return (
    <OfflineProvider>
      {(offlineContext) => {
        // Initialize the API with offline context
        initializeOfflineContext(offlineContext);
        
        return <App />;
      }}
    </OfflineProvider>
  );
};

export default OfflineAwareApp;