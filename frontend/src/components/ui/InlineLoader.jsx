import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/fallback-ui.css';

/**
 * InlineLoader component displays a loading spinner with optional text
 * for use within UI elements or smaller containers
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader ('small', 'medium', 'large')
 * @param {string} props.message - Optional message to display
 * @param {boolean} props.centered - Whether to center the loader
 * @param {string} props.className - Additional CSS class
 * @param {React.CSSProperties} props.style - Additional inline styles
 */
const InlineLoader = ({
  size = 'medium',
  message,
  centered = false,
  className = '',
  style = {}
}) => {
  // Size mappings
  const sizeMap = {
    small: { spinner: '20px', fontSize: '0.75rem' },
    medium: { spinner: '30px', fontSize: '0.875rem' },
    large: { spinner: '40px', fontSize: '1rem' }
  };
  
  const { spinner, fontSize } = sizeMap[size] || sizeMap.medium;
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: centered ? 'center' : 'flex-start',
    padding: '0.5rem',
    ...style
  };
  
  return (
    <div 
      className={`inline-loader ${className}`}
      style={containerStyle}
      aria-busy="true"
      aria-live="polite"
    >
      <div 
        className="loading-spinner"
        role="status"
        style={{ 
          width: spinner, 
          height: spinner,
          marginRight: message ? '0.75rem' : 0,
          marginBottom: 0
        }}
      />
      
      {message && (
        <span 
          className="loading-text"
          style={{ fontSize }}
        >
          {message}
        </span>
      )}
    </div>
  );
};

InlineLoader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  centered: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
};

export default InlineLoader;