/**
 * Mobile device detection and responsive utilities
 * Use these functions to enhance mobile experience programmatically
 */

/**
 * Check if the current device is a mobile device
 * @returns {boolean} true if mobile device
 */
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Regular expression for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  
  return mobileRegex.test(userAgent.toLowerCase());
};

/**
 * Check if the device is in portrait orientation
 * @returns {boolean} true if portrait orientation
 */
export const isPortraitOrientation = () => {
  return window.matchMedia("(orientation: portrait)").matches;
};

/**
 * Check if the device has a notch (iPhone X and newer)
 * @returns {boolean} true if device likely has a notch
 */
export const hasNotch = () => {
  // iOS detection for notch
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (!iOS) return false;
  
  // Check for iOS version or device with notch
  const ratio = window.devicePixelRatio || 1;
  const screen = {
    width: window.screen.width * ratio,
    height: window.screen.height * ratio
  };
  
  // iPhone X and newer have specific resolutions
  return (
    (screen.width === 1125 && screen.height === 2436) || // iPhone X, XS
    (screen.width === 828 && screen.height === 1792) ||  // iPhone XR
    (screen.width === 1242 && screen.height === 2688) || // iPhone XS Max
    (screen.width === 1170 && screen.height === 2532) || // iPhone 12, 12 Pro
    (screen.width === 1284 && screen.height === 2778) || // iPhone 12 Pro Max
    (screen.width === 1080 && screen.height === 2340)    // iPhone 12 mini
  );
};

/**
 * Add appropriate CSS classes based on the device
 */
export const applyDeviceClasses = () => {
  const html = document.documentElement;
  
  if (isMobileDevice()) {
    html.classList.add('is-mobile');
    
    if (isPortraitOrientation()) {
      html.classList.add('is-portrait');
      html.classList.remove('is-landscape');
    } else {
      html.classList.add('is-landscape');
      html.classList.remove('is-portrait');
    }
    
    if (hasNotch()) {
      html.classList.add('has-notch');
    }
  } else {
    html.classList.add('is-desktop');
  }
};

/**
 * Listen for orientation changes
 * @param {function} callback Function to call when orientation changes
 */
export const addOrientationChangeListener = (callback) => {
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure DOM is ready after orientation change
    setTimeout(() => {
      const isPortrait = isPortraitOrientation();
      callback({
        isPortrait,
        isLandscape: !isPortrait
      });
      
      applyDeviceClasses();
    }, 100);
  });
  
  // Initialize on first load
  applyDeviceClasses();
};

/**
 * Get viewport dimensions accounting for mobile quirks
 * @returns {Object} viewport width and height
 */
export const getViewportDimensions = () => {
  // Use visual viewport API if available (handles mobile virtual keyboards better)
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height
    };
  }
  
  // Fallback to standard viewport measurements
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
};

/**
 * Check if element is fully in viewport
 * @param {HTMLElement} element DOM element to check
 * @returns {boolean} true if fully in viewport
 */
export const isElementInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  const viewport = getViewportDimensions();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  );
};

// Initialize device classes on script load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', applyDeviceClasses);
  window.addEventListener('resize', applyDeviceClasses);
}