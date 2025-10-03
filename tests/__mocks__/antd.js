// Clean mock for antd used in tests (no JSX)
import React from 'react';

// Minimal mock of antd components used by EnvironmentalDashboard
export const Card = ({ children }) => (children ? children : null);
export const Row = ({ children }) => (children ? children : null);
export const Col = ({ children }) => (children ? children : null);

const TabsComponent = ({ children }) => (children ? children : null);
// Provide static TabPane so `const { TabPane } = Tabs` works in components.
export const TabPane = ({ children }) => (children ? children : null);
TabsComponent.TabPane = TabPane;
export const Tabs = TabsComponent;

export const Spin = ({ children }) => (children ? children : null);
export const Alert = ({ children }) => (children ? children : null);
export const Button = ({ children }) => (children ? React.createElement('button', null, children) : null);

// Select often destructures Option: const { Option } = Select
const SelectComponent = ({ children }) => (children ? children : null);
export const Option = ({ children }) => (children ? children : null);
SelectComponent.Option = Option;
export const Select = SelectComponent;

export const Empty = ({ description }) => (description ? React.createElement('div', null, description) : null);

export default {
  Card,
  Row,
  Col,
  Tabs,
  TabPane,
  Spin,
  Alert,
  Button,
  Select,
  Option,
  Empty,
};
