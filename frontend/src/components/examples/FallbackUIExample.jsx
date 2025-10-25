import { useState } from 'react';
import styled from 'styled-components';
import { useAsyncHandler } from '../../hooks/useAsyncHandler';

// Mock API function that simulates different responses
const mockApi = (options = {}) => {
  const {
    shouldSucceed = true,
    shouldTimeout = false,
    isEmpty = false,
    delay = 1500,
  } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldTimeout) {
        reject(new Error('Request timeout'));
      } else if (!shouldSucceed) {
        reject(new Error('Failed to fetch data'));
      } else if (isEmpty) {
        resolve([]);
      } else {
        resolve([
          { id: 1, name: 'Item 1', description: 'Description for item 1' },
          { id: 2, name: 'Item 2', description: 'Description for item 2' },
          { id: 3, name: 'Item 3', description: 'Description for item 3' },
          { id: 4, name: 'Item 4', description: 'Description for item 4' },
        ]);
      }
    }, delay);
  });
};

const ExampleContainer = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  [data-theme='dark'] & {
    background-color: #2a2a2a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  
  [data-theme='dark'] & {
    border-bottom: 1px solid #444;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  background-color: var(--primary, #0066cc);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: var(--primary-dark, #0052a3);
  }
  
  &:disabled {
    background-color: var(--disabled, #cccccc);
    cursor: not-allowed;
  }
`;

const ButtonSecondary = styled(Button)`
  background-color: #6c757d;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const ButtonWarning = styled(Button)`
  background-color: #ffc107;
  color: #212529;
  
  &:hover {
    background-color: #e0a800;
  }
`;

const SkeletonContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const ItemCard = styled.div`
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  
  [data-theme='dark'] & {
    border: 1px solid #444;
  }
`;

const StatusMessage = styled.div`
  background-color: ${({ type }) => {
    switch (type) {
      case 'success':
        return '#d4edda';
      case 'error':
        return '#f8d7da';
      case 'warning':
        return '#fff3cd';
      default:
        return '#d1ecf1';
    }
  }};
  color: ${({ type }) => {
    switch (type) {
      case 'success':
        return '#155724';
      case 'error':
        return '#721c24';
      case 'warning':
        return '#856404';
      default:
        return '#0c5460';
    }
  }};
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
`;

/**
 * Example component demonstrating fallback UI components and retry mechanisms
 */
const FallbackUIExample = () => {
  const [apiOptions, setApiOptions] = useState({
    shouldSucceed: true,
    shouldTimeout: false,
    isEmpty: false,
    delay: 1500,
  });

  // Set up async handler with our mock API
  const {
    data,
    isEmpty,
    isLoading,
    isRetrying,
    retryCount,
    error,
    isOnline,
    execute,
    retry,
  } = useAsyncHandler(
    () => mockApi(apiOptions),
    {
      toastMessages: {
        loading: 'Loading data...',
        error: 'Failed to load data',
        retrySuccess: 'Successfully loaded data!',
        retrying: 'Retrying request',
        offline: 'You are offline. Using cached data if available.',
      },
      retryOptions: {
        maxRetries: 3,
        initialDelay: 2000,
        backoffFactor: 1.5,
      },
      cacheKey: 'example-data',
      cacheTime: 60000, // 1 minute
    }
  );

  // Function to reset and reload data
  const handleReset = () => {
    setApiOptions({
      shouldSucceed: true,
      shouldTimeout: false,
      isEmpty: false,
      delay: 1500,
    });
    execute();
  };

  return (
    <ExampleContainer>
      <h1>Fallback UI Examples</h1>
      
      {/* Offline detector example */}
      <Section>
        <SectionTitle>Offline Detector</SectionTitle>
        <p>
          The offline detector will show when your network connection is lost or restored. 
          The component below is configured to persist when offline and show a temporary notification when connection is restored.
        </p>
        
        <OfflineDetector 
          offlineMessage="You are currently offline. Example functionality will be limited."
          onlineMessage="Your connection has been restored!"
          showOnlineStatus={true}
          onlineStatusDuration={3000}
          persistOfflineMessage={true}
        />
        
        <StatusMessage type="info">
          Current network status: {isOnline ? 'Online ✓' : 'Offline ✗'}
        </StatusMessage>
      </Section>
      
      {/* Skeleton loaders example */}
      <Section>
        <SectionTitle>Skeleton Loaders</SectionTitle>
        <p>
          Skeleton loaders provide visual placeholders while content is loading.
          They improve perceived performance and reduce layout shifts.
        </p>
        
        <Controls>
          <ButtonSecondary onClick={() => setApiOptions({ ...apiOptions, delay: 3000 })}>
            Show Skeletons for 3s
          </ButtonSecondary>
        </Controls>
        
        <SectionTitle as="h3">Card Skeleton</SectionTitle>
        <SkeletonContainer>
          <CardSkeleton />
          <CardSkeleton rows={4} />
          <CardSkeleton hasHeader={false} />
        </SkeletonContainer>
        
        <SectionTitle as="h3">Table Skeleton</SectionTitle>
        <TableSkeleton rows={3} columns={4} />
        
        <SectionTitle as="h3">List Skeleton</SectionTitle>
        <ListSkeleton items={3} />
      </Section>
      
      {/* Retry mechanism example */}
      <Section>
        <SectionTitle>Retry Mechanism</SectionTitle>
        <p>
          The retry mechanism automatically attempts to recover from failed API requests.
          You can also provide a manual retry button for users.
        </p>
        
        <Controls>
          <Button 
            onClick={() => execute()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Data (Success)'}
          </Button>
          
          <ButtonWarning 
            onClick={() => {
              setApiOptions({ ...apiOptions, shouldSucceed: false });
              execute();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Data (Failure)'}
          </ButtonWarning>
          
          <ButtonSecondary 
            onClick={() => {
              setApiOptions({ ...apiOptions, shouldTimeout: true });
              execute();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Data (Timeout)'}
          </ButtonSecondary>
          
          <ButtonSecondary 
            onClick={() => {
              setApiOptions({ ...apiOptions, isEmpty: true });
              execute();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Data (Empty)'}
          </ButtonSecondary>
        </Controls>
        
        {error && !isLoading && (
          <RetryError 
            onRetry={retry}
            isLoading={isRetrying}
            retryCount={retryCount}
            maxRetries={3}
            title="Failed to load example data"
            message={error.message || 'There was an error loading the data. Please try again.'}
          />
        )}
      </Section>
      
      {/* AsyncStateHandler example */}
      <Section>
        <SectionTitle>Unified Async State Handler</SectionTitle>
        <p>
          The AsyncStateHandler component provides a unified way to handle all async states:
          loading, error, empty, and success states.
        </p>
        
        <Controls>
          <Button onClick={handleReset} disabled={isLoading}>
            Reset & Load
          </Button>
        </Controls>
        
        <AsyncStateHandler
          isLoading={isLoading}
          isError={!!error && !isLoading}
          isEmpty={isEmpty && !isLoading && !error}
          error={error}
          onRetry={retry}
          retryCount={retryCount}
          maxRetries={3}
          loadingComponent={
            <div>
              <p>Loading your data...</p>
              <ListSkeleton items={4} />
            </div>
          }
          emptyTitle="No items found"
          emptyMessage="There are no items to display. Try adding some new items."
          emptyIcon="🔍"
          emptyAction={
            <Button onClick={handleReset}>Refresh Data</Button>
          }
        >
          {/* Content to show when data is loaded successfully */}
          <div>
            <h3>Data loaded successfully!</h3>
            {data && data.map(item => (
              <ItemCard key={item.id}>
                <h4>{item.name}</h4>
                <p>{item.description}</p>
              </ItemCard>
            ))}
          </div>
        </AsyncStateHandler>
      </Section>
      
      <Section>
        <SectionTitle>Usage Guide</SectionTitle>
        <p>To implement these fallback UI components in your application:</p>
        
        <ol>
          <li>
            <strong>Network Status Detection:</strong> Add the <code>&lt;OfflineDetector /&gt;</code> component 
            to your App.jsx file to show online/offline status.
          </li>
          <li>
            <strong>Skeleton Loaders:</strong> Use appropriate skeleton components while loading data. 
            For example: <code>&lt;CardSkeleton /&gt;</code> for card layouts.
          </li>
          <li>
            <strong>Retry Mechanism:</strong> Implement the <code>useAsyncHandler</code> hook in your components
            that make API calls to get automatic retry functionality.
          </li>
          <li>
            <strong>Unified State Handling:</strong> Wrap your content with <code>&lt;AsyncStateHandler&gt;</code> 
            to handle all possible states (loading, error, empty, and success).
          </li>
        </ol>
      </Section>
    </ExampleContainer>
  );
};

export default FallbackUIExample;