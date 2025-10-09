/**
 * @file LocalizedRouter.jsx - مكون توجيه متعدد اللغات
 * @module components/common/LocalizedRouter
 */

import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useLanguage } from '../../i18nSetup';
import { LANGUAGE_CONSTANTS } from '../../constants/i18n';

/**
 * خريطة المسارات المترجمة حسب اللغة
 * يمكن استبدالها بنظام ديناميكي لاستيراد الترجمات من ملفات خارجية
 */
const ROUTE_MAPPINGS = {
  en: {
    '/': '/',
    '/login': '/login',
    '/register': '/register',
    '/dashboard': '/dashboard',
    '/products': '/products',
    '/products/:id': '/products/:id',
    '/about': '/about',
    '/contact': '/contact',
    '/settings': '/settings',
    '/profile': '/profile',
  },
  ar: {
    '/': '/',
    '/login': '/تسجيل-دخول',
    '/register': '/إنشاء-حساب',
    '/dashboard': '/لوحة-التحكم',
    '/products': '/المنتجات',
    '/products/:id': '/المنتجات/:id',
    '/about': '/من-نحن',
    '/contact': '/اتصل-بنا',
    '/settings': '/الإعدادات',
    '/profile': '/الملف-الشخصي',
  }
};

/**
 * يحول المسار من اللغة الحالية إلى المسار الداخلي القياسي
 *
 * @param {string} path - المسار المترجم
 * @param {string} language - رمز اللغة
 * @returns {string} المسار القياسي الداخلي
 */
const getInternalPath = (path, language) => {
  // تفكيك المسار إلى أجزاء لمعالجة المعلمات الديناميكية
  const pathSegments = path.split('/').filter(Boolean);
  
  // تحويل المسار من الإصدار المترجم إلى المسار الداخلي
  const mapping = ROUTE_MAPPINGS[language] || {};
  
  // البحث عن مسار مطابق في ROUTE_MAPPINGS
  for (const [internalPath, translatedPath] of Object.entries(mapping)) {
    // معالجة المسارات الثابتة
    if (translatedPath === `/${pathSegments.join('/')}`) {
      return internalPath;
    }
    
    // معالجة المسارات الديناميكية
    if (translatedPath.includes(':')) {
      const translatedSegments = translatedPath.split('/').filter(Boolean);
      
      if (pathSegments.length === translatedSegments.length) {
        let isMatch = true;
        const params = {};
        
        for (let i = 0; i < translatedSegments.length; i++) {
          if (translatedSegments[i].startsWith(':')) {
            // استخراج اسم المعلمة
            const paramName = translatedSegments[i].substring(1);
            params[paramName] = pathSegments[i];
          } else if (translatedSegments[i] !== pathSegments[i]) {
            isMatch = false;
            break;
          }
        }
        
        if (isMatch) {
          // بناء المسار الداخلي مع المعلمات
          let resultPath = internalPath;
          for (const [param, value] of Object.entries(params)) {
            resultPath = resultPath.replace(`:${param}`, value);
          }
          return resultPath;
        }
      }
    }
  }
  
  // إذا لم يتم العثور على مطابقة، إرجاع المسار الأصلي
  return `/${pathSegments.join('/')}`;
};

/**
 * يحول المسار الداخلي إلى المسار المترجم بلغة المستخدم
 *
 * @param {string} internalPath - المسار الداخلي القياسي
 * @param {string} language - رمز اللغة المطلوب
 * @returns {string} المسار المترجم
 */
const getLocalizedPath = (internalPath, language) => {
  // استخدام المسار الداخلي بشكل افتراضي
  if (!language || !ROUTE_MAPPINGS[language]) {
    return internalPath;
  }
  
  // إذا كان المسار يتضمن معلمات ديناميكية، نقوم باستبدالها
  if (internalPath.includes(':')) {
    const internalTemplate = Object.keys(ROUTE_MAPPINGS[language]).find(
      template => {
        const templateParts = template.split('/');
        const pathParts = internalPath.split('/');
        
        if (templateParts.length !== pathParts.length) {
          return false;
        }
        
        for (let i = 0; i < templateParts.length; i++) {
          if (templateParts[i].startsWith(':')) {
            continue; // تخطي المعلمات
          }
          
          if (templateParts[i] !== pathParts[i]) {
            return false;
          }
        }
        
        return true;
      }
    );
    
    if (internalTemplate) {
      const translatedTemplate = ROUTE_MAPPINGS[language][internalTemplate];
      const templateParts = internalTemplate.split('/');
      const pathParts = internalPath.split('/');
      
      let result = translatedTemplate;
      
      for (let i = 0; i < templateParts.length; i++) {
        if (templateParts[i].startsWith(':')) {
          const paramName = templateParts[i].substring(1);
          result = result.replace(`:${paramName}`, pathParts[i]);
        }
      }
      
      return result;
    }
  }
  
  // البحث عن المسار المطابق
  return ROUTE_MAPPINGS[language][internalPath] || internalPath;
};

/**
 * مكون توجيه متعدد اللغات يعالج المسارات المترجمة
 *
 * @param {Object} props - خصائص المكون
 * @param {React.ReactNode} props.children - مكونات الطرق
 * @returns {React.ReactElement} مكون التوجيه
 */
const LocalizedRouter = ({ children }) => {
  const { language } = useLanguage();
  
  // تحويل المسارات الداخلية إلى المسارات المترجمة
  const routes = useMemo(() => {
    // يمكن أن يكون هنا منطق إنشاء المسارات ديناميكيًا
    // في هذا المثال، نفترض أن الأطفال يحتوون على مكونات Route
    return children;
  }, [children]);
  
  return (
    <BrowserRouter>
      <Routes>
        {/* مسار إعادة توجيه الجذر ليشمل اللغة في المسار */}
        <Route
          path="/"
          element={<Navigate to={`/${language}`} />}
        />
        
        {/* مسارات للغة المحددة */}
        <Route path={`/${language}/*`} element={routes} />
        
        {/* إعادة توجيه لجميع المسارات الأخرى إلى المسارات المترجمة بلغة المستخدم */}
        <Route
          path="*"
          element={
            <LanguageRedirect
              getInternalPath={getInternalPath}
              getLocalizedPath={getLocalizedPath}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * مكون إعادة توجيه لمعالجة تحويل المسارات بين اللغات
 */
const LanguageRedirect = ({ getInternalPath, getLocalizedPath }) => {
  const { language } = useLanguage();
  const currentPath = window.location.pathname;
  
  // استخراج رمز اللغة من المسار (إذا كان موجودًا)
  const pathParts = currentPath.split('/').filter(Boolean);
  const firstPart = pathParts[0];
  
  // التحقق مما إذا كان الجزء الأول هو رمز لغة صالح
  const isLanguageCode = LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.includes(firstPart);
  
  if (isLanguageCode) {
    // إذا كانت اللغة في المسار مختلفة عن اللغة الحالية، قم بتغيير اللغة
    if (firstPart !== language) {
      // هنا يمكننا تغيير اللغة، لكننا سنكتفي بإعادة التوجيه في هذا المثال
      return <Navigate to={`/${language}${currentPath.substring(3)}`} replace />;
    }
    
    // إذا كانت نفس اللغة، لا نحتاج لإعادة التوجيه
    return <Navigate to={currentPath} replace />;
  } else {
    // المسار لا يبدأ برمز لغة، تحويل المسار إلى النسخة المترجمة
    const internalPath = getInternalPath(currentPath, language);
    const localizedPath = `/${language}${getLocalizedPath(internalPath, language)}`;
    
    return <Navigate to={localizedPath} replace />;
  }
};

LocalizedRouter.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LocalizedRouter;
export { getLocalizedPath, getInternalPath };