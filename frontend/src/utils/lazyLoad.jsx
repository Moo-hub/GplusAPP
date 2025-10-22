import { lazy } from 'react';
import PropTypes from 'prop-types';

const LoadingFallback = () => (
  <div className="lazy-loading">
    <div className="loading-spinner"></div>
  </div>
);

export default function lazyLoad(importFunc, fallback = <LoadingFallback />) {
  const LazyComponent = lazy(importFunc);
  
  const LoadableComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return LoadableComponent;
}

lazyLoad.propTypes = {
  importFunc: PropTypes.func,
  fallback: PropTypes.node
};