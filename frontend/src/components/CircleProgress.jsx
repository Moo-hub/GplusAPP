import PropTypes from "prop-types";
import "./CircleProgress.css";

export default function CircleProgress({ value, maxValue = 100, size = 120, strokeWidth = 8, color = "#38A169" }) {
  // Calculate the radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate the arc length
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  
  return (
    <div 
      className="circle-progress" 
      style={{ width: size, height: size }}
      data-testid="circle-progress"
    >
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          className="circle-bg"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className="circle-progress-indicator"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeWidth={strokeWidth}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            stroke: color
          }}
        />
      </svg>
      <div className="circle-text">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

CircleProgress.propTypes = {
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  color: PropTypes.string
};