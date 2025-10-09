import React from 'react';

// Small set of FontAwesome icon stubs used during tests.
// Kept minimal and implemented with JSX so they live in a .jsx file.
export const FaBell = (props) => <span {...props}>🔔</span>;
export const FaCheck = (props) => <span {...props}>✅</span>;
export const FaTimes = (props) => <span {...props}>✖️</span>;

export default { FaBell, FaCheck, FaTimes };
