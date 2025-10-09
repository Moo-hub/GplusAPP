import React, { createContext, useState, useContext, useEffect } from 'react';
import { lightTheme, darkTheme } from './theme';
import PropTypes from 'prop-types';

// Create theme context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Get stored theme or default to light
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' ? 'dark' : 'light';
  });
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
    
    // Apply theme colors to CSS variables
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Store theme choice
    localStorage.setItem('theme', theme);
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const themeData = theme === 'dark' ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeData }}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}