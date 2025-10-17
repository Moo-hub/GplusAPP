import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Slide in animation
const slideIn = keyframes`
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
`;

// Slide out animation
const slideOut = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-100%);
  }
`;

// Pulse animation for the indicator
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${({ isOnline }) => (isOnline ? '#4caf50' : '#f44336')};
  color: white;
  padding: 0.75rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${({ isVisible, isOnline }) => 
    isVisible 
      ? slideIn 
      : slideOut} 0.3s ease-out forwards;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: background-color 0.3s;
`;

const StatusIcon = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ isOnline }) => (isOnline ? '#fff' : '#fff')};
  margin-right: 0.75rem;
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

const Message = styled.span`
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-left: 1rem;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

/**
 * Component that detects and shows the user's online/offline status
 */
const OfflineDetector = ({ 
  offlineMessage = "You are currently offline. Some features may be unavailable.", 
  onlineMessage = "You are back online!",
  showOnlineStatus = true,
  onlineStatusDuration = 3000,
  persistOfflineMessage = true,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    // Function to handle online status change
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(true);
      
      // If we're showing online status, hide after a delay
      if (showOnlineStatus && hasBeenOffline) {
        setTimeout(() => {
          setIsVisible(false);
        }, onlineStatusDuration);
      }
    };

    // Function to handle offline status change
    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      setHasBeenOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize visibility based on current status
    // Only show offline message initially, not online message
    if (!navigator.onLine) {
      setIsVisible(true);
      setHasBeenOffline(true);
    }

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOnlineStatus, onlineStatusDuration, hasBeenOffline]);

  // Function to manually dismiss the notification
  const handleDismiss = () => {
    setIsVisible(false);
  };

  // If status is online and we shouldn't show online status, or if the notification is dismissed
  if ((isOnline && !showOnlineStatus && !hasBeenOffline) || !isVisible) {
    return null;
  }

  // Don't show anything if we're online and haven't been offline yet
  if (isOnline && !hasBeenOffline) {
    return null;
  }

  // If we're offline and persistOfflineMessage is false, allow the user to dismiss
  const allowDismiss = !isOnline && !persistOfflineMessage;

  return (
    <Container isOnline={isOnline} isVisible={isVisible} role="status" aria-live="polite">
      <StatusIcon isOnline={isOnline} aria-hidden="true" />
      <Message>{isOnline ? onlineMessage : offlineMessage}</Message>
      {allowDismiss && (
        <CloseButton 
          onClick={handleDismiss} 
          aria-label="Dismiss notification"
        >
          ✕
        </CloseButton>
      )}
    </Container>
  );
};

OfflineDetector.propTypes = {
  offlineMessage: PropTypes.string,
  onlineMessage: PropTypes.string,
  showOnlineStatus: PropTypes.bool,
  onlineStatusDuration: PropTypes.number,
  persistOfflineMessage: PropTypes.bool,
};

export default OfflineDetector;