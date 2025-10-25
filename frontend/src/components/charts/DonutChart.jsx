import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './DonutChart.css';

export default function DonutChart({ data, size = 200, thickness = 40, colors }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    
    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;
    
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Draw the donut chart
    let startAngle = -0.5 * Math.PI; // Start at the top
    
    data.forEach((segment, index) => {
      const segmentAngle = (segment.value / total) * (2 * Math.PI);
      
      // Use provided colors or generate one
      const segmentColor = colors && colors[index] ? colors[index] : 
        `hsl(${(index * 360 / data.length) % 360}, 70%, 60%)`;
      
      // Draw segment
      ctx.beginPath();
      ctx.arc(
        size / 2, // x
        size / 2, // y
        size / 2 - 10, // outer radius
        startAngle, // start angle
        startAngle + segmentAngle // end angle
      );
      
      // Draw inner circle to create donut
      ctx.arc(
        size / 2, // x
        size / 2, // y
        size / 2 - thickness, // inner radius
        startAngle + segmentAngle, // end angle
        startAngle, // start angle
        true // counter-clockwise
      );
      
      ctx.closePath();
      ctx.fillStyle = segmentColor;
      ctx.fill();
      
      // Update start angle for next segment
      startAngle += segmentAngle;
    });
    
    // Draw center text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--color-text');
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(total.toString(), size / 2, size / 2);
    
  }, [data, size, thickness, colors]);
  
  return (
    <div className="donut-chart-container" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} />
      <div className="donut-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <span 
              className="legend-color" 
              style={{ 
                backgroundColor: colors && colors[index] ? 
                  colors[index] : 
                  `hsl(${(index * 360 / data.length) % 360}, 70%, 60%)`
              }}
            ></span>
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

DonutChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  size: PropTypes.number,
  thickness: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string)
};