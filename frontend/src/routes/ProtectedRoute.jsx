import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, requireAuth = true }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // أثناء التحميل، عرض شاشة تحميل
  if (loading) {
    return <div className="loading-container">جاري التحميل...</div>;
  }

  // في حالة الحاجة للمصادقة ولكن المستخدم غير مسجل
  if (requireAuth && !isAuthenticated) {
    // حفظ المسار الذي كان يحاول الوصول إليه
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // في حالة عدم الحاجة للمصادقة ولكن المستخدم مسجل بالفعل (مثل صفحات تسجيل الدخول)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/points" replace />;
  }

  // الحالة الطبيعية - عرض المحتوى
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAuth: PropTypes.bool
};