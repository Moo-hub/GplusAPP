import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './GenericScreen.css';

export default function GenericScreen({ 
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
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error');
      setData(null);
    } finally {
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

GenericScreen.propTypes = {
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


