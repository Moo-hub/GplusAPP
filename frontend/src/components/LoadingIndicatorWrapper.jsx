import React from 'react';
import { useLoading } from '../contexts/LoadingContext';
import LoadingOverlay from './ui/LoadingOverlay';

/**
 * Wrapper component that displays a loading overlay when global loading state is active
 */
const LoadingIndicatorWrapper = ({ children }) => {
  const { isLoading } = useLoading();
  
  return (
    <>
      {/* Global loading overlay */}
      <LoadingOverlay isVisible={isLoading} />
      
      {/* Render children */}
      {children}
    </>
  );
};

export default LoadingIndicatorWrapper;