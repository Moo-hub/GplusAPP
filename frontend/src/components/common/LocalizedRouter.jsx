import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocalizedRouting } from '../../hooks/useLocalizedRouting';

/**
 * LocalizedRouter Component
 * 
 * A wrapper component that handles internationalized routing by:
 * 1. Intercepting navigation to add language prefixes
 * 2. Redirecting root paths to language-prefixed paths
 * 3. Translating paths based on current language
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components (usually Routes)
 * @returns {ReactElement} The localized router component
 */
const LocalizedRouter = ({ children }) => {
  const { language, supportedLanguages } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentInternalPath, params, getFullLocalizedPath } = useLocalizedRouting();
  
  useEffect(() => {
    // Handle root path - redirect to language-prefixed path
    if (location.pathname === '/') {
      navigate(`/${language}`);
      return;
    }
    
    // Check if the path already has a language prefix
    const pathParts = location.pathname.split('/');
    const potentialLang = pathParts[1];
    
    // If the path doesn't have a valid language prefix, add one
    if (potentialLang && supportedLanguages.includes(potentialLang)) {
      return; // Path already has a valid language prefix
    }
    
    // Add language prefix to the current path
    const localizedPath = getFullLocalizedPath(currentInternalPath, params);
    navigate(localizedPath, { replace: true });
  }, [currentInternalPath, language, location.pathname, navigate, params, getFullLocalizedPath, supportedLanguages]);
  
  return <>{children}</>;
};

export default LocalizedRouter;