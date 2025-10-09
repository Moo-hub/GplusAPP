import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import RetryError from './RetryError';

const Container = styled.div`
  min-height: ${({ minHeight }) => minHeight || '200px'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  max-width: 500px;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-secondary, #666);
  
  [data-theme='dark'] & {
    color: var(--text-secondary-dark, #aaa);
  }
`;

const EmptyTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: var(--text-primary, #333);
  
  [data-theme='dark'] & {
    color: var(--text-primary-dark, #eee);
  }
`;

const EmptyMessage = styled.p`
  margin: 0 0 1.5rem;
  color: var(--text-secondary, #666);
  
  [data-theme='dark'] & {
    color: var(--text-secondary-dark, #aaa);
  }
`;

/**
 * A component that handles loading, error, empty and content states
 * Use this component to wrap content that relies on async data
 */
const AsyncStateHandler = ({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  retryCount,
  maxRetries,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyTitle = "No data found",
  emptyMessage = "There is no data to display at this time.",
  emptyIcon = "📭",
  emptyAction,
  children,
  minHeight,
}) => {
  // Default loading component if none provided
  const DefaultLoading = () => (
    <Container minHeight={minHeight}>
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </Container>
  );

  // Custom error component or default RetryError
  const ErrorDisplay = errorComponent || (
    <RetryError
      onRetry={onRetry}
      isLoading={isLoading}
      retryCount={retryCount}
      maxRetries={maxRetries}
      title={error?.title || "An error occurred"}
      message={error?.message || "There was a problem loading the data."}
    />
  );

  // Custom empty state or default empty component
  const EmptyDisplay = emptyComponent || (
    <EmptyStateContainer>
      <EmptyIcon aria-hidden="true">{emptyIcon}</EmptyIcon>
      <EmptyTitle>{emptyTitle}</EmptyTitle>
      <EmptyMessage>{emptyMessage}</EmptyMessage>
      {emptyAction}
    </EmptyStateContainer>
  );

  // Determine which state to render
  if (isLoading) {
    return loadingComponent || <DefaultLoading />;
  }

  if (isError) {
    return <Container minHeight={minHeight}>{ErrorDisplay}</Container>;
  }

  if (isEmpty) {
    return <Container minHeight={minHeight}>{EmptyDisplay}</Container>;
  }

  // If none of the above, render the children (content)
  return <>{children}</>;
};

AsyncStateHandler.propTypes = {
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  isEmpty: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func,
  retryCount: PropTypes.number,
  maxRetries: PropTypes.number,
  loadingComponent: PropTypes.node,
  errorComponent: PropTypes.node,
  emptyComponent: PropTypes.node,
  emptyTitle: PropTypes.string,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.node,
  emptyAction: PropTypes.node,
  children: PropTypes.node,
  minHeight: PropTypes.string,
};

export default AsyncStateHandler;