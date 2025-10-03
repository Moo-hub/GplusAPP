import React from 'react';
import '../styles/responsive.css';

/**
 * ResponsiveWrapper component 
 * This component wraps the application to provide global responsive styles
 * It doesn't render any visible elements, it just ensures the responsive styles are loaded
 */
const ResponsiveWrapper = ({ children }) => {
  return <>{children}</>;
};

export default ResponsiveWrapper;