// Browser Compatibility Utilities - Simplified Version

/**
 * Check for Safari browser
 */
export const isSafari = () => {
  try {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua);
  } catch (e) {
    return false;
  }
};

/**
 * Check for Firefox browser
 */
export const isFirefox = () => {
  try {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  } catch (e) {
    return false;
  }
};

/**
 * Initialize all compatibility fixes - Safe version
 */
export const initCompatibilityFixes = () => {
  try {
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try { require('./logger').debug('🔧 Compatibility fixes initialized'); } catch (e) { void e; }
      });
    } else {
      try { require('./logger').debug('🔧 Compatibility fixes initialized'); } catch (e) { void e; }
    }
    
    // Add CSS class for browser detection
    const html = document.documentElement;
    if (isSafari()) {
      html.classList.add('safari');
    }
    if (isFirefox()) {
      html.classList.add('firefox');
    }
  } catch (error) {
    try { require('./logger').warn('Compatibility fixes failed:', error); } catch (e) { void e; }
  }
};