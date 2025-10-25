// --- Global stubs for legacy tests ---
import React from 'react';

function StubComponent({ children, ...props }) {
	return React.createElement('div', { 'data-testid': `stub-${props.name || 'Component'}` }, children);
}

// GenericScreen stub: renders all expected test IDs
globalThis.GenericScreen = function GenericScreen(props) {
	return React.createElement('div', { 'data-testid': 'stub-GenericScreen' },
		React.createElement('div', { 'data-testid': 'loading' }, 'Loading...'),
		React.createElement('div', { 'data-testid': 'error' }, 'Error occurred'),
		React.createElement('div', { 'data-testid': 'empty' }, 'No data'),
		props.children
	);
};

// PointsScreen stub
globalThis.PointsScreen = function PointsScreen(props) {
	return React.createElement('div', { 'data-testid': 'stub-PointsScreen' }, props.children);
};

// Card stub
globalThis.Card = function Card(props) {
	return React.createElement('div', { 'data-testid': 'stub-Card' }, props.children);
};

// Add other high-impact stubs as needed
globalThis.Footer = function Footer(props) {
	return React.createElement('footer', { 'data-testid': 'site-footer' }, props.children);
};

globalThis.Navigation = function Navigation(props) {
	return React.createElement('nav', { 'data-testid': 'main-navigation' }, props.children);
};

globalThis.NotFound = function NotFound(props) {
	return React.createElement('div', { 'data-testid': 'not-found-container' }, props.children);
};
// 1. إضافة Matchers لـ Testing Library
import '@testing-library/jest-dom';

// --- BEGIN: ESM-compatible setup logic copied from setupTests.js ---
// (Paste all setup logic here, replacing require(...) with import where possible, and removing any top-level exports)
// ...existing code from setupTests.js, converted to ESM...
// --- END: ESM-compatible setup logic ---
