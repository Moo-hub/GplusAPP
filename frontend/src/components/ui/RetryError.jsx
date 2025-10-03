import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const RetryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--bg-subtle, #f8f9fa);
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
  
  [data-theme='dark'] & {
    background-color: var(--bg-subtle-dark, #2a2a2a);
  }
`;

const IconContainer = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-secondary, #666);
  
  [data-theme='dark'] & {
    color: var(--text-secondary-dark, #aaa);
  }
`;

const Title = styled.h3`
  margin: 0 0 0.5rem;
  color: var(--text-primary, #333);
  
  [data-theme='dark'] & {
    color: var(--text-primary-dark, #eee);
  }
`;

const Message = styled.p`
  margin: 0 0 1.5rem;
  color: var(--text-secondary, #666);
  max-width: 500px;
  
  [data-theme='dark'] & {
    color: var(--text-secondary-dark, #aaa);
  }
`;

const RetryButton = styled.button`
  background-color: var(--primary, #0066cc);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--primary-dark, #0052a3);
  }
  
  &:disabled {
    background-color: var(--disabled, #cccccc);
    cursor: not-allowed;
  }
  
  [data-theme='dark'] & {
    background-color: var(--primary-dark, #3385ff);
    
    &:hover {
      background-color: var(--primary-darker, #1a75ff);
    }
    
    &:disabled {
      background-color: var(--disabled-dark, #555);
    }
  }
`;

const RetryCount = styled.div`
  font-size: 0.875rem;
  margin-top: 1rem;
  color: var(--text-tertiary, #888);
  
  [data-theme='dark'] & {
    color: var(--text-tertiary-dark, #999);
  }
`;

/**
 * Component to display when an API request fails, with a retry button
 */
const RetryError = ({
  onRetry,
  isLoading,
  retryCount = 0,
  maxRetries = 3,
  title = "Failed to load data",
  message = "There was a problem loading the requested data. Please try again.",
  icon = "⚠️",
  showRetryCount = true,
}) => (
  <RetryContainer role="alert">
    <IconContainer aria-hidden="true">
      {icon}
    </IconContainer>
    
    <Title>{title}</Title>
    <Message>{message}</Message>
    
    <RetryButton 
      onClick={onRetry} 
      disabled={isLoading || retryCount >= maxRetries}
      aria-busy={isLoading}
    >
      {isLoading ? "Retrying..." : retryCount >= maxRetries ? "Max retries reached" : "Try Again"}
    </RetryButton>
    
    {showRetryCount && retryCount > 0 && (
      <RetryCount>
        Retry attempt {retryCount} of {maxRetries}
      </RetryCount>
    )}
  </RetryContainer>
);

RetryError.propTypes = {
  onRetry: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  retryCount: PropTypes.number,
  maxRetries: PropTypes.number,
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.node,
  showRetryCount: PropTypes.bool,
};

export default RetryError;