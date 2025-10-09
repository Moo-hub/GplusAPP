import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CollapsibleSection.css';

/**
 * Accessible collapsible section component
 * - Follows WAI-ARIA Accordion pattern
 * - Supports keyboard navigation
 * - Provides appropriate ARIA attributes
 * - Handles focus management
 */
const CollapsibleSection = ({
  title,
  children,
  id,
  initialExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const contentRef = useRef(null);
  const buttonId = `${id}-header`;
  const contentId = `${id}-content`;
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Focus management: when closing, focus returns to the header button
  useEffect(() => {
    if (!isExpanded) {
      document.getElementById(buttonId)?.focus();
    }
  }, [isExpanded, buttonId]);
  
  return (
    <div className={`collapsible-section ${className}`}>
      <h3>
        <button
          id={buttonId}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="collapsible-header"
          onClick={toggleExpanded}
        >
          <span className="collapsible-title">{title}</span>
          <span 
            className={`collapsible-icon ${isExpanded ? 'expanded' : ''}`}
            aria-hidden="true"
          >
            {isExpanded ? '−' : '+'}
          </span>
        </button>
      </h3>
      
      <div
        id={contentId}
        ref={contentRef}
        role="region"
        aria-labelledby={buttonId}
        className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  initialExpanded: PropTypes.bool,
  className: PropTypes.string,
};

export default CollapsibleSection;