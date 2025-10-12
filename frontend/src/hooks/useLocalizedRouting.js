import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './useLanguage';

// Definition of route mappings for each language
// The key is the internal route, and the value is the localized route
const ROUTE_MAPPINGS = {
  en: {
    '/': '/',
    '/login': '/login',
    '/register': '/register',
    '/dashboard': '/dashboard',
    '/profile': '/profile',
    '/settings': '/settings',
    '/products': '/products',
    '/products/:id': '/products/:id',
    '/about': '/about',
    '/contact': '/contact',
  },
  ar: {
    '/': '/',
    '/login': '/تسجيل-دخول',
    '/register': '/إنشاء-حساب',
    '/dashboard': '/لوحة-التحكم',
    '/profile': '/الملف-الشخصي',
    '/settings': '/الإعدادات',
    '/products': '/المنتجات',
    '/products/:id': '/المنتجات/:id',
    '/about': '/من-نحن',
    '/contact': '/اتصل-بنا',
  }
};

/**
 * Converts a path with parameters (like /products/:id) to a regex pattern
 * @param {string} path - Path pattern with parameters
 * @returns {RegExp} - Regex for matching the path
 */
const pathToRegex = (path) => {
  // Replace :paramName with a capture group
  const pattern = path.replace(/:[^/]+/g, '([^/]+)');
  // Escape special characters and create a RegExp
  const escapedPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.');
  return new RegExp(`^${escapedPattern}$`);
};

/**
 * Extract parameter names from a path pattern
 * @param {string} path - Path pattern with parameters
 * @returns {string[]} - Array of parameter names
 */
const extractParamNames = (path) => {
  const paramNames = [];
  const matches = path.match(/:[^/]+/g);
  if (matches) {
    matches.forEach((match) => {
      paramNames.push(match.substring(1)); // Remove the leading ':'
    });
  }
  return paramNames;
};

/**
 * Create a path with parameter values
 * @param {string} path - Path pattern with parameters
 * @param {Object} params - Parameter values
 * @returns {string} - Path with parameter values
 */
const createPathWithParams = (path, params) => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};

/**
 * Main hook for handling localized routing
 * @returns {Object} - Object with localized routing utilities
 */
export const useLocalizedRouting = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();
  
  /**
   * Get the current internal path (without language prefix)
   */
  const currentInternalPath = useMemo(() => {
    // First, remove language prefix if present
    const path = location.pathname;
    const pathWithoutLang = path.replace(/^\/(en|ar)/, '');
    
    // Check if the path is a localized path
    for (const [internalPath, localizedPath] of Object.entries(ROUTE_MAPPINGS[language])) {
      // Convert both paths to regex to match with parameters
      const internalRegex = pathToRegex(internalPath);
      const localizedRegex = pathToRegex(localizedPath);
      
      if (localizedRegex.test(pathWithoutLang)) {
        return internalPath;
      }
    }
    
    // If not found as a localized path, return as is (might be an internal path already)
    return pathWithoutLang;
  }, [location.pathname, language]);
  
  /**
   * Get the parameter values from the current URL
   */
  const params = useMemo(() => {
    return { ...routeParams };
  }, [routeParams]);

  /**
   * Navigate to an internal path, which will be converted to a localized path
   */
  const navigateTo = useCallback((internalPath, params = {}, options = {}) => {
    let targetPath = ROUTE_MAPPINGS[language][internalPath] || internalPath;
    
    // Replace parameters in the path
    targetPath = createPathWithParams(targetPath, params);
    
    // Add language prefix
    const localizedPath = `/${language}${targetPath === '/' ? '' : targetPath}`;
    
    navigate(localizedPath, options);
  }, [language, navigate]);

  /**
   * Get the full localized path (with language prefix) for an internal path
   */
  const getFullLocalizedPath = useCallback((internalPath, params = {}) => {
    let targetPath = ROUTE_MAPPINGS[language][internalPath] || internalPath;
    
    // Replace parameters in the path
    targetPath = createPathWithParams(targetPath, params);
    
    // Add language prefix
    return `/${language}${targetPath === '/' ? '' : targetPath}`;
  }, [language]);

  /**
   * Change the language while keeping the current route
   */
  const changeRouteLanguage = useCallback((newLanguage) => {
    const currentLocalizedPath = getFullLocalizedPath(currentInternalPath, params);
    const newPath = currentLocalizedPath.replace(`/${language}`, `/${newLanguage}`);
    navigate(newPath);
  }, [currentInternalPath, getFullLocalizedPath, language, navigate, params]);

  return {
    currentInternalPath,
    params,
    navigateTo,
    getFullLocalizedPath,
    changeRouteLanguage,
  };
};

/**
 * Hook for creating localized links
 * @returns {Function} - Function to create localized links
 */
export const useLocalizedLink = () => {
  const { getFullLocalizedPath } = useLocalizedRouting();
  
  return useCallback((to, params = {}) => {
    return getFullLocalizedPath(to, params);
  }, [getFullLocalizedPath]);
};

/**
 * Hook for changing language while preserving the current route
 * @returns {Function} - Function to change language
 */
export const useLanguageChanger = () => {
  const { changeRouteLanguage } = useLocalizedRouting();
  const { i18n } = useTranslation();
  
  return useCallback((newLanguage) => {
    // Change i18n language
    i18n.changeLanguage(newLanguage);
    
    // Update the route with new language
    changeRouteLanguage(newLanguage);
  }, [changeRouteLanguage, i18n]);
};

export default useLocalizedRouting;