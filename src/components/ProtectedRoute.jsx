import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component that redirects unauthenticated users to login page
 * Renders children only if user is authenticated, otherwise redirects to login
 * Also saves the intended destination to allow redirect back after login
 */
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // If auth is still loading, show a loading spinner
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user isn't authenticated, redirect to login and save the current location
  if (!currentUser) {
    // Save the location they were trying to go to for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;