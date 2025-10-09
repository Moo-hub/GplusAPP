import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { usePreferences } from './PreferencesContext';

/**
 * ThemeContext - Context for theme management
 */
const ThemeContext = createContext({
  currentTheme: 'light',
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

/**
 * ThemeProvider - Component that provides theme management
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} ThemeProvider component
 */
export const ThemeProvider = ({ children }) => {
  const { preferences, setPreference, getEffectiveTheme } = usePreferences();
  const currentTheme = getEffectiveTheme();
  const isDarkMode = currentTheme === 'dark';
  
  // Apply theme to document when it changes
  useEffect(() => {
    const html = document.documentElement;
    
    // Remove previous theme classes
    html.classList.remove('light-theme', 'dark-theme');
    
    // Add current theme class
    html.classList.add(`${currentTheme}-theme`);
    
    // Update data-theme attribute
    html.setAttribute('data-theme', currentTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        currentTheme === 'dark' ? '#121212' : '#ffffff'
      );
    }
  }, [currentTheme]);
  
  // Set up system theme change listener
  useEffect(() => {
    if (preferences.ui.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Force re-render when system preference changes
      setPreference('ui.theme', 'system');
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } 
    // Safari < 14
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      // Modern browsers
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } 
      // Safari < 14
      else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [preferences.ui.theme, setPreference]);
  
  /**
   * Toggle between light and dark theme
   */
  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setPreference('ui.theme', newTheme);
  }, [currentTheme, setPreference]);
  
  /**
   * Set theme to specific value
   * 
   * @param {string} theme - Theme to set ('light', 'dark', or 'system')
   */
  const setTheme = useCallback((theme) => {
    if (['light', 'dark', 'system'].includes(theme)) {
      setPreference('ui.theme', theme);
    } else {
      console.error(`Invalid theme: ${theme}. Must be 'light', 'dark', or 'system'.`);
    }
  }, [setPreference]);
  
  const contextValue = {
    currentTheme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * 
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;