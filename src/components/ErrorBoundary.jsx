import React from 'react';

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
          <h2>حدث خطأ غير متوقع في لوحة البيئة.</h2>
          <p>يمكنك إعادة المحاولة لإعادة تحميل الواجهة.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', cursor: 'pointer' }}>
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
