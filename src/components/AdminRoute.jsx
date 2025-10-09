import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRoute component that restricts access to admin users only
 * Renders children only if user is authenticated and has admin role
 * Otherwise redirects to home or login page
 */
const AdminRoute = () => {
  const { currentUser, loading, userRole } = useAuth();
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

  // If user isn't authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  if (userRole !== 'admin') {
    // User is authenticated but not an admin, redirect to home
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has admin role, render the child routes
  return <Outlet />;
};

export default AdminRoute;