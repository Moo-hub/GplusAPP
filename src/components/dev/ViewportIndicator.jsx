import React, { useState, useEffect } from 'react';

/**
 * ViewportIndicator - A development component that shows the current viewport size
 * This helps with responsive design testing. Should be removed or disabled in production.
 */
const ViewportIndicator = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Define breakpoint names
  const getBreakpointName = (width) => {
    if (width < 480) return 'xs (mobile)';
    if (width < 768) return 'sm (mobile)';
    if (width < 992) return 'md (tablet)';
    if (width < 1200) return 'lg (desktop)';
    return 'xl (large desktop)';
  };
  
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') return null;
  
  // Set position based on document direction
  const isRTL = document.dir === 'rtl';
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: isRTL ? 'auto' : '10px',
        left: isRTL ? '10px' : 'auto',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace'
      }}
      aria-hidden="true" // Hide from screen readers as this is only for visual debugging
      role="presentation"
    >
      {dimensions.width}px × {dimensions.height}px | {getBreakpointName(dimensions.width)}
    </div>
  );
};

export default ViewportIndicator;