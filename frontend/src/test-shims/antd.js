// Lightweight antd shim for tests - only exports the small components used in our app
// Keep this minimal to avoid pulling the real antd into Vitest workers which may
// not be installed in all environments. Add exports as tests need them.
import React from 'react';

export const Card = ({ children, className, ...props }) => (
  React.createElement('div', { className: className || 'ant-card', ...props }, children)
);
export const Row = ({ children, ...props }) => React.createElement('div', { className: 'ant-row', ...props }, children);
export const Col = ({ children, ...props }) => React.createElement('div', { className: 'ant-col', ...props }, children);
export const Tabs = ({ children, ...props }) => React.createElement('div', { className: 'ant-tabs', ...props }, children);
export const Spin = ({ children, ...props }) => React.createElement('div', { className: 'ant-spin', ...props }, children);
export const Alert = ({ children, ...props }) => React.createElement('div', { className: 'ant-alert', ...props }, children);
export const Select = ({ children, ...props }) => React.createElement('select', { ...props }, children);
export const Empty = ({ children, ...props }) => React.createElement('div', { className: 'ant-empty', ...props }, children);

// default export to mimic antd namespace
export default {
  Card, Row, Col, Tabs, Spin, Alert, Select, Empty
};
