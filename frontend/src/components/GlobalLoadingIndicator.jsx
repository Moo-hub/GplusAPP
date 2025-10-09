import React, { useEffect, useState } from 'react';
import { apiCallsInProgress } from '../services/api';
import styled from 'styled-components';

// Styled component for the loading indicator
const LoadingIndicator = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: transparent;
  z-index: 1000;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    height: 100%;
    width: 100%;
    background: linear-gradient(to right, #4338ca, #6366f1, #8b5cf6);
    transform: translateX(-100%);
    animation: ${props => props.isLoading ? 'loading 1.5s ease-in-out infinite' : 'none'};
  }

  @keyframes loading {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

/**
 * GlobalLoadingIndicator component
 * Shows a loading bar at the top of the page when API requests are in progress
 */
const GlobalLoadingIndicator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // Check if there are ongoing API calls every 100ms
    const intervalId = setInterval(() => {
      const hasActiveRequests = apiCallsInProgress.size > 0;
      
      if (hasActiveRequests && !isLoading) {
        // Show loading immediately when requests start
        setIsLoading(true);
        
        // Clear any existing hide timer
        if (timer) {
          clearTimeout(timer);
          setTimer(null);
        }
      } 
      else if (!hasActiveRequests && isLoading) {
        // Add slight delay before hiding to prevent flickering
        // for quickly resolved requests
        const hideTimer = setTimeout(() => {
          setIsLoading(false);
        }, 300);
        
        setTimer(hideTimer);
        
        // Cleanup timer on unmount or when new requests start
        return () => clearTimeout(hideTimer);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, timer]);

  return <LoadingIndicator isLoading={isLoading} role="progressbar" aria-hidden={!isLoading} />;
};

export default GlobalLoadingIndicator;