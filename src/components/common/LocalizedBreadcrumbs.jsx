/**
 * @file LocalizedBreadcrumbs.jsx - مكون المسار الهيكلي متعدد اللغات
 * @module components/common/LocalizedBreadcrumbs
 */

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useTranslationNamespaces from '../../hooks/useTranslationNamespaces';
import { useLanguage } from '../../i18nSetup';
import { DirectionalFlow, useDirectionalStyles } from '../../utils/directionalHelpers';
import PropTypes from 'prop-types';

/**
 * مكون المسار الهيكلي متعدد اللغات
 * يعرض مسار التنقل الحالي مع دعم الترجمة وترتيب العناصر بناءً على اتجاه اللغة
 *
 * @param {Object} props - خصائص المكون
 * @param {Object} [props.routes] - كائن يحدد تعيين المسارات (URL path -> translation key)
 * @param {Object} [props.dynamicSegments] - كائن يحدد كيفية التعامل مع أجزاء URL الديناميكية
 * @param {boolean} [props.showHome=true] - ما إذا كان سيتم عرض رابط الصفحة الرئيسية
 * @param {string} [props.separator='/'] - الفاصل بين عناصر المسار
 * @param {Object} [props.styles={}] - أنماط CSS إضافية
 * @returns {React.ReactElement} مكون المسار الهيكلي
 */
const LocalizedBreadcrumbs = ({ 
  routes = {}, 
  dynamicSegments = {},
  showHome = true,
  separator = '/',
  styles = {}
}) => {
  const { t } = useTranslationNamespaces(['common', 'navigation']);
  const { isRTL } = useLanguage();
  const directionalStyles = useDirectionalStyles();
  const location = useLocation();
  
  // استخراج مكونات المسار وتحويلها إلى عناصر مسار هيكلي
  const breadcrumbs = useMemo(() => {
    // تقسيم المسار الحالي إلى أجزاء
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    
    // إضافة الصفحة الرئيسية إذا كانت مطلوبة
    const segments = showHome ? [''] : [];
    segments.push(...pathSegments);
    
    // تحويل أجزاء المسار إلى عناصر مسار هيكلي
    return segments.map((segment, index) => {
      // بناء المسار الحالي
      const path = index === 0 ? '/' : 
        `/${segments.slice(1, index + 1).join('/')}`;
      
      // التحقق مما إذا كان هذا الجزء ديناميكيًا
      const isDynamicSegment = segment && segment.startsWith(':');
      const dynamicPattern = isDynamicSegment ? 
        Object.keys(dynamicSegments).find(pattern => path.includes(pattern)) : null;
        
      // الحصول على مفتاح الترجمة
      let translationKey;
      if (index === 0 && showHome) {
        // الصفحة الرئيسية
        translationKey = 'navigation.home';
      } else if (dynamicPattern) {
        // جزء ديناميكي
        const dynamicHandler = dynamicSegments[dynamicPattern];
        if (typeof dynamicHandler === 'function') {
          translationKey = dynamicHandler(segment, path, location);
        } else if (typeof dynamicHandler === 'string') {
          translationKey = dynamicHandler;
        } else {
          translationKey = segment; // استخدام النص كما هو
        }
      } else {
        // جزء عادي
        translationKey = routes[path] || `navigation.${segment}`;
      }
      
      // هل هذا هو العنصر الأخير في المسار؟
      const isLast = index === segments.length - 1;
      
      // إنشاء عنصر المسار الهيكلي
      return (
        <React.Fragment key={path}>
          {index > 0 && (
            <span className="breadcrumb-separator" style={{ margin: '0 5px' }}>
              {separator}
            </span>
          )}
          {isLast ? (
            <span className="breadcrumb-current">
              {t(translationKey, segment)}
            </span>
          ) : (
            <Link to={path} className="breadcrumb-link">
              {t(translationKey, segment)}
            </Link>
          )}
        </React.Fragment>
      );
    });
  }, [location.pathname, showHome, routes, dynamicSegments, t, separator]);
  
  return (
    <nav 
      aria-label={t('navigation.breadcrumb', 'Breadcrumb')} 
      className="breadcrumbs-container"
      style={{
        padding: '10px 0',
        ...directionalStyles.direction(),
        ...styles
      }}
    >
      <DirectionalFlow>
        {breadcrumbs}
      </DirectionalFlow>
    </nav>
  );
};

LocalizedBreadcrumbs.propTypes = {
  /** كائن يحدد تعيين المسارات (URL path -> translation key) */
  routes: PropTypes.object,
  /** كائن يحدد كيفية التعامل مع أجزاء URL الديناميكية */
  dynamicSegments: PropTypes.object,
  /** ما إذا كان سيتم عرض رابط الصفحة الرئيسية */
  showHome: PropTypes.bool,
  /** الفاصل بين عناصر المسار */
  separator: PropTypes.node,
  /** أنماط CSS إضافية */
  styles: PropTypes.object
};

export default LocalizedBreadcrumbs;