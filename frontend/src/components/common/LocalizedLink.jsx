import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useLocalizedLink } from '../../hooks/useLocalizedRouting';

/**
 * LocalizedLink Component
 * 
 * A wrapper around React Router's Link component that automatically
 * handles path localization and language prefixing.
 * 
 * @param {Object} props - Component props
 * @param {string} props.to - The internal (non-localized) path to link to
 * @param {Object} props.params - Optional parameters for dynamic routes
 * @param {ReactNode} props.children - Child components/elements
 * @returns {ReactElement} The localized link component
 */
const LocalizedLink = ({ to, params = {}, children, ...rest }) => {
  const localizedLink = useLocalizedLink();
  
  // Create localized path with language prefix
  const localizedTo = localizedLink(to, params);
  
  return (
    <Link to={localizedTo} {...rest}>
      {children}
    </Link>
  );
};

LocalizedLink.propTypes = {
  to: PropTypes.string.isRequired,
  params: PropTypes.object,
  children: PropTypes.node.isRequired
};

LocalizedLink.defaultProps = {
  params: {}
};

export default LocalizedLink;