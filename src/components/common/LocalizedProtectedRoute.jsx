/**
 * @file LocalizedProtectedRoute.jsx - مكون للصفحات المحمية متعددة اللغات
 * @module components/common/LocalizedProtectedRoute
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useLocalizedLink } from '../../hooks/useLocalizedRouting';

/**
 * مكون للصفحات المحمية متعددة اللغات
 * يتحقق من حالة تسجيل الدخول ويعيد توجيه المستخدم إذا لم يكن مسجلاً
 *
 * @param {Object} props - خصائص المكون
 * @param {boolean} props.isAuthenticated - ما إذا كان المستخدم مسجل الدخول
 * @param {React.ReactNode} props.children - محتوى الصفحة المحمية
 * @param {string} [props.redirectTo='/login'] - مسار إعادة التوجيه للمستخدمين غير المسجلين
 * @returns {React.ReactElement} محتوى الصفحة المحمية أو إعادة توجيه
 */
const LocalizedProtectedRoute = ({
  isAuthenticated,
  children,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const localizedLink = useLocalizedLink();
  
  if (!isAuthenticated) {
    // إعادة توجيه إلى صفحة تسجيل الدخول مع حفظ المسار الحالي
    return (
      <Navigate
        to={localizedLink(redirectTo)}
        state={{ from: location.pathname }}
        replace
      />
    );
  }
  
  return children;
};

LocalizedProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string,
};

export default LocalizedProtectedRoute;