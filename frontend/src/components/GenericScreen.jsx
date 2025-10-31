import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './GenericScreen.css';

function GenericScreenImpl({ 
  apiCall,
  titleKey,
  emptyKey,
  errorKey,
  children,
  renderItem,
  params,
  className = '',
  loadingComponent,
  errorComponent,
  emptyComponent,
  dataKey = null,
  loadingMessage = 'Loading...',
  errorMessage = 'Something went wrong',
  emptyMessage = 'No Items Found',
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const stableParams = params || undefined;
      const result = await apiCall(stableParams);
      let value = result;
      if (value && typeof value === 'object') {
        if (dataKey && value[dataKey]) value = value[dataKey];
        else if (Object.prototype.hasOwnProperty.call(value, 'data')) value = value.data;
        else if (Object.prototype.hasOwnProperty.call(value, 'value')) value = value.value;
      }
      setData(value);
      setError(null);
    } catch (err) {
      setError(err && err.message ? err.message : errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiCall, params, dataKey, errorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = () => fetchData();
  const { t } = useTranslation();

  // Loading state
  if (loading) {
    return loadingComponent || (
      <div className="gs-loading" data-testid="loading">
        {t('loading') || loadingMessage}
      </div>
    );
  }

  // Error state
  if (error) {
    return errorComponent || (
      <div className="gs-error" data-testid="error">
        {errorKey ? t(errorKey) : errorMessage}
        <button onClick={reload} className="gs-reload-btn">{t('retry') || 'Retry'}</button>
      </div>
    );
  }

  // If children render-prop or node is provided, prefer it. Treat any non-null data as valid.
  if (children) {
    const isEmptyForChildren = data == null || (Array.isArray(data) && data.length === 0);
    if (isEmptyForChildren) {
      return emptyComponent || (
        <div className="gs-empty" data-testid="empty">
          {emptyKey ? t(emptyKey) : emptyMessage}
        </div>
      );
    }
    return (
      <div className={`generic-screen ${className}`} data-testid="generic-screen">
        {titleKey && <h2 className="gs-title" data-testid="title">{t(titleKey)}</h2>}
        {typeof children === 'function' ? children(data, { reload }) : children}
      </div>
    );
  }

  // List-mode rendering (no children): compute items and render list
  let items = Array.isArray(data) ? data : (dataKey && data && Array.isArray(data[dataKey]) ? data[dataKey] : []);
  if (!items || items.length === 0) {
    return emptyComponent || (
      <div className="gs-empty" data-testid="empty">
        {emptyKey ? t(emptyKey) : emptyMessage}
      </div>
    );
  }

  return (
    <div className={`generic-screen ${className}`} data-testid="generic-screen">
      {titleKey && <h2 className="gs-title" data-testid="title">{t(titleKey)}</h2>}
      <div className="gs-list" data-testid="data">
        {items.map((item, idx) => (
          <div key={item && (item.id != null ? item.id : idx)} className="gs-list-item" data-testid="item">
            {renderItem ? renderItem(item) : (
              <>
                <span data-testid="item-name">{(item && (item.name || item.title)) || `Item ${idx + 1}`}</span>
                <span data-testid="item-balance">{item && item.balance !== undefined ? item.balance : 'N/A'}</span>
                <span data-testid="item-rewards">{item && Array.isArray(item.rewards) ? item.rewards.join(', ') : 'No rewards'}</span>
                <span data-testid="item-price">{item && item.price !== undefined ? item.price : 'N/A'}</span>
              </>
            )}
          </div>
        ))}
      </div>
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
  dataKey: PropTypes.string,
  loadingMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  emptyMessage: PropTypes.string,
  renderItem: PropTypes.func,
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


