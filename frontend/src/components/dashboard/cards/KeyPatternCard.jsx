import React from 'react';
import useSafeTranslation from '../../../hooks/useSafeTranslation';
import './Cards.css';

const KeyPatternCard = ({ data }) => {
  const { t } = useSafeTranslation();
  
  if (!data) {
    return (
      <div className="metric-card skeleton" data-testid="key-pattern-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }
  
  // Extract and sort key patterns by memory usage
  const patterns = Object.entries(data.patterns || {})
    .map(([pattern, size]) => ({ pattern, size }))
    .sort((a, b) => b.size - a.size);
  
  // Calculate total size
  const totalSize = patterns.reduce((sum, { size }) => sum + size, 0);
  
  // Format pattern name for display
  const formatPattern = (pattern) => {
    // Replace typical Redis patterns with more readable names
    if (pattern === 'cache:*') return 'General Cache';
    if (pattern === 'security:event:*') return 'Security Events';
    if (pattern === 'security:ip:*') return 'IP Security Tracking';
    if (pattern === 'security:user:*') return 'User Security Tracking';
    if (pattern === 'session:*') return 'User Sessions';
    if (pattern === 'token:*') return 'Auth Tokens';
    
    // Otherwise just return the pattern
    return pattern;
  };
  
  return (
    <div className="metric-card" data-testid="key-pattern-card">
      <h3>{t('dashboard.redisKeyUsage')}</h3>
      
      <div className="key-patterns-chart" data-testid="key-patterns-chart">
        {patterns.map((item, index) => {
          // Calculate percentage
          const percentage = totalSize > 0 ? (item.size / totalSize * 100) : 0;
          
          // Generate a color based on index
          const hue = (index * 40) % 360;
          const color = `hsl(${hue}, 70%, 60%)`;
          
          return (
            <div key={index} className="key-pattern-bar" data-testid={`key-pattern-bar-${index}`}>
              <div className="key-pattern-label">
                <span data-testid={`key-pattern-name-${index}`}>{formatPattern(item.pattern)}</span>
                <span className="key-pattern-size" data-testid={`key-pattern-size-${index}`}>{item.size} MB</span>
              </div>
              <div className="key-pattern-progress">
                <div 
                  className="key-pattern-fill" 
                  data-testid={`key-pattern-fill-${index}`}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="key-patterns-summary" data-testid="key-patterns-summary">
        <div className="summary-item">
          <span className="summary-label">{t('dashboard.totalKeyPatterns')}:</span>
          <span className="summary-value" data-testid="total-patterns-count">{patterns.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{t('dashboard.totalMemoryUsed')}:</span>
          <span className="summary-value" data-testid="total-memory-used">{totalSize.toFixed(1)} MB</span>
        </div>
      </div>
    </div>
  );
};

export default KeyPatternCard;