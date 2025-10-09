import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useLocalizedLink } from '../../hooks/useLocalizedRouting';

/**
 * LocalizedProtectedRoute Component
 * 
 * A component that protects routes based on authentication status while
 * maintaining internationalization features. It redirects to a localized path
 * if the user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated
 * @param {ReactNode} props.children - Child components/content to render if authenticated
 * @returns {JSX.Element} The protected route component or redirect
 */
const LocalizedProtectedRoute = ({ isAuthenticated, redirectTo, children }) => {
  const localizedLink = useLocalizedLink();
  
  // If not authenticated, redirect to the localized version of redirectTo
  if (!isAuthenticated) {
    const localizedRedirectPath = localizedLink(redirectTo);
    return <Navigate to={localizedRedirectPath} replace />;
  }
  
  // If authenticated, render the children
  return children;
};

LocalizedProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  redirectTo: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default LocalizedProtectedRoute;