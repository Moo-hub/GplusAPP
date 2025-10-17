/**
 * @file useLocalizedRouting.js - خطافات للتوجيه متعدد اللغات
 * @module hooks/useLocalizedRouting
 */

import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '../i18nSetup';
import { getLocalizedPath, getInternalPath } from '../components/common/LocalizedRouter';

/**
 * خطاف للحصول على مسارات مترجمة وتنقل مناسب للغة
 *
 * @returns {Object} وظائف وحالة التوجيه المترجمة
 */
export const useLocalizedRouting = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // معالجة المسار الحالي للحصول على المسار الداخلي
  const currentInternalPath = useMemo(() => {
    // تخطي رمز اللغة في بداية المسار
    const pathWithoutLanguage = location.pathname
      .replace(new RegExp(`^/${language}`), '');
    
    return pathWithoutLanguage || '/';
  }, [location.pathname, language]);
  
  /**
   * التنقل إلى مسار مترجم
   *
   * @param {string} internalPath - المسار الداخلي القياسي
   * @param {Object} options - خيارات التنقل
   */
  const navigateTo = useCallback((internalPath, options = {}) => {
    const localizedPath = `/${language}${getLocalizedPath(internalPath, language)}`;
    navigate(localizedPath, options);
  }, [language, navigate]);
  
  /**
   * الحصول على المسار المترجم
   *
   * @param {string} internalPath - المسار الداخلي القياسي
   * @returns {string} المسار المترجم الكامل
   */
  const getFullLocalizedPath = useCallback((internalPath) => {
    return `/${language}${getLocalizedPath(internalPath, language)}`;
  }, [language]);
  
  /**
   * تغيير لغة المسار الحالي
   *
   * @param {string} newLanguage - رمز اللغة الجديدة
   */
  const changeRouteLanguage = useCallback((newLanguage) => {
    // الانتقال إلى نفس المسار ولكن بلغة مختلفة
    const newPath = `/${newLanguage}${getLocalizedPath(currentInternalPath, newLanguage)}`;
    
    // استخدام الانتقال المباشر بدلاً من إعادة التوجيه لتجنب إضافة سجل في تاريخ التصفح
    window.location.pathname = newPath;
  }, [currentInternalPath]);
  
  return {
    currentInternalPath,
    params,
    navigateTo,
    getFullLocalizedPath,
    changeRouteLanguage
  };
};

/**
 * خطاف لإنشاء روابط مترجمة
 *
 * @returns {Function} دالة لإنشاء مسار مترجم
 */
export const useLocalizedLink = () => {
  const { language } = useLanguage();
  
  /**
   * إنشاء رابط مترجم
   *
   * @param {string} internalPath - المسار الداخلي القياسي
   * @returns {string} المسار المترجم
   */
  const localizedLink = useCallback((internalPath) => {
    return `/${language}${getLocalizedPath(internalPath, language)}`;
  }, [language]);
  
  return localizedLink;
};

/**
 * خطاف للتعامل مع تغيير اللغة مع تحديث المسار
 *
 * @returns {Function} دالة لتغيير اللغة مع تحديث المسار
 */
export const useLanguageChanger = () => {
  const { changeLanguage } = useLanguage();
  const { changeRouteLanguage } = useLocalizedRouting();
  
  /**
   * تغيير اللغة وتحديث المسار
   *
   * @param {string} newLanguage - رمز اللغة الجديدة
   */
  const changeLanguageAndRoute = useCallback(async (newLanguage) => {
    // تغيير اللغة في i18n أولاً
    await changeLanguage(newLanguage);
    
    // ثم تحديث المسار
    changeRouteLanguage(newLanguage);
  }, [changeLanguage, changeRouteLanguage]);
  
  return changeLanguageAndRoute;
};

export default {
  useLocalizedRouting,
  useLocalizedLink,
  useLanguageChanger
};