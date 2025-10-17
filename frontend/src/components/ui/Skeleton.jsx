import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Animation for the skeleton loading effect
const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
`;

// Base skeleton element with common styles
const BaseSkeleton = styled.div`
  background-color: var(--skeleton-bg, #e0e0e0);
  border-radius: var(--skeleton-radius, 4px);
  animation: ${pulse} 1.5s ease-in-out infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    100% {
      left: 100%;
    }
  }

  /* Dark mode styles */
  [data-theme='dark'] & {
    background-color: var(--skeleton-dark-bg, #3a3a3a);
  }
`;

// Skeleton text component for text content
export const SkeletonText = styled(BaseSkeleton)`
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || '1rem'};
  margin: ${({ margin }) => margin || '0.5rem 0'};
`;

// Skeleton circle for avatars or icons
export const SkeletonCircle = styled(BaseSkeleton)`
  width: ${({ size }) => size || '2rem'};
  height: ${({ size }) => size || '2rem'};
  border-radius: 50%;
`;

// Skeleton rectangle for cards, buttons, or images
export const SkeletonRect = styled(BaseSkeleton)`
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || '200px'};
  margin: ${({ margin }) => margin || '0.5rem 0'};
`;

// Main component that renders the appropriate skeleton type
const Skeleton = ({ type, ...props }) => {
  switch (type) {
    case 'circle':
      return <SkeletonCircle {...props} />;
    case 'rect':
      return <SkeletonRect {...props} />;
    case 'text':
    default:
      return <SkeletonText {...props} />;
  }
};

Skeleton.propTypes = {
  type: PropTypes.oneOf(['text', 'circle', 'rect']),
  width: PropTypes.string,
  height: PropTypes.string,
  margin: PropTypes.string,
  size: PropTypes.string, // Used for circle type
};

Skeleton.defaultProps = {
  type: 'text',
};

export default Skeleton;