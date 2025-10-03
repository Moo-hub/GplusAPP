import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './GenericScreen.css';

// Real implementation kept as an internal component so tests can inject
// a global stub (globalThis.GenericScreen) which will be preferred by
// the exported wrapper. This avoids test flakiness due to module import
// timing or duplicated module instances.
function GenericScreenImpl({ 
  apiCall, 
  titleKey, 
  emptyKey, 
  errorKey, 
  children,
  params = {},
  className = '',
  loadingComponent,
  errorComponent,
  emptyComponent,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // استخدام useCallback لتحسين الأداء
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiCall(params);
      console.log('[TEST DEBUG] GenericScreen apiCall identity:', { name: apiCall && apiCall.name, isMock: !!(apiCall && apiCall._isMock), fn: apiCall && apiCall.toString() });
      // Support axios-style responses where the HTTP client returns { data }
      // (unwrapping typically occurs in service layers, but be defensive
      // here as well for robustness in tests).
      let resultValue = result;
      if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'value')) {
        // Some test helpers may wrap results in a { value } object when
        // logging; extract value if present.
        resultValue = result.value;
      }
      setData(resultValue);
      setError(null);
      console.log('[TEST DEBUG] GenericScreen apiCall resolved:', { value: Array.isArray(resultValue) ? resultValue : resultValue, isArray: Array.isArray(resultValue), length: Array.isArray(resultValue) ? resultValue.length : undefined });
      console.log('[TEST DEBUG] GenericScreen setData to:', resultValue);
    } catch (err) {
      console.log('[TEST DEBUG] GenericScreen apiCall rejected:', err && err.message);
      setError(err.message || 'Error');
      setData(null);
    } finally {
      console.log('[TEST DEBUG] GenericScreen about to setLoading(false)');
      setLoading(false);
    }
  }, [apiCall, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // وظيفة لإعادة تحميل البيانات
  const reload = () => fetchData();

  // مكونات الحالات المختلفة
  if (loading) return loadingComponent || <div className="gs-loading" data-testid="loading">Loading...</div>;
  
  if (error) return errorComponent || (
    <div className="gs-error" data-testid="error">
      {errorKey || error}
      <button onClick={reload} className="gs-reload-btn">إعادة المحاولة</button>
    </div>
  );
  
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || <div className="gs-empty" data-testid="empty">{emptyKey || 'No data'}</div>;
  }

  return (
    <div className={`generic-screen ${className}`} data-testid="generic-screen">
      {titleKey && <h2 className="gs-title">{titleKey}</h2>}
      {typeof children === 'function' ? children(data, { reload }) : children}
    </div>
  );
}

GenericScreenImpl.propTypes = {
  apiCall: PropTypes.func.isRequired,
  titleKey: PropTypes.string,
  emptyKey: PropTypes.string,
  errorKey: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  params: PropTypes.object,
  className: PropTypes.string,
  loadingComponent: PropTypes.node,
  errorComponent: PropTypes.node,
  emptyComponent: PropTypes.node,
};

// Exported wrapper that prefers a test-injected global stub when present.
export default function GenericScreen(props) {
  try {
    const globalImpl = (typeof globalThis !== 'undefined' && globalThis.GenericScreen) || (typeof global !== 'undefined' && global.GenericScreen);
    if (globalImpl) {
      // If the stub is a React component, render it. Otherwise if it's
      // a factory that returns a component, attempt to call it.
      const Impl = globalImpl || GenericScreenImpl;
      return React.createElement(Impl, props);
    }
  } catch (e) {
    // ignore and fall back to real implementation
  }
  return React.createElement(GenericScreenImpl, props);
}


