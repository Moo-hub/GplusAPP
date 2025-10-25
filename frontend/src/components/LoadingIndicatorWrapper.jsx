import { useLoading } from '../contexts/LoadingContext.jsx';
import LoadingOverlay from './LoadingOverlay.jsx';

/**
 * Wrapper component that displays a loading overlay when global loading state is active
 */
const LoadingIndicatorWrapper = ({ children }) => {
  const { isLoading } = useLoading();
  return (
    <>
      <LoadingOverlay isVisible={isLoading} />
      {children}
    </>
  );
};

export default LoadingIndicatorWrapper;