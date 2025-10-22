import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES = {
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    categories: {
      pointsActivity: true,
      pickupReminders: true,
      promotionalOffers: false,
      systemAnnouncements: true
    }
  },
  ui: {
    theme: 'system', // 'light', 'dark', or 'system'
    compactMode: false,
    animationsEnabled: true,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h' // '12h' or '24h'
  },
  language: 'en', // Default language
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false
  },
  privacy: {
    shareUsageData: true,
    locationTracking: false
  }
};

/**
 * PreferencesContext - Context for user preferences and settings
 */
const PreferencesContext = createContext({
  preferences: DEFAULT_PREFERENCES,
  setPreference: () => {},
  resetPreferences: () => {}
});

/**
 * PreferencesProvider - Component that provides user preferences throughout the application
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} PreferencesProvider component
 */
export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    // Try to load preferences from localStorage on initial render
    try {
      const storedPreferences = localStorage.getItem('userPreferences');
      return storedPreferences 
        ? { ...DEFAULT_PREFERENCES, ...JSON.parse(storedPreferences) } 
        : DEFAULT_PREFERENCES;
    } catch (error) {
        const { error: loggerError } = require('../utils/logger');
        loggerError('Error loading preferences from localStorage:', error);
      return DEFAULT_PREFERENCES;
    }
  });
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      const { error: loggerError } = require('../utils/logger');
      loggerError('Error saving preferences to localStorage:', error);
    }
  }, [preferences]);
  
  /**
   * Update a specific preference
   * 
   * @param {string} path - Dot notation path to the preference (e.g., 'ui.theme')
   * @param {any} value - New value for the preference
   */
  const setPreference = (path, value) => {
    setPreferences(prev => {
      // Split the path into parts (e.g., 'ui.theme' => ['ui', 'theme'])
      const pathParts = path.split('.');
      
      // Create a deep copy of the previous preferences
      const newPreferences = JSON.parse(JSON.stringify(prev));
      
      // Navigate to the correct level in the preferences object
      let current = newPreferences;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Set the value at the final level
      current[pathParts[pathParts.length - 1]] = value;
      
      return newPreferences;
    });
  };
  
  /**
   * Reset all preferences to default values
   */
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };
  
  /**
   * Reset a specific preference category to default values
   * 
   * @param {string} category - Category to reset (e.g., 'ui', 'notifications')
   */
  const resetCategory = (category) => {
    if (DEFAULT_PREFERENCES[category]) {
      setPreferences(prev => ({
        ...prev,
        [category]: DEFAULT_PREFERENCES[category]
      }));
    }
  };
  
  /**
   * Get effective theme based on system preference and user settings
   */
  const getEffectiveTheme = () => {
    const { theme } = preferences.ui;
    
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    
    return theme;
  };
  
  const contextValue = {
    preferences,
    setPreference,
    resetPreferences,
    resetCategory,
    getEffectiveTheme
  };
  
  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};

/**
 * Custom hook to use the preferences context
 * 
 * @returns {Object} Preferences context value
 */
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  
  return context;
};

export default PreferencesContext;