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
      return <h2>حدث خطأ غير متوقع في لوحة البيئة.</h2>;
    }
    return this.props.children;
  }
}
