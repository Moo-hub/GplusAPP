import React from 'react';
import i18next from 'i18next';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // يمكن تسجيل الخطأ هنا
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>{i18next.t('error.title', { ns: 'environmental' })}</h2>
          <p>{i18next.t('error.message', { ns: 'environmental', defaultValue: i18next.t('error.title', { ns: 'environmental' }) })}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 12px', cursor: 'pointer' }}
            aria-label={i18next.t('error.retry', { ns: 'environmental' })}
          >
            {i18next.t('error.retry', { ns: 'environmental' })}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
