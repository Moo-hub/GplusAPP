import React from 'react';

// Minimal mock for recharts components used in EnvironmentalDashboard
export const BarChart = ({ children }) => children || null;
export const Bar = ({ children }) => children || null;
export const LineChart = ({ children }) => children || null;
export const Line = ({ children }) => children || null;
export const PieChart = ({ children }) => children || null;
export const Pie = ({ children }) => children || null;
export const XAxis = () => null;
export const YAxis = () => null;
export const CartesianGrid = () => null;
export const Tooltip = () => null;
export const Legend = () => null;
// Make ResponsiveContainer render a wrapper with a stable test id so tests can
// reliably assert its presence without relying on real recharts rendering.
export const ResponsiveContainer = ({ children }) => React.createElement('div', { 'data-testid': 'mock-responsive-container' }, children || null);

export default {};
