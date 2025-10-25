import React, { useState, useEffect, useCallback } from 'react';
import useSafeTranslation from '../hooks/useSafeTranslation';
import PropTypes from 'prop-types';
import './GenericScreen.css';

function GenericScreenImpl({ 
  apiCall, 
  titleKey, 
  emptyKey, 
  errorKey, 
  children,
  renderItem,
  params, // avoid defaulting to a new object each render
  className = '',
  loadingComponent,
  errorComponent,
  emptyComponent,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // normalize params so we don't pass a fresh object instance to apiCall
      const stableParams = params || undefined;
      const result = await apiCall(stableParams);
      try {
        if (typeof global !== 'undefined' && global.__TEST__) {
          // eslint-disable-next-line no-console
          // diagnostic suppressed: GenericScreen apiCall identity
          // eslint-disable-next-line no-console
          // diagnostic suppressed: GenericScreen apiCall resolved
        }
      } catch (e) {}

      // Defensive unwrap: some service layers return { data } or { value }
      let value = result;
      if (value && typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, 'data')) value = value.data;
        else if (Object.prototype.hasOwnProperty.call(value, 'value')) value = value.value;
      }

      setData(value);
      setError(null);
      try {
        if (typeof global !== 'undefined' && global.__TEST__) {
          // eslint-disable-next-line no-console
          // diagnostic suppressed: GenericScreen setData to
        }
      } catch (e) {}
    } catch (err) {
      try {
        if (typeof global !== 'undefined' && global.__TEST__) {
          // eslint-disable-next-line no-console
          // diagnostic suppressed: GenericScreen apiCall rejected
        }
      } catch (e) {}
      setError(err && err.message ? err.message : 'Error');
      setData(null);
    } finally {
      try {
        if (typeof global !== 'undefined' && global.__TEST__) {
          // eslint-disable-next-line no-console
          // diagnostic suppressed: GenericScreen about to setLoading(false)
        }
      } catch (e) {}
      setLoading(false);
    }
  }, [apiCall, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = () => fetchData();
  const { t } = useSafeTranslation();

  if (loading) return loadingComponent || <div className="gs-loading" data-testid="loading">{t('loading') || 'Loading...'}</div>;
  if (error) return errorComponent || (
    <div className="gs-error" data-testid="error">
      {errorKey ? t(errorKey) : error}
      <button onClick={reload} className="gs-reload-btn">{t('retry') || 'Retry'}</button>
    </div>
  );
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || <div className="gs-empty" data-testid="empty">{emptyKey ? t(emptyKey) : (t('no_data') || 'No data')}</div>;
  }

  // If a renderItem prop is provided and data is an array, render each
  // item using that function. This keeps the API ergonomic for simple
  // list-like screens (e.g. CompaniesScreen) which pass a renderItem
  // prop instead of a render-prop child.
  if (Array.isArray(data) && typeof renderItem === 'function') {
    return (
      <div className={`generic-screen ${className}`} data-testid="generic-screen">
        {titleKey && <h2 className="gs-title">{t(titleKey)}</h2>}
        <div className="gs-list">
          {data.map((item, idx) => (
            <div key={item && (item.id != null ? item.id : idx)} className="gs-list-item">
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`generic-screen ${className}`} data-testid="generic-screen">
      {titleKey && <h2 className="gs-title">{t(titleKey)}</h2>}
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

// Export wrapper that prefers a test-injected global stub when present
export default function GenericScreen(props) {
  try {
    const globalImpl = (typeof globalThis !== 'undefined' && globalThis.GenericScreen) || (typeof global !== 'undefined' && global.GenericScreen);
    if (globalImpl) {
      const Impl = globalImpl || GenericScreenImpl;
      return React.createElement(Impl, props);
    }
  } catch (e) {
    // ignore and fall back
  }
  return React.createElement(GenericScreenImpl, props);
}


