import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { ThemeProvider } from "./styles/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PointsDashboard from "./components/PointsDashboard";
import PickupRequests from "./components/PickupRequests";
import PickupRequestForm from "./components/PickupRequestForm";
import Profile from "./components/Profile";
import NotFound from "./components/NotFound";
import Navigation from "./components/Navigation";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ApiTest from "./components/ApiTest";
import "./App.css";

// Loading component
function AppLoading() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '20px' }}>🔄 Loading GPlus App...</div>
      <div>يتم تحميل تطبيق جي بلس...</div>
    </div>
  );
}

// Main App Routes Component
function AppRoutes() {
  const { currentUser } = useAuth();
  const { i18n } = useTranslation();

  return (
    <div className="App" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navigation - only show when user is logged in */}
      {currentUser && <Navigation />}
      
      {/* Language Switcher - always visible */}
      <LanguageSwitcher />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/api-test" element={<ApiTest />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/points" element={
          <ProtectedRoute>
            <PointsDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/pickup-requests" element={
          <ProtectedRoute>
            <PickupRequests />
          </ProtectedRoute>
        } />
        
        <Route path="/pickup-request/new" element={
          <ProtectedRoute>
            <PickupRequestForm />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Default route */}
        <Route path="/" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={i18n.language === 'ar'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

function CleanApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LoadingProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<AppLoading />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default CleanApp;