/**
 * @file LocalizedLink.jsx - مكون رابط متعدد اللغات
 * @module components/common/LocalizedLink
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useLocalizedLink } from '../../hooks/useLocalizedRouting';

/**
 * مكون رابط متعدد اللغات يدعم المسارات المترجمة
 *
 * @param {Object} props - خصائص المكون
 * @param {string} props.to - المسار الداخلي (غير المترجم)
 * @param {React.ReactNode} props.children - محتوى الرابط
 * @param {Object} props.rest - باقي خصائص مكون Link
 * @returns {React.ReactElement} رابط مترجم
 */
const LocalizedLink = ({ to, children, ...rest }) => {
  const localizedLink = useLocalizedLink();
  
  // إنشاء المسار المترجم
  const localizedTo = localizedLink(to);
  
  return (
    <Link to={localizedTo} {...rest}>
      {children}
    </Link>
  );
};

LocalizedLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default LocalizedLink;